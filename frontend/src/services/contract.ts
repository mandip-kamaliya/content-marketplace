import { openContractCall } from '@stacks/connect';
import {
    AnchorMode,
    PostConditionMode,
    uintCV,
    stringAsciiCV,
    serializeCV,
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS?.split('.')[0] || 'ST13T9VVWP9XHRHFMTSYPNDWN986AEK4WQ2DYQ0Q2';
const contractName = import.meta.env.VITE_CONTRACT_ADDRESS?.split('.')[1] || 'content-marketplace-v7';

// Helper to safely convert to BigInt for uintCV
const toBigInt = (value: number | string): bigint => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(num) || num < 0) {
        throw new Error(`Invalid uint value: ${value}`);
    }
    return BigInt(Math.floor(num));
};

// MOCK MODE: Enabled because contract deployment failed and user needs demo NOW.
// This allows the UI to function (listing, buying) without a real marketplace contract,
// while still allowing the user to show their Real USDCx balance.

export const contractService = {
    // List new content
    async listContent(
        price: number,
        duration: number,
        metadataUri: string,
        onFinish: (data: any) => void
    ) {
        console.log("Mock Listing Content:", { price, duration, metadataUri });

        // Notify backend to add to mock store (for Demo persistence)
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/content/mock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Recently Listed Content",
                description: "This content was just listed during the demo.",
                price,
                duration,
                metadataUri
            })
        }).catch(err => console.error("Failed to register mock content:", err));

        // Simulate chain delay
        setTimeout(() => {
            onFinish({ txId: "0x_mock_tx_id_" + Date.now() });
        }, 1500);
    },

    // Purchase access to content
    async purchaseAccess(
        contentId: number,
        paymentAmount: number,
        onFinish: (data: any) => void
    ) {
        console.log("Mock Purchasing Access:", { contentId, paymentAmount });
        // Simulate chain delay
        setTimeout(() => {
            onFinish({ txId: "0x_mock_tx_id_" + Date.now() });
        }, 1500);
    },

    // Deactivate content
    async deactivateContent(
        contentId: number,
        onFinish: (data: any) => void
    ) {
        console.log("Mock Deactivating:", { contentId });
        setTimeout(() => {
            onFinish({ txId: "0x_mock_tx_id_" + Date.now() });
        }, 1500);
    },
};


