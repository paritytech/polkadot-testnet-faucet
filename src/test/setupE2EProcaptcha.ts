import {ContractDeployer, getPairAsync, ProsopoCaptchaContract, wrapQuery} from "@prosopo/contract";
import {ContractAbi, ContractFile, DappPayee, Hash, Payee, RandomProvider} from "@prosopo/captcha-contract";
import {hexToU8a, stringToU8a} from "@polkadot/util";
import {Abi} from "@polkadot/api-contract";
import {randomAsHex} from "@polkadot/util-crypto";
import {EventRecord} from "@polkadot/types/interfaces";
import {KeyringPair} from "@polkadot/keyring/types";
import {ApiPromise} from "@polkadot/api";

export type ProcaptchaTestSetup = { contract: ProsopoCaptchaContract, contractAddress: string, testAccount: string, siteKey: string }

export async function setupProcaptcha(api: ApiPromise, siteKey: string, port:number): Promise<ProcaptchaTestSetup> {
    try {
        await api.isReady;
        const alicePair = await getPairAsync(undefined, '//Alice', undefined, 'sr25519', 42)
        const contract = await deployProcaptchaContract(api, alicePair);
        console.log("Captcha contract address", contract.address.toString())

        // Set the calling pair to Bob so that he is registered as the provider (the calling account is registered in the contract as the provider)
        contract.pair = await getPairAsync(undefined, '//Bob', undefined, 'sr25519', 42);

        await procaptchaProviderRegister(contract, port);
        console.log(`Registered Bob ${contract.pair.address} as provider`)
        await procaptchaProviderSetDataset(contract);

        // any account can register an app site key so using Bob will be fine
        await procaptchaAppRegister(contract, siteKey);

        // get random active provider and block number from response
        //const randomProvider = await procaptchaGetRandomProvider(contract, siteKey, alicePair.address)

        return {contract, contractAddress: contract.address, testAccount: alicePair.address, siteKey: siteKey}
    } catch (e) {
        console.error(e)
        throw new Error (`Failed to setup Procaptcha: ${JSON.stringify(e, null ,4)}`)
    }
}

export async function deployProcaptchaContract(api: ApiPromise, pair: KeyringPair): Promise<ProsopoCaptchaContract> {

    console.log("Deploying Procaptcha contract")
    // Get the contract artefacts from the prosopo captcha contract package
    const jsonContent = JSON.parse(ContractFile)
    const hex = jsonContent['source']['wasm']
    const wasm = hexToU8a(hex)
    const abi = new Abi(ContractAbi)

    // Deploy the contract
    const params: any[] = []
    const deployer = new ContractDeployer(api, abi, wasm, pair, params, 0, 0, randomAsHex())
    const deployResult = await deployer.deploy()
    const instantiateEvent: EventRecord | undefined = deployResult.events.find(
        (event) => event.event.section === 'contracts' && event.event.method === 'Instantiated'
    )
    if (instantiateEvent && 'contract' in instantiateEvent.event.data ){
        const address =  <string>instantiateEvent?.event.data.contract
        return new ProsopoCaptchaContract(api, abi, address,'procaptcha', 0, pair)
    }
    throw new Error(`Failed to deploy Procaptcha contract: ${JSON.stringify(deployResult)}`)

}

export async function procaptchaProviderRegister(contract: ProsopoCaptchaContract, port: number): Promise<void> {
    try {
        console.log("Registering Procaptcha provider")
        const providerRegisterArgs: Parameters<typeof contract.query.providerRegister> = [
            Array.from(stringToU8a(`http://host.docker.internal:${port}`)),
            0,
            Payee.dapp,
            {
                value: 1000000000, // minimum value for a captcha provider to be active in the contract
            },
        ]
        await wrapQuery(contract.query.providerRegister, contract.query)(...providerRegisterArgs)
        await contract.tx.providerRegister(...providerRegisterArgs)
    } catch(e) {
        console.error(e)
        throw new Error (`Failed to register Procaptcha provider: ${JSON.stringify(e, null ,4)}`)
    }
}

export async function procaptchaProviderSetDataset(contract: ProsopoCaptchaContract): Promise<{ datasetId:Hash, datasetContentId:Hash }> {
    try {
        console.log("Setting Procaptcha provider dataset")
        const dataset = {
            datasetId: "0x28c1ba9d21c00f2e29c9ace8c46fd7dbfbb6f5a5f516771278635ac3ab88c267", // hashed value of "TESTDATASET"
            datasetContentId: "0x7d23f5c5e496dc1c9bcf66c62e2ba7a60152f1486ef6032b56809badf0a48427", // hashed value of "TESTDATASETCONTENT"
        }

        await wrapQuery(contract.query.providerSetDataset, contract.query)(
            dataset.datasetId,
            dataset.datasetContentId
        )
        await contract.methods.providerSetDataset(dataset.datasetId, dataset.datasetContentId, {
            value: 0,
        })
        return dataset
    } catch(e) {
        throw new Error (`Failed to set Procaptcha provider dataset: ${JSON.stringify(e, null ,4)}`)
    }
}

export async function procaptchaAppRegister(contract: ProsopoCaptchaContract, siteKey: string): Promise<void> {
    try {
        console.log("Registering Procaptcha app")
        const appRegisterArgs: Parameters<typeof contract.query.dappRegister> = [
            siteKey,
            DappPayee.dapp,
            {
                value: 1000000000, // minimum value for an app to be active in the contract
            },
        ]
        await wrapQuery(contract.query.dappRegister, contract.query)(...appRegisterArgs)
        await contract.tx.dappRegister(...appRegisterArgs)
    } catch(e) {
        throw new Error (`Failed to register Procaptcha app: ${JSON.stringify(e, null ,4)}`)
    }
}

export async function procaptchaGetRandomProvider(contract: ProsopoCaptchaContract, siteKey: string, userAccount:string): Promise<RandomProvider> {
    try {
        console.log("Getting Procaptcha random captcha provider")
        // get a random provider
        return await wrapQuery(
            contract.query.getRandomActiveProvider,
            contract.query
        )(userAccount, siteKey)
    } catch(e) {
        throw new Error (`Failed to get Procaptcha random captcha provider: ${JSON.stringify(e, null ,4)}`)
    }
}


