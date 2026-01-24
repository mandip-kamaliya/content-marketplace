import { ContentData } from '../types';

/**
 * Sample content database for demo purposes
 * In production, this would be a real database or external API
 */
export const sampleContent: Record<number, ContentData> = {
    1: {
        id: 1,
        title: 'Premium Weather API',
        description: 'Real-time weather data with 7-day forecasts',
        type: 'api',
        data: {
            location: 'San Francisco, CA',
            current: {
                temperature: 68,
                humidity: 65,
                windSpeed: 12,
                conditions: 'Partly Cloudy'
            },
            forecast: [
                { day: 'Monday', high: 72, low: 58, conditions: 'Sunny' },
                { day: 'Tuesday', high: 70, low: 56, conditions: 'Cloudy' },
                { day: 'Wednesday', high: 68, low: 55, conditions: 'Rain' }
            ]
        }
    },
    2: {
        id: 2,
        title: 'Financial Dataset - Q4 2025',
        description: 'Comprehensive market data and analytics',
        type: 'dataset',
        data: {
            records: [
                { symbol: 'AAPL', price: 185.50, volume: 52000000, change: 2.3 },
                { symbol: 'GOOGL', price: 142.80, volume: 28000000, change: -0.8 },
                { symbol: 'MSFT', price: 378.20, volume: 31000000, change: 1.5 }
            ],
            metadata: {
                source: 'NYSE',
                timestamp: '2025-12-31T16:00:00Z',
                recordCount: 3
            }
        }
    },
    3: {
        id: 3,
        title: 'AI Sentiment Analysis Model',
        description: 'Pre-trained model for text sentiment classification',
        type: 'model',
        data: {
            modelInfo: {
                name: 'sentiment-analyzer-v2',
                version: '2.1.0',
                accuracy: 0.94,
                trainingData: '1M+ reviews'
            },
            samplePredictions: [
                { text: 'This product is amazing!', sentiment: 'positive', confidence: 0.98 },
                { text: 'Not what I expected', sentiment: 'negative', confidence: 0.85 },
                { text: 'It works as described', sentiment: 'neutral', confidence: 0.72 }
            ],
            apiEndpoint: '/api/predict'
        }
    },
    4: {
        id: 4,
        title: 'Crypto Market Analytics',
        description: 'Real-time cryptocurrency market data and trends',
        type: 'api',
        data: {
            markets: [
                { symbol: 'BTC', price: 45230.50, volume24h: 28500000000, change24h: 3.2 },
                { symbol: 'ETH', price: 2850.75, volume24h: 15200000000, change24h: 5.1 },
                { symbol: 'STX', price: 1.85, volume24h: 45000000, change24h: 8.7 }
            ],
            timestamp: new Date().toISOString(),
            source: 'Multiple Exchanges'
        }
    }
};

/**
 * Get content by ID
 */
export function getContentById(contentId: number): ContentData | null {
    return sampleContent[contentId] || null;
}

/**
 * Get all available content IDs
 */
export function getAllContentIds(): number[] {
    return Object.keys(sampleContent).map(Number);
}
