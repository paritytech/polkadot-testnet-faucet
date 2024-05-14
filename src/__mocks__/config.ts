export const config = {
  Get: (key: string) => {
    if (key === "FAUCET_ACCOUNT_MNEMONIC") {
      return "initial evolve valve plate south word judge pistol label lizard category cycle";
    }

    if (key === "NETWORK") {
      return process.env.SMF_CONFIG_NETWORK;
    }

    throw new Error(`unknown key ${key}`);
  },
};
