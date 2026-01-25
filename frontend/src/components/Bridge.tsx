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
const STX_CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const STX_CONTRACT_NAME = 'usdcx-v1'; // Reserve Protocol / Entrypoint
const STX_TOKEN_NAME = 'usdcx'; // Token Contract

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
                contractAddress: STX_CONTRACT_ADDRESS,
                contractName: STX_CONTRACT_NAME,
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
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white overflow-hidden relative selection:bg-indigo-500/30 flex items-center justify-center">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl px-8 flex flex-col lg:flex-row gap-20 items-center lg:items-start justify-center lg:justify-between">

                {/* Left Panel: Context & Info */}
                <div className="lg:w-1/2 space-y-10 mt-4 animate-slide-up text-center lg:text-left">
                    <div>
                        <h1 className="text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-gray-500 leading-tight">
                            Bridge <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 filter drop-shadow-lg">USDCx</span>
                        </h1>
                        <p className="text-gray-400 text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                            Seamlessly move liquidity between Ethereum Sepolia and Stacks Testnet.
                            Institutional-grade security with a developer-first experience.
                        </p>
                    </div>

                    {/* Stats / Info Cards */}
                    <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto lg:mx-0">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors">
                            <div className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-semibold">Network Fee</div>
                            <div className="text-3xl font-bold font-mono text-white">~0.002 ETH</div>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors">
                            <div className="text-gray-400 text-sm mb-2 uppercase tracking-wider font-semibold">Est. Time</div>
                            <div className="text-3xl font-bold font-mono text-white">~15 Mins</div>
                        </div>
                    </div>

                    {/* Architecture Visual */}
                    <div className="p-8 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-xl max-w-lg mx-auto lg:mx-0">
                        <div className="flex items-center justify-between text-sm font-medium text-gray-400 mb-6">
                            <span className="uppercase tracking-widest">Sepolia</span>
                            <span className="w-full h-[2px] bg-gradient-to-r from-blue-500/30 via-indigo-500 to-purple-500/30 mx-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            </span>
                            <span className="uppercase tracking-widest">Stacks</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="w-12 h-12 rounded-2xl bg-[#627EEA]/20 flex items-center justify-center text-[#627EEA] text-2xl border border-[#627EEA]/30">Ξ</div>
                            <div className="px-4 py-2 rounded-full bg-white/5 text-xs text-white/70 border border-white/10 font-mono">Relayer Active ●</div>
                            <div className="w-12 h-12 rounded-2xl bg-[#5546FF]/20 flex items-center justify-center text-[#5546FF] font-bold text-sm border border-[#5546FF]/30">STX</div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Bridge Interface */}
                <div className="lg:w-1/2 w-full max-w-xl animate-fade-in relative">
                    {/* Decorative Elements behind card */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="relative group">
                        {/* Glow Effect */}
                        <div className={`absolute -inset-1 bg-gradient-to-br ${activeTab === 'deposit' ? 'from-blue-600 via-indigo-600 to-purple-600' : 'from-purple-600 via-pink-600 to-rose-600'} rounded-[40px] opacity-50 blur-2xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 loading-glow`}></div>

                        <div className="relative bg-[#0a0a0a]/90 border border-white/10 rounded-[38px] p-10 shadow-2xl backdrop-blur-2xl">

                            {/* Tabs */}
                            <div className="flex gap-2 p-1.5 bg-white/5 rounded-[24px] mb-10 border border-white/5 relative selection-none">
                                {['deposit', 'withdraw'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`flex-1 py-4 rounded-[20px] text-sm font-extrabold tracking-wider transition-all duration-300 relative z-10 flex items-center justify-center gap-3 uppercase ${activeTab === tab
                                            ? 'bg-white/10 text-white shadow-lg border border-white/10'
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
                            <div className="grid grid-cols-2 gap-5 mb-10">
                                {/* Eth Wallet */}
                                <div className={`p-6 rounded-[28px] border-2 transition-all duration-300 group/wallet ${isEthConnected ? 'bg-blue-900/10 border-blue-500/20' : 'bg-black/40 border-dashed border-white/10 hover:border-white/20'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-[#627EEA]/20 flex items-center justify-center border border-[#627EEA]/20">
                                            <span className="text-[#627EEA] text-xl">Ξ</span>
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-[#0a0a0a] ${isEthConnected ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-gray-600'}`}></div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">From</div>
                                        <div className="text-sm font-bold text-gray-200 mb-4">Ethereum Sepolia</div>

                                        {isEthConnected && ethAddress ? (
                                            <div className="space-y-3">
                                                <div className="px-3 py-1.5 bg-black/40 rounded-lg font-mono text-[10px] text-white/50 text-center border border-white/5 w-fit">{ethAddress?.slice(0, 6)}...{ethAddress?.slice(-4)}</div>
                                            </div>
                                        ) : (
                                            <button onClick={() => connect({ connector: connectors[0] })} className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all">
                                                Connect Source
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Stacks Wallet */}
                                <div className={`p-6 rounded-[28px] border-2 transition-all duration-300 group/wallet ${isStxConnected ? 'bg-purple-900/10 border-purple-500/20' : 'bg-black/40 border-dashed border-white/10 hover:border-white/20'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-[#5546FF]/20 flex items-center justify-center border border-[#5546FF]/20">
                                            <span className="text-[#5546FF] font-bold text-xs">STX</span>
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-[#0a0a0a] ${isStxConnected ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-gray-600'}`}></div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">To</div>
                                        <div className="text-sm font-bold text-gray-200 mb-4">Stacks Testnet</div>

                                        {isStxConnected ? (
                                            <div className="space-y-3">
                                                <div className="px-3 py-1.5 bg-black/40 rounded-lg font-mono text-[10px] text-white/50 text-center border border-white/5 w-fit">{stxAddress?.slice(0, 6)}...{stxAddress?.slice(-4)}</div>
                                            </div>
                                        ) : (
                                            <button onClick={connectStx} className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all">
                                                Connect Target
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="mb-10">
                                <label className="flex justify-between text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
                                    <span>Amount to Bridge</span>
                                    <span className="text-blue-400 cursor-pointer hover:text-blue-300">Max: 0.00</span>
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur opacity-0 group-hover/input:opacity-100 transition-opacity duration-500"></div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-[#151515] border-2 border-white/5 text-white text-5xl font-light py-8 pl-8 pr-32 rounded-3xl focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-gray-800 relative z-10"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none z-20">
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-white">USDC</div>
                                            <div className="text-[10px] text-gray-500 font-mono">Sepolia</div>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-[#2775CA] flex items-center justify-center shadow-lg shadow-blue-900/30 ring-4 ring-[#151515]">
                                            <span className="font-bold text-xl text-white">$</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Action Button */}
                            <button
                                onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
                                disabled={!isEthConnected || !isStxConnected || isLoading}
                                className={`w-full py-6 rounded-[24px] font-black text-xl tracking-[0.2em] uppercase shadow-2xl transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] relative overflow-hidden group/btn
                                    ${activeTab === 'deposit'
                                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:shadow-[0_10px_50px_-10px_rgba(79,70,229,0.5)]'
                                        : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:shadow-[0_10px_50px_-10px_rgba(219,39,119,0.5)]'}
                                    disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                {isLoading ? (
                                    <div className="relative flex items-center justify-center gap-4">
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span className="animate-pulse">Processing...</span>
                                    </div>
                                ) : (
                                    <span className="relative">{activeTab === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdraw'}</span>
                                )}
                            </button>

                            {/* Status Bar */}
                            {status && (
                                <div className="mt-8 p-5 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-4 animate-fade-in backdrop-blur-md">
                                    <div className="mt-1">{status.includes('Error') ? '❌' : (status.includes('✅') ? '✅' : '⏳')}</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white leading-relaxed">{status}</p>
                                        {txHash && (
                                            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline mt-2 block font-mono">
                                                View on Etherscan ↗
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

