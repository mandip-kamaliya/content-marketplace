// Type definitions for the content marketplace

export interface ContentListing {
    creator: string;
    pricePerAccess: number;
    accessDuration: number;
    isActive: boolean;
    metadataUri: string;
}

export interface ContentStats {
    totalRevenue: number;
    accessCount: number;
}

export interface ContentData {
    id: number;
    title: string;
    description: string;
    type: 'api' | 'dataset' | 'model';
    data: any;
}

export interface AccessCheckResult {
    hasAccess: boolean;
    listing?: ContentListing;
}
