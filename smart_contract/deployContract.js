/**

Hedera  certification exam Node.js code for creating and deploying a smart contract on Hedera Hashgraph
using the @hashgraph/sdk library and a .env file 
*/

require("dotenv").config(); // Load environment variables from .env file

const common = require("../common.js"); // Custom module for common Hedera functions
const path = require('path');
const {
    FileCreateTransaction,
    ContractCreateTransaction,
    ContractFunctionParameters,
    ContractExecuteTransaction
} = require("@hashgraph/sdk"); // Hedera SDK

// Read account ID and private key from environment variables
const configs = {
    accountId: "Account1_ID",
    privateKey: "Account1_PRIVATE_KEY"
};

const { readFile } = require("fs").promises;
const abiDecoder = require("abi-decoder");

async function main() {
    try {
        // Exit if required configurations are missing
        const missingConfigs = common.iterateAndCheckValues(configs);
        if (missingConfigs.length > 0) {
            console.log(`Please check the .env file. The following seem to be missing : ${missingConfigs.join()}`);
            process.exit(1);
        }

        // Initiate Hedera connection and set operator with sender's account details
        const { accountId, privateKey } = await common.getAccountAndKey(configs.accountId, configs.privateKey);
        const client = await common.getClient(accountId, privateKey);

        // Read bytecode from compiled contract file
        const filePath = path.join(__dirname, './artifacts/CertificationC1.json');
        const solidityCompiled = require(filePath);
        const bytecode = solidityCompiled.bytecode;

        // Create a file on Hedera and store the hex-encoded bytecode
        const fileCreateTx = new FileCreateTransaction()
            .setContents(bytecode);
        const submitTx = await fileCreateTx.execute(client);

        // Get the receipt of the file create transaction
        const fileReceipt = await submitTx.getReceipt(client);

        // Get the file ID from the receipt
        const bytecodeFileId = fileReceipt.fileId;

        // Log the file ID
        console.log(`The smart contract byte code file ID is ${bytecodeFileId}` )

        // Instantiate the contract instance
        const contractTx = await new ContractCreateTransaction()
            .setBytecodeFileId(bytecodeFileId) // Set the file ID of the Hedera file storing the bytecode
            .setGas(100000) // Set the gas to instantiate the contract
            .setConstructorParameters(new ContractFunctionParameters().addString("Off to Hedera!")); // Provide the constructor parameters for the contract

        // Submit the transaction to the Hedera test network
        const contractResponse = await contractTx.execute(client);

        // Get the receipt of the contract create transaction
        const contractReceipt = await contractResponse.getReceipt(client);

        // Get the smart contract ID
        const newContractId = contractReceipt.contractId;

        // Log the smart contract ID
        console.log(`The smart contract ID is ${newContractId}`);

        // Call function1
        const contractExecTx = await new ContractExecuteTransaction()
        .setContractId(newContractId)
        .setGas(100000)
        .setFunction("function1")
        .setArguments([6, 7]);
        

    //Submit the transaction to a Hedera network and store the response
    const submitExecTx = await contractExecTx.execute(client);

    //Get the receipt of the transaction
    const receipt1 = await submitExecTx.getReceipt(client);

        
    //Confirm the transaction was executed successfully
    console.log("The transaction status is " + receipt1.status.toString());


    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
    process.exit()
}
/**
 * Decodes event contents using the ABI definition of the event
 * @param eventName the name of the event
 * @param log log data as a Hex string
 * @param topics an array of event topics
 */
function decodeEvent(eventName, log, topics) {
    const filePath = path.join(__dirname, './artifacts/Eseal.json');
    const abiFile = require(filePath);
    abi = abiFile.abi;
    const eventAbi = abi.find(event => (event.name === eventName && event.type === "event"));
    const decodedLog = web3.eth.abi.decodeLog(eventAbi.inputs, log, topics);
    console.log(decodedLog);
    return decodedLog;
}
main(); // Call the main function to start the program execution.
