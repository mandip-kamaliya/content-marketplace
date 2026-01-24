import { useState } from 'react';
import { contractService } from '../services/contract';
import { useWallet } from '../context/WalletContext';

export default function CreatorDashboard() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [metadataUri, setMetadataUri] = useState('');
    const [listing, setListing] = useState(false);
    const { isConnected } = useWallet();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        if (!title || !price || !duration || !metadataUri) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setListing(true);
            await contractService.listContent(
                parseInt(price),
                parseInt(duration),
                metadataUri,
                (data) => {
                    console.log('List content transaction:', data);
                    alert('Content listed successfully! Transaction submitted to blockchain.');
                    // Reset form
                    setTitle('');
                    setDescription('');
                    setPrice('');
                    setDuration('');
                    setMetadataUri('');
                    setListing(false);
                }
            );
        } catch (error) {
            console.error('Listing error:', error);
            alert('Failed to list content. Please try again.');
            setListing(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    Creator Dashboard
                </h1>
                <p className="text-secondary" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
                    Monetize your APIs, datasets, and AI models with blockchain-verified access control
                </p>
            </div>

            {!isConnected && (
                <div className="card glass" style={{ maxWidth: '600px', margin: '0 auto 2rem', padding: '2rem', textAlign: 'center' }}>
                    <p className="text-warning" style={{ marginBottom: 0 }}>
                        🔐 Connect your wallet to list content
                    </p>
                </div>
            )}

            {/* List Content Form */}
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card-header">
                    <h2 className="card-title">List New Content</h2>
                    <p className="card-description">
                        Create a new listing for your digital content
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Title */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Title *
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Premium Weather API"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Description
                            </label>
                            <textarea
                                className="input"
                                placeholder="Describe your content..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {/* Price and Duration */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Price (USDCx) *
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="100"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    min="1"
                                    required
                                />
                                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                    Price per access in USDCx micro-units
                                </p>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Access Duration (blocks) *
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="144"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    min="1"
                                    required
                                />
                                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                    ~144 blocks = 1 day
                                </p>
                            </div>
                        </div>

                        {/* Metadata URI */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Metadata URI *
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="ipfs://QmExample123..."
                                value={metadataUri}
                                onChange={(e) => setMetadataUri(e.target.value)}
                                required
                            />
                            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                IPFS URI or link to content metadata
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={!isConnected || listing}
                        >
                            {listing ? (
                                <>
                                    <div className="spinner"></div>
                                    Listing Content...
                                </>
                            ) : (
                                <>✨ List Content</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-3 mt-xl">
                <div className="card glass">
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌐</div>
                    <h4>APIs</h4>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Monetize your REST APIs with pay-per-access model
                    </p>
                </div>

                <div className="card glass">
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                    <h4>Datasets</h4>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Sell access to your curated datasets and analytics
                    </p>
                </div>

                <div className="card glass">
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
                    <h4>AI Models</h4>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                        Provide access to your trained ML models
                    </p>
                </div>
            </div>
        </div>
    );
}
