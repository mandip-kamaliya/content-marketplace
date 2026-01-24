import "dotenv/config";
import {
    makeContractDeploy,
    broadcastTransaction,
    AnchorMode,
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { generateWallet } from '@stacks/wallet-sdk';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    console.log("🚀 Deploying Content Marketplace Contract...");

    // 1. Get Private Key
    let privateKey = process.env.STACKS_PRIVATE_KEY;
    if (!privateKey && process.env.STACKS_MNEMONIC) {
        console.log("🔑 Deriving private key from mnemonic...");
        const wallet = await generateWallet({
            secretKey: process.env.STACKS_MNEMONIC,
            password: 'optional-password'
        });
        privateKey = wallet.accounts[0].stxPrivateKey;
    }

    if (!privateKey) {
        throw new Error("Missing STACKS_PRIVATE_KEY or STACKS_MNEMONIC");
    }

    // 2. Read Contract Source (Corrected Path)
    const contractPath = path.resolve(__dirname, '../../../contracts/content-marketplace.clar');
    if (!fs.existsSync(contractPath)) {
        throw new Error(`Contract not found at: ${contractPath}`);
    }
    const codeBody = fs.readFileSync(contractPath, 'utf8');

    // 3. Define New Contract Name (Incrementing version)
    const contractName = "content-marketplace-v7";

    console.log(`📜 Contract Name: ${contractName}`);
    console.log(`📄 Reading from: ${contractPath}`);

    // 4. Create Transaction
    // Cast options to any to bypass strict type check for anchorMode/network properties in v7
    const deployOptions: any = {
        codeBody,
        contractName,
        senderKey: privateKey,
        network: STACKS_TESTNET,
        anchorMode: AnchorMode.Any,
    };

    const transaction = await makeContractDeploy(deployOptions);

    // 5. Broadcast
    console.log("📡 Broadcasting transaction...");

    // Bypass type check for broadcast argument and wrap in object for v7
    // Stacks.js v7 expects { transaction } but some versions might vary, 
    // wrapping it is the safest bet for the error we saw ("serialize undefined").
    const result = await broadcastTransaction({ transaction } as any);

    if ((result as any).error) {
        console.error("❌ Broadcast failed:", (result as any).error);
        console.error("Reason:", (result as any).reason);
        console.error("Reason Data:", (result as any).reason_data);
    } else {
        console.log("✅ Transaction Broadcasted!");
        const txid = (result as any).txid || result;
        console.log(`🔗 Tx ID: 0x${txid}`);

        console.log("\n⚠️  IMPORTANT: Wait for confirmation (approx 10-15 mins).");
        console.log("Then update your .env files with:");
        console.log(`CONTRACT_NAME=${contractName}`);
        console.log(`CONTRACT_ADDRESS=<YOUR_STX_ADDRESS>.${contractName}`);
    }
}

main().catch(console.error);
