import "dotenv/config";
import {
    createWalletClient,
    createPublicClient,
    http,
    parseUnits,
    pad
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { bytes32FromBytes, remoteRecipientCoder } from "./helpers";
import { makeContractCall, Cl, Pc, broadcastTransaction, AnchorMode } from '@stacks/transactions'

// ============ Configuration constants ============
const config = {
    // Public Ethereum Sepolia RPC and your private wallet key
    ETH_RPC_URL: process.env.RPC_URL || "https://ethereum-sepolia.publicnode.com",
    PRIVATE_KEY: process.env.ETHEREUM_PRIVATE_KEY,

    // Contract addresses on testnet
    X_RESERVE_CONTRACT: "008888878f94C0d87defdf0B07f46B93C1934442",
    ETH_USDC_CONTRACT: "1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    STACKS_USDC:
        "0x00000000061a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce057573646378",

    // Deposit parameters for Stacks
    STACKS_DOMAIN: 10003, // Stacks domain ID
    ETHEREUM_DOMAIN: 0, // Ethereum domain ID
    STACKS_RECIPIENT: "ST1F1M4YP67NV360FBYR28V7C599AC46F8C4635SH", // Address to receive minted USDCx on Stacks
    ETHEREUM_RECIPIENT: "9F685cc614148f35efC238F5DFC977e08ed6bA86", // Address to receive withdrawn USDC on Ethereum
    DEPOSIT_AMOUNT: "1.00",
    MAX_FEE: "0",
};

// ============ Contract ABIs ============
const X_RESERVE_ABI = [
    {
        name: "depositToRemote",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "value", type: "uint256" },
            { name: "remoteDomain", type: "uint32" },
            { name: "remoteRecipient", type: "bytes32" },
            { name: "localToken", type: "address" },
            { name: "maxFee", type: "uint256" },
            { name: "hookData", type: "bytes" },
        ],
        outputs: [],
    },
] as const;

const ERC20_ABI = [
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "success", type: "bool" }],
    },
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
    },
] as const;


async function deposit() {
    if (!config.PRIVATE_KEY) {
        throw new Error("ETHEREUM_PRIVATE_KEY must be set in your .env file");
    }

    // Set up wallet and wallet provider
    const account = privateKeyToAccount(config.PRIVATE_KEY as `0x${string}`);
    const client = createWalletClient({
        account,
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
    });

    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(config.ETH_RPC_URL),
    });

    console.log(`Ethereum wallet address: ${account.address}`);

    // Check native ETH balance
    const nativeBalance = await publicClient.getBalance({
        address: account.address,
    });
    console.log(
        `Native balance: ${nativeBalance.toString()} wei (${(
            Number(nativeBalance) / 1e18
        ).toFixed(6)} ETH)`,
    );
    if (nativeBalance === 0n)
        throw new Error("Insufficient native balance for gas fees");

    // Prepare deposit params (USDC has 6 decimals)
    const value = parseUnits(config.DEPOSIT_AMOUNT, 6);
    const maxFee = parseUnits(config.MAX_FEE, 6);
    const remoteRecipient = bytes32FromBytes(remoteRecipientCoder.encode(config.STACKS_RECIPIENT));
    const hookData = "0x";

    console.log(
        `\nDepositing ${config.DEPOSIT_AMOUNT} USDC to Stacks recipient: ${config.STACKS_RECIPIENT}`,
    );

    // Check token balance
    const usdcBalance = await publicClient.readContract({
        address: `0x${config.ETH_USDC_CONTRACT}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
    });
    console.log(
        `USDC balance: ${usdcBalance.toString()} (${(
            Number(usdcBalance) / 1e6
        ).toFixed(6)} USDC)`,
    );
    if (usdcBalance < value) {
        console.warn(`WARNING: Insufficient USDC balance. Required: ${(Number(value) / 1e6).toFixed(6)} USDC. Proceeding anyway (might fail).`);
    }

    // Approve xReserve to spend USDC
    console.log("Approving...");
    const approveTxHash = await client.writeContract({
        address: `0x${config.ETH_USDC_CONTRACT}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [`0x${config.X_RESERVE_CONTRACT}`, value],
    });
    console.log("Approval tx hash:", approveTxHash);
    console.log("Waiting for approval confirmation...");

    await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
    console.log("✅ Approval confirmed");

    // Deposit transaction
    console.log("Depositing...");
    const depositTxHash = await client.writeContract({
        address: `0x${config.X_RESERVE_CONTRACT}`,
        abi: X_RESERVE_ABI,
        functionName: "depositToRemote",
        args: [
            value,
            config.STACKS_DOMAIN,
            remoteRecipient,
            `0x${config.ETH_USDC_CONTRACT}`,
            maxFee,
            hookData,
        ],
    });

    console.log("Deposit tx hash:", depositTxHash);
    console.log(
        "✅ Transaction submitted. You can track this on Sepolia Etherscan.",
    );
}

async function withdraw() {
    if (!process.env.STACKS_PRIVATE_KEY) {
        throw new Error("STACKS_PRIVATE_KEY must be set in .env");
    }

    let amount = 1000000; // 1 USDC

    // config.ETHEREUM_RECIPIENT without 0x? code says: 0x${config.ETHEREUM_RECIPIENT}
    // The user config has no 0x prefix.

    let functionArgs = [
        Cl.uint(amount), // amount in micro USDC
        Cl.uint(config.ETHEREUM_DOMAIN), // native domain for Ethereum
        Cl.bufferFromHex(pad(`0x${config.ETHEREUM_RECIPIENT}`, { size: 32 })) // native recipient
    ]

    let postCondition_1 = Pc.principal(config.STACKS_RECIPIENT)
        .willSendEq(amount)
        .ft('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx', 'usdcx-token')

    console.log("Broadcasting Stacks withdraw transaction...");
    let transaction = await makeContractCall({
        contractName: 'usdcx-v1',
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        functionName: 'burn',
        functionArgs,
        network: 'testnet',
        anchorMode: AnchorMode.Any,
        postConditions: [postCondition_1],
        postConditionMode: 'deny',
        senderKey: process.env.STACKS_PRIVATE_KEY,
    })

    let result = await broadcastTransaction({ transaction, network: 'testnet' })
    console.log("Stacks Transaction Result:", result);
}

// Main runner
const mode = process.argv[2];
if (mode === 'deposit') {
    deposit().catch(console.error);
} else if (mode === 'withdraw') {
    withdraw().catch(console.error);
} else {
    console.log("Usage: ts-node src/scripts/bridge/index.ts [deposit|withdraw]");
}
