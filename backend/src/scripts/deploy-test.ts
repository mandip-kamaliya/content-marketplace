import "dotenv/config";
import { makeContractDeploy, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { generateWallet } from '@stacks/wallet-sdk';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    console.log("🚀 Deploying Test Contract...");
    let privateKey = process.env.STACKS_PRIVATE_KEY;
    if (!privateKey && process.env.STACKS_MNEMONIC) {
        const wallet = await generateWallet({ secretKey: process.env.STACKS_MNEMONIC, password: 'optional-password' });
        privateKey = wallet.accounts[0].stxPrivateKey;
    }

    const codeBody = fs.readFileSync(path.resolve(__dirname, '../../../contracts/test-deploy.clar'), 'utf8');
    const contractName = "test-deploy-v1";

    const transaction = await makeContractDeploy({
        codeBody,
        contractName,
        senderKey: privateKey!,
        network: STACKS_TESTNET,
        anchorMode: AnchorMode.Any,
    } as any);

    const result = await broadcastTransaction({ transaction } as any);
    console.log("Tx ID:", (result as any).txid || result);
}
main().catch(console.error);
