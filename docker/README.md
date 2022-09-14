# Run the faucet locally for troubleshooting

Use the following commands to run a local instance of the faucet built directly from sources:

  export SMF_BACKEND_FAUCET_ACCOUNT_MNEMONIC=***
  export SMF_BOT_MATRIX_ACCESS_TOKEN=***
  docker-compose -f docker-compose.<network>.yml up
