import "dotenv/config";
import { makeContractCall, broadcastTransaction, AnchorMode, uintCV, standardPrincipalCV } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { generateWallet } from '@stacks/wallet-sdk';


async function main() {
    console.log("🚀 Minting USDCx Mock Tokens...");

    let privateKey = process.env.STACKS_PRIVATE_KEY;
    if (!privateKey && process.env.STACKS_MNEMONIC) {
        const wallet = await generateWallet({
            secretKey: process.env.STACKS_MNEMONIC,
            password: 'optional-password'
        });
        privateKey = wallet.accounts[0].stxPrivateKey;
    }

    if (!privateKey) throw new Error("Missing private key");

    // Address to receive tokens
    const recipient = 'ST13T9VVWP9XHRHFMTSYPNDWN986AEK4WQ2DYQ0Q2';
    const amount = 1000000 * 1000000; // 1 Million USDCx (6 decimals)

    const contractAddress = 'ST13T9VVWP9XHRHFMTSYPNDWN986AEK4WQ2DYQ0Q2';
    const contractName = 'usdcx-mock';
    const functionName = 'mint';

    const transaction = await makeContractCall({
        contractAddress,
        contractName,
        functionName,
        functionArgs: [uintCV(amount), standardPrincipalCV(recipient)],
        senderKey: privateKey,
        network: STACKS_TESTNET,
        anchorMode: AnchorMode.Any,
    } as any);

    const result = await broadcastTransaction({ transaction } as any);
    console.log("Tx ID:", (result as any).txid || result);
}
main().catch(console.error);
