import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import contentRoutes from './routes/content';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        network: process.env.STACKS_NETWORK,
        contract: process.env.CONTRACT_ADDRESS
    });
});

// API routes
app.use('/api/content', contentRoutes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.json({
        name: 'USDCx Content Marketplace API',
        version: '1.0.0',
        description: 'HTTP 402 Payment Required API for blockchain-verified content access',
        endpoints: {
            health: '/health',
            content: {
                list: 'GET /api/content',
                metadata: 'GET /api/content/:id/metadata',
                stats: 'GET /api/content/:id/stats',
                access: 'GET /api/content/:id/access (requires payment)'
            }
        },
        documentation: {
            http402: 'Protected endpoints return 402 Payment Required if user lacks blockchain-verified access',
            authentication: 'Include X-User-Principal header with your Stacks address',
            payment: 'Purchase access via smart contract before accessing protected content'
        }
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
    });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   USDCx Content Marketplace - Backend API Server          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 Network: ${process.env.STACKS_NETWORK}`);
    console.log(`📝 Contract: ${process.env.CONTRACT_ADDRESS}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  /health                          - Health check`);
    console.log(`  GET  /api/content                     - List all content`);
    console.log(`  GET  /api/content/:id/metadata        - Get content metadata`);
    console.log(`  GET  /api/content/:id/stats           - Get content stats`);
    console.log(`  GET  /api/content/:id/access          - Access content (HTTP 402)`);
    console.log('');
    console.log('💡 Tip: Use X-User-Principal header for authenticated requests');
    console.log('');
});

export default app;