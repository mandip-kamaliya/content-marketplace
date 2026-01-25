import { Request, Response, NextFunction } from 'express';
import { checkAccess, getContentListing } from '../services/blockchain';

/**
 * HTTP 402 Payment Required Middleware
 * 
 * This middleware enforces blockchain-verified access control.
 * If the user doesn't have valid on-chain access, it returns:
 * - HTTP 402 Payment Required status
 * - Payment details in response headers
 * - Instructions for purchasing access
 */
export async function requirePayment(req: Request, res: Response, next: NextFunction) {
    try {
        // Extract content ID from route params
        const contentId = parseInt(req.params.id as string);

        if (isNaN(contentId)) {
            return res.status(400).json({
                error: 'Invalid content ID'
            });
        }

        if (contentId >= 1000) {
            console.log(`Bypassing payment check for Mock Content ID: ${contentId}`);
            return next();
        }
        // Extract user principal from header
        // In production, this would come from authenticated session/JWT
        const userPrincipal = req.headers['x-user-principal'] as string;

        if (!userPrincipal) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please provide X-User-Principal header with your Stacks address'
            });
        }

        // Check on-chain access
        const hasAccess = await checkAccess(contentId, userPrincipal);

        if (hasAccess) {
            // User has valid access, proceed to content delivery
            return next();
        }

        // User doesn't have access - return 402 Payment Required
        const listing = await getContentListing(contentId);

        if (!listing) {
            return res.status(404).json({
                error: 'Content not found',
                message: 'The requested content does not exist'
            });
        }

        if (!listing.isActive) {
            return res.status(404).json({
                error: 'Content unavailable',
                message: 'This content is no longer available for purchase'
            });
        }

        // Return 402 with payment details
        res.status(402)
            .set({
                'X-Payment-Required': 'true',
                'X-Payment-Network': 'stacks',
                'X-Contract-Address': process.env.CONTRACT_ADDRESS || '',
                'X-Content-Price': listing.pricePerAccess.toString(),
                'X-Access-Duration': listing.accessDuration.toString(),
                'X-Payment-Method': 'USDCx'
            })
            .json({
                error: 'Payment Required',
                message: 'You need to purchase access to view this content',
                paymentDetails: {
                    contentId,
                    price: listing.pricePerAccess,
                    currency: 'USDCx',
                    accessDuration: listing.accessDuration,
                    accessDurationBlocks: listing.accessDuration,
                    network: 'stacks',
                    contractAddress: process.env.CONTRACT_ADDRESS,
                    instructions: {
                        step1: 'Connect your Stacks wallet (Leather/Hiro)',
                        step2: `Call purchase-access function with contentId=${contentId} and payment=${listing.pricePerAccess}`,
                        step3: 'Wait for transaction confirmation',
                        step4: 'Retry this request with your principal in X-User-Principal header'
                    }
                }
            });

    } catch (error) {
        console.error('Error in payment middleware:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to verify access'
        });
    }
}
