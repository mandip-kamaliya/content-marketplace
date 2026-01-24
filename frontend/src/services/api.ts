const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ContentListing {
    id: number;
    title: string;
    description: string;
    type: 'api' | 'dataset' | 'model';
    price: number;
    accessDuration: number;
    isActive: boolean;
    creator: string;
}

export interface ContentData {
    id: number;
    title: string;
    description: string;
    type: string;
    data: any;
}

export interface ContentStats {
    contentId: number;
    totalRevenue: number;
    accessCount: number;
}

export const api = {
    // Get all content listings
    async getContentList(): Promise<ContentListing[]> {
        const response = await fetch(`${API_URL}/api/content`);
        const data = await response.json();
        return data.content || [];
    },

    // Get content metadata
    async getContentMetadata(contentId: number) {
        const response = await fetch(`${API_URL}/api/content/${contentId}/metadata`);
        const data = await response.json();
        return data.metadata;
    },

    // Get content statistics
    async getContentStats(contentId: number): Promise<ContentStats> {
        const response = await fetch(`${API_URL}/api/content/${contentId}/stats`);
        const data = await response.json();
        return data.stats;
    },

    // Access protected content (requires valid access)
    async accessContent(contentId: number, userPrincipal: string): Promise<ContentData | { error: string; paymentDetails?: any }> {
        const response = await fetch(`${API_URL}/api/content/${contentId}/access`, {
            headers: {
                'X-User-Principal': userPrincipal,
            },
        });

        const data = await response.json();

        if (response.status === 402) {
            return {
                error: 'Payment Required',
                paymentDetails: data.paymentDetails,
            };
        }

        if (!response.ok) {
            throw new Error(data.error || 'Failed to access content');
        }

        return data.content;
    },

    // Check health
    async checkHealth() {
        const response = await fetch(`${API_URL}/health`);
        return response.json();
    },
};
