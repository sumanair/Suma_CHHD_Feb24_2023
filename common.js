/**
This is a JavaScript file that exports several functions used across the different use cases for a Hedera certification exam. 
Suma, 2/24/23
*/


const {
    Client,
    AccountId,
    PrivateKey,
    TokenInfoQuery,
    AccountBalanceQuery,
    Hbar,
    HbarUnit,
    TransferTransaction
  } = require("@hashgraph/sdk");

/**
 * Retrieves environment variables for account and key, and checks that they are valid. Returns an object with accountId and privateKey.
 * @param accId  : the account id to be retrieved
 * @param accKey : the private key to be retrieved
 */
  async function getAccountAndKey(accId, accKey) {
    const accountId = AccountId.fromString(process.env[accId]);
    const privateKey = PrivateKey.fromString(process.env[accKey]);
    return { accountId, privateKey };
  }
  
/**
 * Creates a client operator based on the account and key provided.
 * @param accountId  : the account id to be retrieved
 * @param privateKey : the private key to be retrieved
 */
  async function getClient(accountId, privateKey) {
    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);
    return client;
  }
/**
 * Creates a client operator based on the account and key provided.
 * @param tokenQuery  : the account id to be retrieved
 * @param tokenId : the private key to be retrieved
 * @param client : the private key to be retrieved  
 */
  async function queryTokenInfo(
    tokenQuery,
    tokenId,
    client,
    arrayName = "",
    arrayIndex = 0
  ) {
    const query = await new TokenInfoQuery().setTokenId(tokenId);
    console.log(`Querying token info for ${tokenId}`);
    const tokenInfo = await query.execute(client);
    const results = tokenQuery.map(({ name, displayName }) => ({
      displayName,
      value: tokenInfo[name],
    }));
    console.log(`Token information :`);
    for (const { displayName, value } of results) {
      if (typeof value === "object" && value !== null) {
        console.log(`${displayName}`);
        if (arrayName != "") {
          if (displayName === arrayName) console.table(value[arrayIndex]);
        } else console.table(value);
      } else {
        console.log(`${displayName}: ${value.toString()}`);
      }
    }
    return results;
  }
  
  async function getTransactionReceiptInfo(
    txResponse,
    client,
    responseRequested = "status"
  ) {
    const receipt = await txResponse.getReceipt(client);
  
    let transactionResponse = receipt.status;
    if (responseRequested != "status)") {
      if (responseRequested != "ALL") {
        transactionResponse = receipt[responseRequested];
      } else {
        transactionResponse = receipt.toString();
      }
    }
    return transactionResponse;
  }
  
  function iterateAndCheckValues(obj) {
    let missingVariables = [];
  
    for (let key in obj) {
      if (typeof obj[key] === "object") {
        missingVariables = missingVariables.concat(iterateAndCheckValues(obj[key]));
      } else {
        if (!process.env[obj[key]]) {
          missingVariables.push(obj[key]);
        }
      }
    }
    return missingVariables;
  }
  
  async function getAccountBalance(accountId, client) {
    const balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    return balanceCheckTx;
  }
  
  async function sleepSeconds(x) {
    await new Promise((resolve) => setTimeout(resolve, x * 1000));
  }
  
  function line() {
    console.log("-".repeat(50));
  }
  
  async function getBalance(accountId, client) {
    try {
      // Request the cost of the query
      const queryCost = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .getCost(client);
  
      console.log("The cost of the query is: " + queryCost);
  
      // Execute the query to get the account balance
      const accountBalance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);
  
      console.log("The account balance is: " + accountBalance.hbars.toTinybars() + " tinybar.");
      return accountBalance.hbars.toTinybars();

    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
  
  function getAmountInTinybars(amountInHbar) {
    let amount = Hbar.from(amountInHbar, HbarUnit.Hbar).toTinybars();
    console.log("Amount is ",amount );
    return amount;
  }

  // Fund accounts
async function fundWithHbar(senderId, receiverId, client, transferAmount) {
    try {
        // Create the transaction to transfer HBAR

        const transaction = new TransferTransaction()
        .addHbarTransfer(senderId, Hbar.fromTinybars(-1 * transferAmount)) //Sending account
        .addHbarTransfer(receiverId, Hbar.fromTinybars(transferAmount)); //Receiving account
        
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

  module.exports = {
    getAccountAndKey,
    getClient,
    queryTokenInfo,
    getTransactionReceiptInfo,
    iterateAndCheckValues,
    getAccountBalance,
    sleepSeconds,
    line,
    getBalance,
    getAmountInTinybars,
    fundWithHbar,
  };
  

 