require("dotenv").config();
const {
    TransferTransaction,
    Client,
    ScheduleCreateTransaction,
    PrivateKey,
    Hbar, ScheduleInfoQuery
} = require("@hashgraph/sdk");

const myAccountId = process.env.MY_ACCOUNT_ID;
const myPrivateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);

const account1Id = process.env.Account1_ID;
const account1PrivateKey = PrivateKey.fromString(process.env.Account1_PRIVATE_KEY);

const account2Id = process.env.Account2_ID;


// If we weren't able to grab it, we should throw a new error
if (myAccountId == null ||
    myPrivateKey == null ) {
    throw new Error("Environment variables myAccountId and myPrivateKey must be present");
}

// Create our connection to the Hedera network
// The Hedera JS SDK makes this really easy!
const client = Client.forTestnet();

client.setOperator(myAccountId, myPrivateKey);

async function main() {

    //I had to repeat, so slightly tweaking the amount
    //Create a transaction to schedule
    const transaction = new TransferTransaction()
        .addHbarTransfer(account1Id, Hbar.fromTinybars(-100000004))
        .addHbarTransfer(account2Id, Hbar.fromTinybars(100000004));

    //Schedule a transaction
    const scheduleTransaction = await new ScheduleCreateTransaction()
        .setScheduledTransaction(transaction)
        .setScheduleMemo("Scheduled TX!")
        .setAdminKey(myPrivateKey)
        .execute(client);

    //Get the receipt of the transaction
    const receipt = await scheduleTransaction.getReceipt(client);

    //Get the schedule ID
    const scheduleId = receipt.scheduleId;
    console.log("The schedule ID is " +scheduleId);

    //Get the scheduled transaction ID
    const scheduledTxId = receipt.scheduledTransactionId;
    console.log("The scheduled transaction ID is " +scheduledTxId);

    // Serialize and export the transaction to base64 format
    const serializedScheduleCreateTx = scheduleTransaction.toString().toBytes();
    const base64ScheduleCreateTx = Buffer.from(serializedScheduleCreateTx).toString("base64");

    console.log("Scheduled transaction created with ID:", scheduleId.toString());
    console.log("Serialized transaction:", serializedScheduleCreateTx);
    console.log("Base64 transaction:", base64ScheduleCreateTx);
    const fs = require('fs')
      
    // Data which will write in a file.
    let data = base64ScheduleCreateTx
      
    // Write data in 'Output.txt' .
    fs.writeFile('serialized.txt', data, (err) => {
          
        // In case of a error throw err.
        if (err) throw err;
    })

    process.exit();
}

main();
