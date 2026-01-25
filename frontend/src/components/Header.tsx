import { useWallet } from '../context/WalletContext';

interface HeaderProps {
    currentView: 'marketplace' | 'creator' | 'bridge';
    onViewChange: (view: 'marketplace' | 'creator' | 'bridge') => void;
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
    const { isConnected, userAddress, connectWallet, disconnectWallet } = useWallet();

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <header style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backdropFilter: 'blur(10px)',
        }}>
            <div className="container" style={{
                padding: '1rem var(--spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: 0 }}>
                        💎 USDCx Marketplace
                    </h1>
                </div>

                {/* Navigation */}
                <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        className={currentView === 'marketplace' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                        onClick={() => onViewChange('marketplace')}
                    >
                        🛒 Marketplace
                    </button>
                    <button
                        className={currentView === 'creator' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                        onClick={() => onViewChange('creator')}
                    >
                        ✨ Creator
                    </button>
                    <button
                        className={currentView === 'bridge' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                        onClick={() => onViewChange('bridge')}
                        style={{
                            background: currentView === 'bridge'
                                ? 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)'
                                : 'rgba(255, 255, 255, 0.05)',
                            borderColor: currentView === 'bridge' ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: 'white',
                            fontWeight: 'bold',
                            boxShadow: currentView === 'bridge' ? '0 0 15px rgba(124, 58, 237, 0.3)' : 'none'
                        }}
                    >
                        🌉 Get USDCx
                    </button>

                    {/* Wallet Connection */}
                    {isConnected ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="badge badge-success">
                                {userAddress && formatAddress(userAddress)}
                            </span>
                            <button className="btn btn-outline btn-sm" onClick={disconnectWallet}>
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-primary btn-sm" onClick={connectWallet}>
                            🔐 Connect Wallet
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}
