require("dotenv").config();

const common = require("../common.js");

const { AccountCreateTransaction, PrivateKey, Hbar, HbarUnit, TransferTransaction } = require("@hashgraph/sdk");

const configs = {
    operator: {
        accountId: "MY_ACCOUNT_ID",
        privateKey: "MY_PRIVATE_KEY"
    }
}
const numberOfAccounts = 5;


const amountInHbar = Hbar.from(1000, HbarUnit.Hbar).toTinybars();

async function main() {
    try {
      // Exit if required configurations are missing
      const missingConfigs = common.iterateAndCheckValues(configs);
      if (missingConfigs.length > 0) {
        console.log(`Please check the .env file. The following seem to be missing: ${missingConfigs.join()}`);
        process.exit(1);
      }

      // Initiate Hedera connection and set operator with sender's account details
      const { accountId: adminAccountId, privateKey: adminPrivateKey } = await common.getAccountAndKey(
        configs.operator.accountId,
        configs.operator.privateKey
      );
      const client = await common.getClient(adminAccountId, adminPrivateKey);

      // Create the five accounts
      const accounts = [];
      for (let i = 1; i <= numberOfAccounts; i++) {
        const result = await createAccount(`Account${i}`, client);
        accounts.push(result);
      }
     
      // Fund Account 1 and 2


      const txId1 = await sendHbar(adminAccountId, accounts[0].accountId, client);
      await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
      let balance1 = await common.getBalance(accounts[0].accountId, client);
      console.log(`{$accounts[0].accountId} has been funded with ${balance1}`)
      const txId2 = await sendHbar(adminAccountId, accounts[1].accountId, client );
      await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
      let balance2 = await common.getBalance(accounts[0].accountId, client);
      console.log(`{$accounts[0].accountId} has been funded with ${balance2}`)
  
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
    
    process.exit();
  }
  
  async function createAccount(name, client) {
    // Generate a new private key
    const privateKey = await PrivateKey.generate();
  
    // Create an account with the given private key
    const transactionId = await new AccountCreateTransaction()
      .setKey(privateKey.publicKey)
      .setInitialBalance(0)
      .execute(client);
  
    // Get the new account's ID
    const receipt = await transactionId.getReceipt(client);
    const accountId = receipt.accountId.toString();
  
    // Log the account ID and private key to the console
    console.log(`${name}:`);
    console.log(`  Account ID: ${accountId}`);
    console.log(`  Private key: ${privateKey.toString()}`);
  
    return { accountId, privateKey };
  }

  async function sendHbar(senderId, receiverId, client) {
    try {
        // Create the transaction to transfer HBAR
        const transaction = new TransferTransaction()
        .addHbarTransfer(senderId, Hbar.fromTinybars(-1 * amountInHbar)) //Sending account
        .addHbarTransfer(receiverId, Hbar.fromTinybars(amountInHbar)); //Receiving account
        
        // Sign the transaction with the sender's private key
        const signedTxn = await transaction.signWithOperator(client);
    
        // Submit the transaction to the Hedera network
        const txResponse = await signedTxn.execute(client);
    
        // Wait for the transaction to complete
        const receipt = await txResponse.getReceipt(client);
        
        console.log(`Hbar transfer complete. : ${receipt.status}`);
        return receipt.transactionId;
    } catch (error) {
        console.error(`Error: ${error.message}`);
      }
  }
  
  main();