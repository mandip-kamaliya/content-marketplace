import { useState } from 'react';
import type { ContentListing } from '../services/api';
import { api } from '../services/api';
import { contractService } from '../services/contract';
import { useWallet } from '../context/WalletContext';

interface ContentCardProps {
    content: ContentListing;
    onPurchaseComplete?: () => void;
}

export default function ContentCard({ content, onPurchaseComplete }: ContentCardProps) {
    const [purchasing, setPurchasing] = useState(false);
    const [accessing, setAccessing] = useState(false);
    const [accessedData, setAccessedData] = useState<any>(null);
    const [paymentRequired, setPaymentRequired] = useState(false);
    const { isConnected, userAddress } = useWallet();

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'api': return '🌐';
            case 'dataset': return '📊';
            case 'model': return '🤖';
            default: return '📦';
        }
    };

    const getTypeBadge = (type: string) => {
        return type.toUpperCase();
    };

    const handlePurchase = async () => {
        if (!isConnected) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            setPurchasing(true);
            await contractService.purchaseAccess(
                content.id,
                content.price,
                (data) => {
                    console.log('Purchase transaction:', data);
                    alert('Purchase successful! Transaction submitted to blockchain.');
                    setPurchasing(false);
                    if (onPurchaseComplete) {
                        onPurchaseComplete();
                    }
                }
            );
        } catch (error) {
            console.error('Purchase error:', error);
            alert('Purchase failed. Please try again.');
            setPurchasing(false);
        }
    };

    const handleAccess = async () => {
        if (!isConnected || !userAddress) {
            alert('Please connect your wallet first');
            return;
        }

        try {
            setAccessing(true);
            const result = await api.accessContent(content.id, userAddress);

            if ('error' in result) {
                setPaymentRequired(true);
                alert('Payment required! Please purchase access first.');
            } else {
                setAccessedData(result);
                setPaymentRequired(false);
            }
        } catch (error) {
            console.error('Access error:', error);
            alert('Failed to access content');
        } finally {
            setAccessing(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                            {getTypeIcon(content.type)}
                        </div>
                        <h3 className="card-title">{content.title}</h3>
                    </div>
                    <span className="badge badge-info">{getTypeBadge(content.type)}</span>
                </div>
                <p className="card-description">{content.description}</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="text-muted">Price:</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {content.price} USDCx
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="text-muted">Access Duration:</span>
                    <span>{content.accessDuration} blocks</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Status:</span>
                    {content.isActive ? (
                        <span className="badge badge-success">Active</span>
                    ) : (
                        <span className="badge badge-error">Inactive</span>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    className="btn btn-primary"
                    onClick={handlePurchase}
                    disabled={!isConnected || purchasing || !content.isActive}
                    style={{ flex: 1 }}
                >
                    {purchasing ? (
                        <>
                            <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                            Purchasing...
                        </>
                    ) : (
                        <>💳 Purchase</>
                    )}
                </button>
                <button
                    className="btn btn-outline"
                    onClick={handleAccess}
                    disabled={!isConnected || accessing}
                    style={{ flex: 1 }}
                >
                    {accessing ? (
                        <>
                            <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                            Accessing...
                        </>
                    ) : (
                        <>🔓 Access</>
                    )}
                </button>
            </div>

            {paymentRequired && (
                <div className="mt-md" style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--error)'
                }}>
                    <p className="text-error" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                        ⚠️ HTTP 402: Payment Required - Purchase access first
                    </p>
                </div>
            )}

            {accessedData && (
                <div className="mt-md" style={{
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--success)',
                    maxHeight: '200px',
                    overflow: 'auto'
                }}>
                    <p className="text-success" style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        ✅ Access Granted!
                    </p>
                    <pre style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {JSON.stringify(accessedData, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
