import { useState, useEffect } from 'react';
import type { ContentListing } from '../services/api';
import { api } from '../services/api';
import { useWallet } from '../context/WalletContext';
import ContentCard from './ContentCard';

export default function Marketplace() {
    const [content, setContent] = useState<ContentListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isConnected } = useWallet();

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            setLoading(true);
            const data = await api.getContentList();
            setContent(data);
            setError(null);
        } catch (err) {
            setError('Failed to load content');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p className="text-muted mt-md">Loading marketplace...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p className="text-error">{error}</p>
                <button className="btn btn-primary mt-md" onClick={loadContent}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    background: 'rgba(0, 212, 255, 0.1)',
                    borderRadius: '20px',
                    marginBottom: '1rem'
                }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
                        ⚡ Powered by HTTP 402 + USDCx
                    </span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    Discover Premium Content
                </h1>
                <p className="text-secondary" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
                    Access APIs, datasets, and AI models with instant USDCx payments on Stacks
                </p>

                {!isConnected && (
                    <div className="card glass mt-lg" style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem' }}>
                        <p className="text-warning" style={{ marginBottom: '1rem' }}>
                            🔐 Connect your wallet to purchase and access content
                        </p>
                    </div>
                )}
            </div>

            {/* Content Grid */}
            {content.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p className="text-muted">No content available yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-3">
                    {content.map((item) => (
                        <ContentCard key={item.id} content={item} onPurchaseComplete={loadContent} />
                    ))}
                </div>
            )}
        </div>
    );
}
