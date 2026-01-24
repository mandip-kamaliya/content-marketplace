import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';

console.log('StacksConnect showConnect:', showConnect);

interface WalletContextType {
    userSession: UserSession;
    isConnected: boolean;
    userAddress: string | null;
    connectWallet: () => void;
    disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [userAddress, setUserAddress] = useState<string | null>(null);

    useEffect(() => {
        try {
            if (userSession.isUserSignedIn()) {
                const userData = userSession.loadUserData();
                setIsConnected(true);
                setUserAddress(userData.profile.stxAddress.testnet);
            }
        } catch (error) {
            console.warn('Failed to load user session, clearing storage:', error);
            // Clear invalid session data
            userSession.signUserOut();
            localStorage.clear();
            sessionStorage.clear();
        }
    }, []);

    const connectWallet = () => {
        showConnect({
            appDetails: {
                name: 'USDCx Content Marketplace',
                icon: window.location.origin + '/logo.svg',
            },
            redirectTo: '/',
            onFinish: () => {
                const userData = userSession.loadUserData();
                setIsConnected(true);
                setUserAddress(userData.profile.stxAddress.testnet);
            },
            userSession,
        });
    };

    const disconnectWallet = () => {
        userSession.signUserOut();
        setIsConnected(false);
        setUserAddress(null);
    };

    return (
        <WalletContext.Provider
            value={{
                userSession,
                isConnected,
                userAddress,
                connectWallet,
                disconnectWallet,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
