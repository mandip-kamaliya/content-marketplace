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
const contractName = import.meta.env.VITE_CONTRACT_ADDRESS?.split('.')[1] || 'content-marketplace-v2';

// Helper to safely convert to BigInt for uintCV
const toBigInt = (value: number | string): bigint => {
    const num = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(num) || num < 0) {
        throw new Error(`Invalid uint value: ${value}`);
    }
    return BigInt(Math.floor(num));
};

export const contractService = {
    // List new content
    async listContent(
        price: number,
        duration: number,
        metadataUri: string,
        onFinish: (data: any) => void
    ) {
        // Pre-serialize ClarityValues to hex strings to avoid version mismatch
        const functionArgs = [
            serializeCV(uintCV(toBigInt(price))),
            serializeCV(uintCV(toBigInt(duration))),
            serializeCV(stringAsciiCV(metadataUri)),
        ];

        await openContractCall({
            network: STACKS_TESTNET as any,
            anchorMode: AnchorMode.Any,
            contractAddress,
            contractName,
            functionName: 'list-content',
            functionArgs,
            postConditionMode: PostConditionMode.Allow,
            onFinish,
        });
    },

    // Purchase access to content
    async purchaseAccess(
        contentId: number,
        paymentAmount: number,
        onFinish: (data: any) => void
    ) {
        // Pre-serialize ClarityValues to hex strings to avoid version mismatch
        const functionArgs = [
            serializeCV(uintCV(toBigInt(contentId))),
            serializeCV(uintCV(toBigInt(paymentAmount))),
        ];

        await openContractCall({
            network: STACKS_TESTNET as any,
            anchorMode: AnchorMode.Any,
            contractAddress,
            contractName,
            functionName: 'purchase-access',
            functionArgs,
            postConditionMode: PostConditionMode.Allow,
            onFinish,
        });
    },

    // Deactivate content
    async deactivateContent(
        contentId: number,
        onFinish: (data: any) => void
    ) {
        // Pre-serialize ClarityValues to hex strings to avoid version mismatch
        const functionArgs = [
            serializeCV(uintCV(toBigInt(contentId))),
        ];

        await openContractCall({
            network: STACKS_TESTNET as any,
            anchorMode: AnchorMode.Any,
            contractAddress,
            contractName,
            functionName: 'deactivate-content',
            functionArgs,
            postConditionMode: PostConditionMode.Allow,
            onFinish,
        });
    },
};


