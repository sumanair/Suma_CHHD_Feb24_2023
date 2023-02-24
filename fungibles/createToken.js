require("dotenv").config();

const {
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    Wallet
} = require("@hashgraph/sdk");

const common = require("../common.js");

const configs = {
    account1: {
      accountId: "Account1_ID",
      privateKey: "Account1_PRIVATE_KEY"
    },
    account2: {
      accountId: "Account2_ID",
      privateKey: "Account2_PRIVATE_KEY"
    },
}

const tokenQuery = [
    { name: 'name', displayName: 'Name' },
    { name: 'symbol', displayName: 'Symbol' },
    { name: 'totalSupply', displayName: 'Total Supply' },
  ];

async function main() {
    try {

      // Exit if required configurations are missing
      const missingConfigs = common.iterateAndCheckValues(configs);
      if (missingConfigs.length >0) {
        console.log(`Please check your .env file. The following seem to be missing : ${missingConfigs.join()}`);
        process.exit(1);
      }
      //get accounts and keys
      const { accountId: account1Id, privateKey:account1Key } 
            = await common.getAccountAndKey(configs.account1.accountId, configs.account1.privateKey);
      const { accountId: account2Id, privateKey:account2Key } = 
            await common.getAccountAndKey(configs.account2.accountId, configs.account2.privateKey);
    const client = await common.getClient(account1Id, account1Key);

    const owner = new Wallet(
        account1Id,
        account1Key
    )

    const supplier = new Wallet(
        account2Id,
        account2Key
    )

    const transaction = await new TokenCreateTransaction()
        .setTokenName("Suma Fungible Token")
        .setTokenSymbol("SFT")
        .setTokenType(TokenType.FungibleCommon)
        .setTreasuryAccountId(account1Id)
        .setInitialSupply(35050)
        .setDecimals(2)
        .setSupplyType(TokenSupplyType.FINITE)
        .setMaxSupply(50000)
        .setAdminKey(owner.publicKey) 
        .setSupplyKey(supplier.publicKey) 
        .freezeWith(client);

    //Sign the transaction with the client, who is set as admin and treasury account
    const signTx =  await transaction.sign(account1Key);

    //Submit to a Hedera network
    const txResponse = await signTx.execute(client);

    //Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the token ID from the receipt
    const tokenId = receipt.tokenId;

    
    console.log("The new token ID is " + tokenId);

    //Sign with the client operator private key, submit the query to the network and get the token supply

    tokenInfo = await common.queryTokenInfo(tokenQuery, tokenId, client);
    
    
    process.exit();
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
      }   
      process.exit();
    }


main();
