import "dotenv/config";
import {
    createPublicClient,
    http,
    parseAbiItem
} from "viem";
import { sepolia } from "viem/chains";
import { makeContractCall, broadcastTransaction, AnchorMode, Cl } from '@stacks/transactions';
import { generateWallet } from '@stacks/wallet-sdk';
import { remoteRecipientCoder } from "./helpers";

// ============ Configuration ============
const config = {
    ETH_RPC_URL: process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com",
    X_RESERVE_CONTRACT: "0x008888878f94C0d87defdf0B07f46B93C1934442", // Sepolia
    STACKS_CONTRACT_ADDR: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    STACKS_CONTRACT_NAME: "usdcx-v1",
    STACKS_PRIVATE_KEY: process.env.STACKS_PRIVATE_KEY,
};

// ============ ABIs ============
const DEPOSIT_EVENT = parseAbiItem(
    'event Deposit(uint256 value, uint32 remoteDomain, bytes32 remoteRecipient, address localToken, uint256 maxFee, bytes hookData)'
);

// ============ Main Listener ============
async function main() {
    console.log("🌉 Starting Bridge Relayer (Ethereum -> Stacks)...");

    // Handle Mnemonic if Private Key is missing
    if (!config.STACKS_PRIVATE_KEY && process.env.STACKS_MNEMONIC) {
        console.log("🔑 Deriving private key from mnemonic...");
        const wallet = await generateWallet({
            secretKey: process.env.STACKS_MNEMONIC,
            password: 'optional-password'
        });
        config.STACKS_PRIVATE_KEY = wallet.accounts[0].stxPrivateKey;
    }

    if (!config.STACKS_PRIVATE_KEY) {
        throw new Error("Missing STACKS_PRIVATE_KEY or STACKS_MNEMONIC in .env");
    }

    const client = createPublicClient({
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
    });

    console.log(`Listening for events on ${config.X_RESERVE_CONTRACT}...`);

    // Watch for new events
    client.watchEvent({
        address: config.X_RESERVE_CONTRACT as `0x${string}`,
        event: DEPOSIT_EVENT,
        onLogs: (logs) => {
            logs.forEach(processLog);
        },
    });
}

// ============ Event Processor ============
async function processLog(log: any) {
    try {
        const { value, remoteRecipient, remoteDomain } = log.args;
        const txHash = log.transactionHash;

        console.log(`\n🔔 New Deposit Detected!`);
        console.log(`   Tx Hash: ${txHash}`);
        console.log(`   Amount: ${Number(value) / 1e6} USDC`);
        console.log(`   Target Domain: ${remoteDomain}`);

        // 1. Check if domain matches Stacks (10003)
        if (remoteDomain !== 10003) {
            console.log(`   ⚠️ Skipped: Not for Stacks (Domain ${remoteDomain})`);
            return;
        }

        // 2. Decode Recipient
        const stacksAddress = remoteRecipientCoder.decode(remoteRecipient);
        console.log(`   recipient: ${stacksAddress}`);

        // 3. Mint on Stacks
        console.log(`   🚀 Minting on Stacks...`);
        await mintOnStacks(stacksAddress, value);

    } catch (err) {
        console.error("   ❌ Error processing log:", err);
    }
}

async function mintOnStacks(recipient: string, amount: bigint) {
    try {
        const txOptions = {
            contractAddress: config.STACKS_CONTRACT_ADDR,
            contractName: config.STACKS_CONTRACT_NAME,
            functionName: 'mint',
            functionArgs: [
                Cl.uint(Number(amount)), // Amount
                Cl.principal(recipient)  // Recipient
            ],
            senderKey: config.STACKS_PRIVATE_KEY!,
            validateWithAbi: true,
            network: 'testnet', // 'testnet' or 'mainnet'
            anchorMode: AnchorMode.Any,
        };

        const transaction = await makeContractCall(txOptions as any);

        // Fix: Pass object with transaction and network
        // Using 'testnet' string as network argument is depracted/incorrect in some versions but 'testnet' as string sometimes works or strict types require StacksNetwork.
        // The error TS2554 "Expected 1 arguments, but got 2" confirms we need to pass an object { transaction, network }.
        // broadcastTransaction(transaction, network) -> broadcastTransaction({ transaction, network })
        const result = await broadcastTransaction({
            transaction,
            network: 'testnet' as any
        });

        // Handle result type checking safely
        if ('error' in result && result.error) {
            console.error(`   ❌ Stacks Broadcast Failed:`, result.error);
            // @ts-ignore
            if (result.reason) console.error(`   Reason:`, result.reason);
        } else {
            console.log(`   ✅ Stacks Mint TxId: ${result.txid}`);
        }
    } catch (error) {
        console.error(`   ❌ Minting Error:`, error);
    }
}

main().catch(console.error);
