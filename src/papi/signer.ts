import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import { entropyToMiniSecret, mnemonicToEntropy, parseSuri } from "@polkadot-labs/hdkd-helpers";
import { getPolkadotSigner } from "polkadot-api/signer";

import { config } from "src/config";

const suri = parseSuri(config.Get("FAUCET_ACCOUNT_MNEMONIC"));

const entropy = mnemonicToEntropy(suri.phrase);
const miniSecret = entropyToMiniSecret(entropy);
const hdkdKeyPair = sr25519CreateDerive(miniSecret)(suri.paths);

export const signer = getPolkadotSigner(hdkdKeyPair.publicKey, "Sr25519", (input) => hdkdKeyPair.sign(input));
