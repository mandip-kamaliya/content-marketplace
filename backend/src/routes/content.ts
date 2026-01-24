import { Router, Request, Response } from 'express';
import { requirePayment } from '../middleware/http402';
import { getContentListing, getContentStats } from '../services/blockchain';
import { getContentById, getAllContentIds } from '../data/sample-content';

const router = Router();

/**
 * GET /api/content
 * List all available content (public)
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const contentIds = getAllContentIds();
        const contentList = [];

        for (const id of contentIds) {
            const content = getContentById(id);
            const listing = await getContentListing(id);

            if (content && listing) {
                contentList.push({
                    id: content.id,
                    title: content.title,
                    description: content.description,
                    type: content.type,
                    price: listing.pricePerAccess,
                    accessDuration: listing.accessDuration,
                    isActive: listing.isActive,
                    creator: listing.creator
                });
            }
        }

        res.json({
            success: true,
            count: contentList.length,
            content: contentList
        });
    } catch (error) {
        console.error('Error listing content:', error);
        res.status(500).json({
            error: 'Failed to list content'
        });
    }
});

/**
 * GET /api/content/:id/metadata
 * Get content metadata (public)
 */
router.get('/:id/metadata', async (req: Request, res: Response) => {
    try {
        const contentId = parseInt(req.params.id as string);

        if (isNaN(contentId)) {
            return res.status(400).json({ error: 'Invalid content ID' });
        }

        const content = getContentById(contentId);
        const listing = await getContentListing(contentId);

        if (!content || !listing) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({
            success: true,
            metadata: {
                id: content.id,
                title: content.title,
                description: content.description,
                type: content.type,
                price: listing.pricePerAccess,
                accessDuration: listing.accessDuration,
                isActive: listing.isActive,
                creator: listing.creator,
                metadataUri: listing.metadataUri
            }
        });
    } catch (error) {
        console.error('Error getting metadata:', error);
        res.status(500).json({ error: 'Failed to get metadata' });
    }
});

/**
 * GET /api/content/:id/stats
 * Get content statistics (public)
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
    try {
        const contentId = parseInt(req.params.id as string);

        if (isNaN(contentId)) {
            return res.status(400).json({ error: 'Invalid content ID' });
        }

        const stats = await getContentStats(contentId);

        if (!stats) {
            return res.status(404).json({ error: 'Stats not found' });
        }

        res.json({
            success: true,
            stats: {
                contentId,
                totalRevenue: stats.totalRevenue,
                accessCount: stats.accessCount
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

/**
 * GET /api/content/:id/access
 * Access protected content (requires payment)
 * 
 * This endpoint is protected by the HTTP 402 middleware.
 * Users must have purchased access via the smart contract.
 */
router.get('/:id/access', requirePayment, async (req: Request, res: Response) => {
    try {
        const contentId = parseInt(req.params.id as string);
        const content = getContentById(contentId);

        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // User has valid access (verified by middleware)
        // Serve the protected content
        res.json({
            success: true,
            message: 'Access granted',
            content: {
                id: content.id,
                title: content.title,
                description: content.description,
                type: content.type,
                data: content.data
            }
        });
    } catch (error) {
        console.error('Error accessing content:', error);
        res.status(500).json({ error: 'Failed to access content' });
    }
});

export default router;
