import "dotenv/config";
import { callReadOnlyFunction, cvToValue } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

async function main() {
    const deployerAddress = 'ST13T9VVWP9XHRHFMTSYPNDWN986AEK4WQ2DYQ0Q2';
    const contractName = 'usdcx-mock';
    const functionName = 'get-name';

    console.log(`Checking ${deployerAddress}.${contractName}::${functionName}...`);

    const result = await callReadOnlyFunction({
        contractAddress: deployerAddress,
        contractName: contractName,
        functionName: functionName,
        functionArgs: [],
        network: STACKS_TESTNET,
        senderAddress: deployerAddress,
    });

    console.log("Result:", cvToValue(result));
}

main().catch(console.error);
