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
    console.log("🚀 Deploying USDCx Mock Token...");

    let privateKey = process.env.STACKS_PRIVATE_KEY;
    if (!privateKey && process.env.STACKS_MNEMONIC) {
        const wallet = await generateWallet({
            secretKey: process.env.STACKS_MNEMONIC,
            password: 'optional-password'
        });
        privateKey = wallet.accounts[0].stxPrivateKey;
    }

    if (!privateKey) {
        throw new Error("Missing STACKS_PRIVATE_KEY or STACKS_MNEMONIC");
    }

    // Quick address derivation (hacky but works if we use wallet-sdk later or just trust the process)
    // Actually, we can't easily derive address from private key here without imported util, 
    // but the transaction broadcast result usually contains it or we can check explorer.
    // Let's just run it and check the dashboard/explorer if needed, or assume it matches the .env address.

    const contractPath = path.resolve(__dirname, '../../../contracts/usdcx-mock.clar');
    if (!fs.existsSync(contractPath)) {
        throw new Error(`Contract not found at: ${contractPath}`);
    }
    const codeBody = fs.readFileSync(contractPath, 'utf8');

    const contractName = "usdcx-mock";

    console.log(`Contract Name: ${contractName}`);

    const deployOptions: any = {
        codeBody,
        contractName,
        senderKey: privateKey,
        network: STACKS_TESTNET,
        anchorMode: AnchorMode.Any,
    };

    const transaction = await makeContractDeploy(deployOptions);

    console.log("📡 Broadcasting...");
    const result = await broadcastTransaction({ transaction } as any);

    if ((result as any).error) {
        console.error("❌ Broadcast failed:", (result as any).error);
        console.error("Reason:", (result as any).reason);
        console.error("Reason Data:", (result as any).reason_data);
    } else {
        console.log("✅ Token Deployed!");
        const txid = (result as any).txid || result;
        console.log(`🔗 Tx ID: 0x${txid}`);
        console.log(`NOTE: The contract address will be <DEPLOYER_ADDRESS>.${contractName}`);
    }
}

main().catch(console.error);
