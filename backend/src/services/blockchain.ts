import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, cvToJSON, uintCV, principalCV } from '@stacks/transactions';
import { ContentListing, ContentStats } from '../types';

const network = process.env.STACKS_NETWORK === 'mainnet'
    ? STACKS_MAINNET
    : STACKS_TESTNET;

const contractAddress = process.env.CONTRACT_ADDRESS?.split('.')[0] || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const contractName = process.env.CONTRACT_NAME || 'content-marketplace';

/**
 * Check if a user has valid access to content
 */
/**
 * Check if a user has valid access to content
 */
export async function checkAccess(contentId: number, userPrincipal: string): Promise<boolean> {
    try {
        const result = await fetchCallReadOnlyFunction({
            network,
            contractAddress,
            contractName,
            functionName: 'has-valid-access',
            functionArgs: [
                uintCV(contentId),
                principalCV(userPrincipal)
            ],
            senderAddress: userPrincipal,
        });

        const jsonResult = cvToJSON(result);
        return jsonResult.value === true;
    } catch (error) {
        console.warn('Blockchain call failed, using mock data for checkAccess');
        // For demo: grant access if contentId is even, deny if odd
        // return contentId % 2 === 0;
        return false;
    }
}

/**
 * Get content listing details from the blockchain
 */
export async function getContentListing(contentId: number): Promise<ContentListing | null> {
    try {
        const result = await fetchCallReadOnlyFunction({
            network,
            contractAddress,
            contractName,
            functionName: 'get-content-listing',
            functionArgs: [
                uintCV(contentId)
            ],
            senderAddress: contractAddress,
        });

        const jsonResult = cvToJSON(result);

        if (jsonResult.type === 'none') {
            return null;
        }

        const listing = jsonResult.value;
        return {
            creator: listing.creator.value,
            pricePerAccess: parseInt(listing['price-per-access'].value),
            accessDuration: parseInt(listing['access-duration'].value),
            isActive: listing['is-active'].value,
            metadataUri: listing['metadata-uri'].value
        };
    } catch (error) {
        console.warn('Blockchain call failed, using mock data for getContentListing');
        // Mock data for demo
        return {
            creator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
            pricePerAccess: 50,
            accessDuration: 144,
            isActive: true,
            metadataUri: `ipfs://QmMockHash${contentId}`
        };
    }
}

/**
 * Get content statistics from the blockchain
 */
export async function getContentStats(contentId: number): Promise<ContentStats | null> {
    try {
        const result = await fetchCallReadOnlyFunction({
            network,
            contractAddress,
            contractName,
            functionName: 'get-content-stats',
            functionArgs: [
                uintCV(contentId)
            ],
            senderAddress: contractAddress,
        });

        const jsonResult = cvToJSON(result);

        if (jsonResult.type === 'none') {
            return null;
        }

        const stats = jsonResult.value;
        return {
            totalRevenue: parseInt(stats['total-revenue'].value),
            accessCount: parseInt(stats['access-count'].value)
        };
    } catch (error) {
        console.warn('Blockchain call failed, using mock data for getContentStats');
        // Mock data for demo
        return {
            totalRevenue: 1000,
            accessCount: 20
        };
    }
}
