import {ContractDeployer, getPairAsync, ProsopoCaptchaContract, wrapQuery, getWeight, getOptions} from "@prosopo/contract";
import {ContractAbi, ContractFile, DappPayee, Hash, Payee, RandomProvider} from "@prosopo/captcha-contract";
import {hexToU8a, stringToU8a} from "@polkadot/util";
import {Abi} from "@polkadot/api-contract";
import {randomAsHex} from "@polkadot/util-crypto";
import {EventRecord} from "@polkadot/types/interfaces";
import {KeyringPair} from "@polkadot/keyring/types";
import {ApiPromise} from "@polkadot/api";
import {TransactionQueue} from "@prosopo/tx"
import {ContractSubmittableResult} from '@polkadot/api-contract/base/Contract'
import BN from "bn.js";
import {get} from '@prosopo/util'

export type ProcaptchaTestSetup = {
    contract: ProsopoCaptchaContract,
    contractAddress: string,
    testAccount: string,
    siteKey: string
}

const GAS_INCREASE_FACTOR = 2

export class ProcaptchaSetup {
    public api: ApiPromise;
    public siteKey: string;
    public port: number;
    private _transactionQueue: TransactionQueue | undefined;

    constructor(api: ApiPromise, siteKey: string, port: number) {
        this.api = api;
        this.siteKey = siteKey;
        this.port = port;
    }

    get transactionQueue(): TransactionQueue {
        if (!this._transactionQueue) {
            throw new Error("Transaction queue not initialized")
        }
        return this._transactionQueue
    }

    set transactionQueue(txQueue: TransactionQueue) {
        this._transactionQueue = txQueue
    }

    async isReady() {
            await this.api.isReady;
            const alicePair = await getPairAsync(undefined, '//Alice', undefined, 'sr25519', 42)
            const contract = await this.deployProcaptchaContract(alicePair);
            console.log("Captcha contract address", contract.address.toString())
            this.transactionQueue = new TransactionQueue(this.api, alicePair)

            // Set the calling pair to Bob so that he is registered as the provider (the calling account is registered in the contract as the provider)
            contract.pair = await getPairAsync(undefined, '//Bob', undefined, 'sr25519', 42);

            await this.procaptchaProviderRegister(contract, this.port);
            console.log(`Registered Bob ${contract.pair.address} as provider`)
            await this.procaptchaProviderSetDataset(contract);

            // any account can register an app site key so using Bob will be fine
            await this.procaptchaAppRegister(contract, this.siteKey);

            return {contract, contractAddress: contract.address, testAccount: alicePair.address, siteKey: this.siteKey}

    }


    async deployProcaptchaContract(pair: KeyringPair): Promise<ProsopoCaptchaContract> {

        console.log("Deploying Procaptcha contract")
        // Get the contract artefacts from the prosopo captcha contract package
        const jsonContent = JSON.parse(ContractFile)
        const hex = jsonContent['source']['wasm']
        const wasm = hexToU8a(hex)
        const abi = new Abi(ContractAbi)

        // Deploy the contract
        const params: any[] = []
        const deployer = new ContractDeployer(this.api, abi, wasm, pair, params, 0, 0, randomAsHex())
        const deployResult = await deployer.deploy()
        const instantiateEvent: EventRecord | undefined = deployResult.events.find(
            (event) => event.event.section === 'contracts' && event.event.method === 'Instantiated'
        )
        if (instantiateEvent && 'contract' in instantiateEvent.event.data) {
            const address = <string>instantiateEvent?.event.data.contract
            return new ProsopoCaptchaContract(this.api, abi, address, 'procaptcha', 0, pair)
        }
        throw new Error(`Failed to deploy Procaptcha contract: ${JSON.stringify(deployResult)}`)

    }

    async procaptchaProviderRegister(contract: ProsopoCaptchaContract, port: number): Promise<void> {
            console.log("Registering Procaptcha provider")
            const value = (await contract.query.getProviderStakeThreshold()).value.unwrap().toNumber()
            const providerRegisterArgs: Parameters<typeof contract.query.providerRegister> = [
                Array.from(stringToU8a(`http://host.docker.internal:${port}`)),
                0,
                Payee.dapp
            ]
            await this.submitTx(contract, contract.query.providerRegister.name, providerRegisterArgs, value, contract.pair)

    }

