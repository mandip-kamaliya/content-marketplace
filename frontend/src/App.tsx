import { useState } from 'react';
import { WalletProvider } from './context/WalletContext';
import Header from './components/Header';
import Marketplace from './components/Marketplace';
import CreatorDashboard from './components/CreatorDashboard';
import { Bridge } from './components/Bridge';
import './index.css';

type View = 'marketplace' | 'creator' | 'bridge';

function App() {
    const [currentView, setCurrentView] = useState<View>('marketplace');

    return (
        <WalletProvider>
            <div className="app">
                <Header currentView={currentView} onViewChange={setCurrentView} />

                <main style={{ flex: 1 }}>
                    {currentView === 'bridge' ? (
                        <Bridge />
                    ) : (
                        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
                            {currentView === 'marketplace' && <Marketplace />}
                            {currentView === 'creator' && <CreatorDashboard />}
                        </div>
                    )}
                </main>

                <footer style={{
                    textAlign: 'center',
                    padding: '2rem',
                    marginTop: '4rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <p className="text-muted">
                        USDCx Content Marketplace - Powered by Stacks & HTTP 402
                    </p>
                </footer>
            </div>
        </WalletProvider>
    );
}

export default App;
