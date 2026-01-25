import { Router, Request, Response } from 'express';
import { requirePayment } from '../middleware/http402';
import { getContentListing, getContentStats } from '../services/blockchain';
import { getContentById, getAllContentIds } from '../data/sample-content';

const router = Router();

// In-memory mock store for demo
let mockContentStore: any[] = [];

// Initialize with sample data if needed, or leave empty to rely on static samples + dynamic additions
// We will merge static sample-content with this dynamic store.

/**
 * GET /api/content
 * List all available content (public)
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const contentIds = getAllContentIds();
        const contentList = [];

        // 1. Static Sample Content
        for (const id of contentIds) {
            const content = getContentById(id);
            const listing = await getContentListing(id); // Returns mock if chain fails

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

        // 2. Dynamic Mock Content (from Demo)
        contentList.push(...mockContentStore);

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
 * POST /api/content/mock
 * Internal endpoint for Demo: Register a new mock content item
 */
router.post('/mock', (req: Request, res: Response) => {
    const { title, description, price, duration, metadataUri } = req.body;

    // Create new mock item
    const newItem = {
        id: 1000 + mockContentStore.length, // Start ID from 1000 to avoid collision
        title: title || "New Demo Content",
        description: description || "Created during live demo",
        type: "dataset", // Default
        price: price || 0,
        accessDuration: duration || 100,
        isActive: true,
        creator: "ST13T9VVWP9XHRHFMTSYPNDWN986AEK4WQ2DYQ0Q2", // Current User
        metadataUri: metadataUri || ""
    };

    mockContentStore.push(newItem);
    console.log("Mock Content Added:", newItem);

    res.json({ success: true, item: newItem });
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

        // Check mock store first
        const mockItem = mockContentStore.find(i => i.id === contentId);
        if (mockItem) {
            return res.json({
                success: true,
                metadata: {
                    ...mockItem,
                    metadataUri: mockItem.metadataUri
                }
            });
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

        const mockItem = mockContentStore.find(i => i.id === contentId);
        if (mockItem) {
            return res.json({
                success: true,
                stats: {
                    contentId,
                    totalRevenue: 5000000, // Fake revenue (5 USDC)
                    accessCount: 1 // Fake access count
                }
            });
        }

        const stats = await getContentStats(contentId);

        if (!stats) {
            // return res.status(404).json({ error: 'Stats not found' });
            // Fallback for demo
            return res.json({
                success: true,
                stats: { contentId, totalRevenue: 0, accessCount: 0 }
            });
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

        // Check mock store
        const mockItem = mockContentStore.find(i => i.id === contentId);
        if (mockItem) {
            return res.json({
                success: true,
                message: 'Access granted (Mock)',
                content: {
                    id: mockItem.id,
                    title: mockItem.title,
                    description: mockItem.description,
                    type: mockItem.type,
                    data: "This is the premium content you purchased! (Mock Data)"
                }
            });
        }

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
