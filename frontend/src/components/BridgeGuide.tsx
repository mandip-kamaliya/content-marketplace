import { useState } from 'react';
import { useWallet } from '../context/WalletContext';

export default function BridgeGuide() {
    const { isConnected, userAddress } = useWallet();
    const [activeStep, setActiveStep] = useState(1);

    const steps = [
        {
            number: 1,
            title: 'Get Testnet ETH',
            description: 'You need Sepolia ETH for gas fees on Ethereum.',
            action: 'Get Sepolia ETH',
            link: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia'
        },
        {
            number: 2,
            title: 'Get Testnet USDC',
            description: 'Get test USDC tokens from Circle\'s faucet.',
            action: 'Get Test USDC',
            link: 'https://faucet.circle.com/'
        },
        {
            number: 3,
            title: 'Bridge to Stacks',
            description: 'Use xReserve to bridge USDC from Ethereum to Stacks as USDCx.',
            action: 'Open Bridge',
            link: 'https://bridge.stacks.co/'
        },
        {
            number: 4,
            title: 'Purchase Content',
            description: 'Use your USDCx to purchase access to premium content!',
            action: 'Browse Marketplace',
            link: '#marketplace'
        }
    ];

    return (
        <div className="bridge-guide">
            <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h2 className="gradient-text" style={{ marginBottom: '0.5rem' }}>
                    🌉 Get USDCx to Start
                </h2>
                <p className="text-muted" style={{ marginBottom: '2rem' }}>
                    Bridge USDC from Ethereum to Stacks to unlock premium content
                </p>

                {/* Progress Bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '2rem',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '15px',
                        left: '10%',
                        right: '10%',
                        height: '2px',
                        background: 'rgba(255,255,255,0.1)',
                        zIndex: 0
                    }} />
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            onClick={() => setActiveStep(step.number)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                zIndex: 1
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: activeStep >= step.number
                                    ? 'var(--gradient-primary)'
                                    : 'var(--bg-tertiary)',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.875rem',
                                marginBottom: '0.5rem',
                                transition: 'all 0.3s ease'
                            }}>
                                {step.number}
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                color: activeStep === step.number ? 'var(--text-primary)' : 'var(--text-muted)',
                                textAlign: 'center',
                                maxWidth: '80px'
                            }}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Active Step Details */}
                <div className="card" style={{
                    background: 'var(--bg-tertiary)',
                    padding: '1.5rem',
                    textAlign: 'center'
                }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>
                        Step {steps[activeStep - 1].number}: {steps[activeStep - 1].title}
                    </h3>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>
                        {steps[activeStep - 1].description}
                    </p>
                    <a
                        href={steps[activeStep - 1].link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{ textDecoration: 'none' }}
                    >
                        {steps[activeStep - 1].action} →
                    </a>
                </div>

                {/* Info Box */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(0, 212, 255, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '4px solid var(--accent-primary)'
                }}>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                        💡 <strong>Bridging takes ~15 minutes</strong> on testnet. Your USDCx will appear
                        in your Stacks wallet once the transaction is confirmed.
                    </p>
                </div>

                {/* Connection Status */}
                {isConnected && userAddress && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(0, 255, 136, 0.1)',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <span style={{ color: 'var(--success)' }}>
                            ✓ Wallet connected: {userAddress.slice(0, 8)}...{userAddress.slice(-4)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