    async procaptchaProviderSetDataset(contract: ProsopoCaptchaContract): Promise<{
        datasetId: Hash,
        datasetContentId: Hash
    }> {
            console.log("Setting Procaptcha provider dataset")
            const providerSetDatasetArgs: Parameters<typeof contract.query.providerSetDataset> = [
                "0x28c1ba9d21c00f2e29c9ace8c46fd7dbfbb6f5a5f516771278635ac3ab88c267" as Hash, // hashed value of "TESTDATASET"
                "0x7d23f5c5e496dc1c9bcf66c62e2ba7a60152f1486ef6032b56809badf0a48427" as Hash, // hashed value of "TESTDATASETCONTENT"
            ]

            await this.submitTx(contract, 'providerSetDataset', providerSetDatasetArgs, 0, contract.pair)
            return {
                datasetId: providerSetDatasetArgs[0],
                datasetContentId: providerSetDatasetArgs[1]
            }

    }

    async procaptchaAppRegister(contract: ProsopoCaptchaContract, siteKey: string): Promise<void> {
            console.log("Registering Procaptcha app")
            const value = (await contract.query.getDappStakeThreshold()).value.unwrap().toNumber()
            const appRegisterArgs: Parameters<typeof contract.query.dappRegister> = [
                siteKey,
                DappPayee.dapp
            ]
            await this.submitTx(contract, contract.query.dappRegister.name, appRegisterArgs, value)

    }

    private async submitTx(
        contract: ProsopoCaptchaContract,
        methodName: string,
        args: any[],
        value: number | BN,
        pair?: KeyringPair
    ): Promise<ContractSubmittableResult> {

        if (
            contract.nativeContract.tx &&
            methodName in contract.nativeContract.tx &&
            contract.nativeContract.tx[methodName] !== undefined
        ) {

                const weight = await getWeight(this.api)
                const txPair = pair ? pair : contract.pair

                const {gasRequired, storageDeposit} = await contract.nativeContract.query[methodName]!(
                    txPair.address,
                    {gasLimit: weight.weightV2, storageDepositLimit: null, value: value ? value : 0},
                    ...args
                )

                // Increase the gas required by a factor of `GAS_INCREASE_FACTOR` to make sure we don't hit contracts.StorageDepositLimitExhausted
                const weight2 = this.api.registry.createType('WeightV2', {
                    refTime: gasRequired.refTime.toBn().muln(GAS_INCREASE_FACTOR),
                    proofSize: gasRequired.proofSize.toBn().muln(GAS_INCREASE_FACTOR),
                })
                const options = {value, gasLimit: weight2, storageDepositLimit: null}
                const method = get(contract.nativeContract.query, methodName)
                const extrinsic = method(txPair.address, options, ...args)
                const secondResult = await extrinsic
                const message = contract.getContractMethod(methodName   )
                if (secondResult.result.isErr) {
                    const error = secondResult.result.asErr
                    const mod = error.asModule
                    const dispatchError = error.registry.findMetaError(mod)
                    throw new Error(JSON.stringify({
                        context: {
                            error: `${dispatchError.section}.${dispatchError.name}`,
                            caller: txPair.address,
                            failedContractMethod: methodName,
                        }})
                    )
                }
                // will throw an error if the contract reverted
                contract.getQueryResult(message, secondResult, args)

                const extrinsicTx = get(contract.nativeContract.tx, message.method)(options, ...args)

                return new Promise((resolve, reject) => {
                    this.transactionQueue.add(
                        extrinsicTx,
                        (result: ContractSubmittableResult) => {
                            resolve(result)
                        },
                        pair,
                        methodName
                    ).catch((err) => {
                        reject(err)
                    })
                })


        } else {
            throw new Error('CONTRACT.INVALID_METHOD')
        }
    }
}

export async function procaptchaGetRandomProvider(contract: ProsopoCaptchaContract, siteKey: string, userAccount: string): Promise<RandomProvider> {
    try {
        console.log("Getting Procaptcha random captcha provider")
        // get a random provider
        return await wrapQuery(
            contract.query.getRandomActiveProvider,
            contract.query
        )(userAccount, siteKey)
    } catch (e) {
        throw new Error(`Failed to get Procaptcha random captcha provider: ${JSON.stringify(e, null, 4)}`)
    }
}


export async function setupProcaptcha(api: ApiPromise, siteKey: string, port: number): Promise<ProcaptchaTestSetup> {
    const setup = new ProcaptchaSetup(api, siteKey, port)
    return await setup.isReady()
}





