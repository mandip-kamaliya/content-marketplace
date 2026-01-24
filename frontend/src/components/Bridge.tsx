import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { useWallet } from '../context/WalletContext';
import { remoteRecipientCoder, bytes32FromBytes } from '../utils/bridge-utils';
import { openContractCall } from '@stacks/connect';
import { AnchorMode, PostConditionMode, uintCV } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

// Constants
const ETH_USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const X_RESERVE_ADDRESS = '0x008888878f94C0d87defdf0B07f46B93C1934442';

// ABIs
const ERC20_ABI = [
    { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "success", type: "bool" }] },
    { name: "allowance", type: "function", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "remaining", type: "uint256" }], stateMutability: "view" }
] as const;

const X_RESERVE_ABI = [
    { name: "depositToRemote", type: "function", stateMutability: "nonpayable", inputs: [{ name: "value", type: "uint256" }, { name: "remoteDomain", type: "uint32" }, { name: "remoteRecipient", type: "bytes32" }, { name: "localToken", type: "address" }, { name: "maxFee", type: "uint256" }, { name: "hookData", type: "bytes" }], outputs: [] },
] as const;

export const Bridge: React.FC = () => {
    // Hooks
    const { address: ethAddress, isConnected: isEthConnected } = useAccount();
    const { connectors, connect } = useConnect();
    const { disconnect: disconnectEth } = useDisconnect();
    const { writeContractAsync } = useWriteContract();
    const publicClient = usePublicClient();
    const { userAddress: stxAddress, isConnected: isStxConnected, connectWallet: connectStx, disconnectWallet: disconnectStx } = useWallet();

    // State
    const [amount, setAmount] = useState<string>('1.0');
    const [status, setStatus] = useState<string>('');
    const [txHash, setTxHash] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
    const [isLoading, setIsLoading] = useState(false);

    // Handlers
    const handleDeposit = async () => {
        if (!ethAddress || !stxAddress) return;
        setStatus('Initiating Deposit...');
        setIsLoading(true);
        setTxHash('');

        try {
            const value = parseUnits(amount, 6);
            const remoteRecipient = bytes32FromBytes(remoteRecipientCoder.encode(stxAddress));

            setStatus('⏳ Approving USDC...');
            const approveHash = await writeContractAsync({
                address: ETH_USDC_ADDRESS,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [X_RESERVE_ADDRESS, value],
            });

            setStatus('⏳ Waiting for Approval...');
            await publicClient?.waitForTransactionReceipt({ hash: approveHash });

            setStatus('🚀 Bridging Assets...');
            const depositHash = await writeContractAsync({
                address: X_RESERVE_ADDRESS,
                abi: X_RESERVE_ABI,
                functionName: 'depositToRemote',
                args: [value, 10003, remoteRecipient, ETH_USDC_ADDRESS, 0n, '0x'],
            });
            setTxHash(depositHash);
            setStatus('✅ Deposit Successful! Funds arriving shortly.');
        } catch (e: any) {
            console.error(e);
            setStatus(`❌ Error: ${e.message || 'Transaction failed'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!stxAddress || !ethAddress) return;
        setStatus('Initiating Withdrawal...');
        setIsLoading(true);
        setTxHash('');

        try {
            const microAmount = Math.floor(parseFloat(amount) * 1000000);
            const ethRecipientPadded = `0x${ethAddress.replace('0x', '').padStart(64, '0')}`;

            await openContractCall({
                network: STACKS_TESTNET as any,
                anchorMode: AnchorMode.Any,
                contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                contractName: 'usdcx-v1',
                functionName: 'burn',
                functionArgs: [
                    uintCV(microAmount),
                    uintCV(0),
                    { type: 6, buffer: Buffer.from(ethRecipientPadded.replace('0x', ''), 'hex') } as any
                ],
                postConditionMode: PostConditionMode.Allow,
                onFinish: (data) => {
                    setTxHash(data.txId);
                    setStatus('✅ Withdrawal Broadcasted!');
                    setIsLoading(false);
                },
                onCancel: () => {
                    setStatus('Cancelled');
                    setIsLoading(false);
                }
            });
        } catch (e: any) {
            console.error(e);
            setStatus(`❌ Error: ${e.message || 'Failed'}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative selection:bg-indigo-500/30">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row gap-12 items-start">

                {/* Left Panel: Context & Info */}
                <div className="md:w-5/12 space-y-8 mt-10 animate-slide-up">
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
                            Bridge <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">USDCx</span>
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            Seamlessly move liquidity between Ethereum Sepolia and Stacks Testnet.
                            Institutional-grade security with a developer-first experience.
                        </p>
                    </div>

                    {/* Stats / Info Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="text-gray-400 text-sm mb-1">Network Fee</div>
                            <div className="text-xl font-bold font-mono">~0.002 ETH</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="text-gray-400 text-sm mb-1">Est. Time</div>
                            <div className="text-xl font-bold font-mono">~15 Mins</div>
                        </div>
                    </div>

                    {/* Architecture Visual */}
                    <div className="p-6 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-xl">
                        <div className="flex items-center justify-between text-sm font-medium text-gray-400 mb-4">
                            <span>Sepolia</span>
                            <span className="w-full h-[1px] bg-gradient-to-r from-blue-500/50 to-purple-500/50 mx-4 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse"></div>
                            </span>
                            <span>Stacks</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">Ξ</div>
                            <div className="px-3 py-1 rounded-full bg-white/5 text-xs border border-white/10">Relayer Active</div>
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">Stx</div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Bridge Interface */}
                <div className="md:w-7/12 w-full animate-fade-in">
                    <div className="relative group">
                        {/* Glow Effect */}
                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${activeTab === 'deposit' ? 'from-blue-600 to-purple-600' : 'from-purple-600 to-pink-600'} rounded-[32px] opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 loading-glow`}></div>

                        <div className="relative bg-[#0F0F0F] border border-white/10 rounded-[30px] p-8 shadow-2xl backdrop-blur-xl">

                            {/* Tabs */}
                            <div className="flex gap-4 p-2 bg-black/40 rounded-3xl mb-12 border border-white/5 backdrop-blur-md relative selection-none">
                                {['deposit', 'withdraw'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`flex-1 py-5 rounded-2xl text-base font-bold tracking-wide transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === tab
                                            ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10 ring-1 ring-white/20'
                                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                    >
                                        {tab === 'deposit' ? (
                                            <><span>⬇️</span> <span>Deposit</span></>
                                        ) : (
                                            <><span>⬆️</span> <span>Withdraw</span></>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Wallet Connections */}
                            <div className="flex gap-8 mb-12">
                                {/* Eth Wallet */}
                                <div className={`flex-1 p-6 rounded-[32px] border transition-all duration-300 group/wallet ${isEthConnected ? 'bg-blue-500/5 border-blue-500/30' : 'bg-black/40 border-white/5'}`}>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#627EEA]/20 flex items-center justify-center border border-[#627EEA]/20">
                                                <span className="text-[#627EEA] text-xl">Ξ</span>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Source</div>
                                                <div className="text-sm font-bold text-gray-300">Ethereum</div>
                                            </div>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ring-4 ring-black ${isEthConnected ? 'bg-green-400 shadow-[0_0_12px_#4ade80]' : 'bg-red-400'}`}></div>
                                    </div>

                                    {isEthConnected ? (
                                        <div className="space-y-4">
                                            <div className="p-3 bg-black/30 rounded-xl font-mono text-lg text-white/90 text-center border border-white/5">{ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}</div>
                                            <button onClick={() => disconnectEth()} className="w-full py-3 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors">
                                                Disconnect
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => connect({ connector: connectors[0] })} className="w-full py-4 mt-2 bg-[#627EEA] hover:bg-[#526edb] text-white rounded-2xl text-base font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.03] active:scale-[0.98]">
                                            Connect MetaMask
                                        </button>
                                    )}
                                </div>

                                {/* Stacks Wallet */}
                                <div className={`flex-1 p-6 rounded-[32px] border transition-all duration-300 group/wallet ${isStxConnected ? 'bg-purple-500/5 border-purple-500/30' : 'bg-black/40 border-white/5'}`}>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#5546FF]/20 flex items-center justify-center border border-[#5546FF]/20">
                                                <span className="text-[#5546FF] font-bold text-sm">STX</span>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Target</div>
                                                <div className="text-sm font-bold text-gray-300">Stacks</div>
                                            </div>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full ring-4 ring-black ${isStxConnected ? 'bg-green-400 shadow-[0_0_12px_#4ade80]' : 'bg-red-400'}`}></div>
                                    </div>

                                    {isStxConnected ? (
                                        <div className="space-y-4">
                                            <div className="p-3 bg-black/30 rounded-xl font-mono text-lg text-white/90 text-center border border-white/5">{stxAddress?.slice(0, 6)}...{stxAddress?.slice(-4)}</div>
                                            <button onClick={disconnectStx} className="w-full py-3 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors">
                                                Disconnect
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={connectStx} className="w-full py-4 mt-2 bg-[#5546FF] hover:bg-[#4536ee] text-white rounded-2xl text-base font-bold shadow-lg shadow-purple-500/20 transition-all transform hover:scale-[1.03] active:scale-[0.98]">
                                            Connect Leather
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="mb-12 relative group">
                                <label className="flex justify-between text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
                                    <span>Amount to Bridge</span>
                                    <span>Available: 0.00 USDC</span>
                                </label>
                                <div className="relative transform transition-all duration-300 group-hover:scale-[1.01]">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 text-white text-6xl font-light py-8 px-6 rounded-3xl focus:border-white/30 focus:ring-0 outline-none transition-all placeholder-gray-800"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4 pointer-events-none">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">USDC</div>
                                            <div className="text-xs text-gray-500 font-mono">Sepolia</div>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-[#2775CA] flex items-center justify-center shadow-lg shadow-blue-900/50">
                                            <span className="font-bold text-xl">$</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <button
                                onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
                                disabled={!isEthConnected || !isStxConnected || isLoading}
                                className={`w-full py-7 rounded-3xl font-bold text-2xl tracking-widest uppercase shadow-2xl transition-all duration-500 transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] 
                                    ${activeTab === 'deposit'
                                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)]'
                                        : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:shadow-[0_10px_40px_-10px_rgba(219,39,119,0.5)]'}
                                    disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span className="animate-pulse">Processing...</span>
                                    </div>
                                ) : (
                                    <span>{activeTab === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdraw'}</span>
                                )}
                            </button>

                            {/* Status Bar */}
                            {status && (
                                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 animate-fade-in">
                                    {status.includes('Error') ? '❌' : (status.includes('✅') ? '✅' : '⏳')}
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-200">{status}</p>
                                        {txHash && (
                                            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline mt-1 block">
                                                View Transaction
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

