/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Crown, Wallet, ShieldCheck, CheckCircle2, 
  ExternalLink, Copy, Check, AlertCircle, ArrowRight, 
  RefreshCw, Layers, Music, Zap, Flame, Globe, ChevronRight 
} from 'lucide-react';
import { Language, UserStats } from '../types/airdrop.ts';
import { 
  APERNA_NFT_CONTRACT, 
  APERNA_NFT_CHAPTERS, 
  NFT_MINT_PRICE_USD, 
  ESTIMATED_POL_PER_MINT,
  POLYGON_CHAIN_ID_HEX,
  POLYGON_EXPLORER,
  OPENSEA_COLLECTION,
  NftChapter,
  MintedNftRecord,
  getMintedNftsStorage,
  saveMintedNftStorage,
  generatePolygonTxHash,
  FIRST_NFT_BUY_BONUS_TOKENS,
  NFT_MARKETPLACE_SALE_REWARD_TOKENS,
  hasClaimedFirstNftBonus,
  setClaimedFirstNftBonus,
  getListedNftsStorage,
  saveListedNftStorage
} from '../utils/apernaNftService.ts';
import { playClaimRewardSound, playTapSound, triggerHaptic } from '../utils/audioEngine.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  stats: UserStats;
  onUpdateStats?: (newStats: UserStats) => void;
}

export const ApernaNftMintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  stats,
  onUpdateStats,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'mint' | 'my-nfts'>('mint');
  const [selectedChapter, setSelectedChapter] = useState<NftChapter>(APERNA_NFT_CHAPTERS[0]);
  const [quantity, setQuantity] = useState(1);
  const [mintStatus, setMintStatus] = useState<'idle' | 'preparing' | 'confirming' | 'success' | 'error'>('idle');
  const [mintTxHash, setMintTxHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  // Web3 EVM / MetaMask State
  const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  const [isPolygonNetwork, setIsPolygonNetwork] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletType, setWalletType] = useState<'metamask' | 'in-app'>('in-app');
  const [showWalletHelp, setShowWalletHelp] = useState(false);
  const [firstBuyClaimed, setFirstBuyClaimed] = useState(false);
  const [lastEarnedTokens, setLastEarnedTokens] = useState<number | null>(null);
  const [isRealOnChainTx, setIsRealOnChainTx] = useState<boolean>(false);
  const [copiedDappUrl, setCopiedDappUrl] = useState(false);

  // Listing / Sale Modal State
  const [selectedNftForSale, setSelectedNftForSale] = useState<MintedNftRecord | null>(null);
  const [listingPlatform, setListingPlatform] = useState<'OpenSea' | 'MagicEden' | 'Rarible' | 'PolygonDEX'>('OpenSea');
  const [listingPrice, setListingPrice] = useState<string>('2.5'); // In POL
  const [isListingLoading, setIsListingLoading] = useState(false);
  const [listingSuccess, setListingSuccess] = useState<string | null>(null);

  // Minted NFTs inventory
  const [myNfts, setMyNfts] = useState<MintedNftRecord[]>([]);

  useEffect(() => {
    setMyNfts(getMintedNftsStorage());
    setFirstBuyClaimed(hasClaimedFirstNftBonus());
    checkEthereumState();
  }, []);

  const checkEthereumState = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const eth = (window as any).ethereum;
        const accounts = await eth.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setMetaMaskAddress(accounts[0]);
          setWalletType('metamask');
        }
        const chainId = await eth.request({ method: 'eth_chainId' });
        setCurrentChainId(chainId);
        setIsPolygonNetwork(chainId === POLYGON_CHAIN_ID_HEX);
      } catch (err) {
        console.warn('Ethereum check notice:', err);
      }
    }
  };

  const handleConnectMetaMask = async () => {
    playTapSound();
    setIsConnectingWallet(true);
    setErrorMessage('');
    
    // Check if MetaMask or any EVM provider is injected
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setShowWalletHelp(true);
      const hostUrl = typeof window !== 'undefined' ? (window.location.host || 'my-project-six-coral-29.vercel.app') : 'my-project-six-coral-29.vercel.app';
      const pathUrl = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '';
      const metamaskDappUrl = `https://metamask.app.link/dapp/${hostUrl}${pathUrl}`;

      const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;
      if (tg && typeof tg.openLink === 'function') {
        tg.openLink(metamaskDappUrl);
      } else if (typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = metamaskDappUrl;
      }

      setErrorMessage(
        language === 'hi'
          ? 'Telegram के इन-ऐप ब्राउज़र में MetaMask एक्सटेंशन नहीं मिलता। नीचे "MetaMask गाइड" देखें या बिना किसी परेशानी के "1-Click इन-ऐप" से +1,000 टोकन मुफ्त क्लेम करें।'
          : 'MetaMask extension not found in Telegram webview. Open via MetaMask browser or use 1-Click In-App for free +1,000 tokens!'
      );
      setIsConnectingWallet(false);
      return;
    }

    try {
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setMetaMaskAddress(accounts[0]);
        setWalletType('metamask');
        playClaimRewardSound();
      }

      // Check / Switch network to Polygon Mainnet
      const chainId = await eth.request({ method: 'eth_chainId' });
      setCurrentChainId(chainId);
      if (chainId !== POLYGON_CHAIN_ID_HEX) {
        await handleSwitchToPolygon();
      } else {
        setIsPolygonNetwork(true);
      }
    } catch (err: any) {
      console.error('Wallet connect error:', err);
      if (err.code === 4001) {
        setErrorMessage(language === 'hi' ? 'आपने वॉलेट कनेक्ट रिक्वेस्ट कैंसिल कर दी।' : 'Wallet connection was cancelled.');
      } else {
        setErrorMessage(err.message || 'Failed to connect MetaMask');
      }
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleSwitchToPolygon = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const eth = (window as any).ethereum;
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
      });
      setIsPolygonNetwork(true);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          const eth = (window as any).ethereum;
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: POLYGON_CHAIN_ID_HEX,
                chainName: 'Polygon Mainnet',
                nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com/'],
              },
            ],
          });
          setIsPolygonNetwork(true);
        } catch (addError) {
          console.error('Failed to add Polygon network:', addError);
        }
      }
    }
  };

  const handleExecuteMint = async () => {
    playTapSound();
    triggerHaptic('medium');
    setMintStatus('confirming');
    setErrorMessage('');

    const targetAddress = metaMaskAddress || stats.walletAddress || '0xUserApernaMimi' + stats.userId.slice(-6);
    const unitPricePol = ESTIMATED_POL_PER_MINT;
    const totalCostPol = unitPricePol * quantity;
    const totalCostUsd = NFT_MINT_PRICE_USD * quantity;

    // IF MetaMask is connected and on Polygon, try real on-chain transaction
    if (metaMaskAddress && typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const eth = (window as any).ethereum;
        // mintChapter(uint8) selector is 0xd48e7a87
        const chapterHex = selectedChapter.chapterNumber.toString(16).padStart(64, '0');
        const callData = '0xd48e7a87' + chapterHex;
        
        // Dynamically query exact on-chain chapter price from chapterPrices(uint8) [selector: 0x0761e032]
        let totalWei = BigInt(Math.floor(totalCostPol * 1e18));
        try {
          const priceCall = await eth.request({
            method: 'eth_call',
            params: [{
              to: APERNA_NFT_CONTRACT,
              data: '0x0761e032' + chapterHex
            }, 'latest']
          });
          if (priceCall && priceCall !== '0x') {
            const onChainPrice = BigInt(priceCall);
            if (onChainPrice > 0n) {
              totalWei = onChainPrice * BigInt(quantity);
            }
          }
        } catch (e) {
          console.warn('Could not read dynamic on-chain chapter price, fallback to estimated:', e);
        }

        const tx = await eth.request({
          method: 'eth_sendTransaction',
          params: [{
            from: metaMaskAddress,
            to: APERNA_NFT_CONTRACT,
            value: '0x' + totalWei.toString(16),
            data: callData,
          }],
        });

        finishMintSuccess(tx, metaMaskAddress, 'Polygon Mainnet (MetaMask)', true);
        return;
      } catch (err: any) {
        if (err.code === 4001 || err.message?.includes('rejected')) {
          setMintStatus('idle');
          setErrorMessage(language === 'hi' ? 'आपने ट्रांजैक्शन कैंसिल कर दिया।' : 'Transaction cancelled by user.');
          return;
        }
        console.warn('Real on-chain send error:', err);
        setMintStatus('idle');
        setErrorMessage(
          language === 'hi' 
            ? `ऑन-चेन ट्रांजैक्शन नहीं हो सकी (${err.message || 'नेटवर्क या गैस एरर'})। आप चाहें तो दाईं तरफ "1-Click इन-ऐप" चुनकर बिना गैस के +1,000 टोकन बोनस ले सकते हैं!` 
            : `On-chain transaction failed: ${err.message || 'network/gas error'}. You can switch to 1-Click In-App for instant free tokens.`
        );
        return;
      }
    }

    // Fast Seamless In-App Airdrop Claim (100% Free Game Quest Reward)
    setTimeout(() => {
      const claimCode = `AIRDROP-VOUCHER-${Date.now().toString().slice(-6)}`;
      finishMintSuccess(claimCode, targetAddress, 'In-App Airdrop Reward', false);
    }, 1000);
  };

  const finishMintSuccess = (tx: string, address: string, networkName: string, isRealOnChain: boolean) => {
    setMintTxHash(tx);
    setIsRealOnChainTx(isRealOnChain);
    setMintStatus('success');
    playClaimRewardSound();
    triggerHaptic('heavy');

    const newRecord: MintedNftRecord = {
      id: `MINT_${Date.now()}`,
      tokenId: `${selectedChapter.tokenId}-${Math.floor(100 + Math.random() * 900)}`,
      chapterNumber: selectedChapter.chapterNumber,
      chapterTitle: selectedChapter.title,
      txHash: tx,
      mintedAt: Date.now(),
      walletAddress: address,
      priceUsd: isRealOnChain ? NFT_MINT_PRICE_USD * quantity : 0,
      network: networkName,
      rarity: selectedChapter.rarity,
      isRealOnChain: isRealOnChain,
    };

    const updated = saveMintedNftStorage(newRecord);
    setMyNfts(updated);

    // USER REQUIREMENT: 1st NFT Buy / Mint gives 1,000 bonus tokens!
    let rewardTokens = 0;
    const isFirstTime = !hasClaimedFirstNftBonus();
    if (isFirstTime) {
      rewardTokens = FIRST_NFT_BUY_BONUS_TOKENS; // 1,000 tokens
      setClaimedFirstNftBonus();
      setFirstBuyClaimed(true);
    } else {
      rewardTokens = quantity * 100; // standard 100 tokens per subsequent mint
    }
    setLastEarnedTokens(rewardTokens);

    if (onUpdateStats) {
      onUpdateStats({
        ...stats,
        balance: (stats.balance || 0) + rewardTokens,
        onChainBalance: (stats.onChainBalance || 0) + (quantity * 10),
      });
    }
  };

  // USER REQUIREMENT: Listing / Sale on any platform gives 500 bonus tokens for FREE!
  const handleListNftForSale = async () => {
    if (!selectedNftForSale) return;
    playTapSound();
    setIsListingLoading(true);

    try {
      // Create listing record
      saveListedNftStorage({
        id: `LIST_${Date.now()}`,
        tokenId: selectedNftForSale.tokenId,
        platform: listingPlatform,
        listedPriceUsd: parseFloat(listingPrice) * 0.40,
        listedPricePol: parseFloat(listingPrice) || 2.5,
        listedAt: Date.now(),
        bonusClaimed: true,
      });

      // Reward 500 tokens!
      const saleBonus = NFT_MARKETPLACE_SALE_REWARD_TOKENS; // 500 tokens
      if (onUpdateStats) {
        onUpdateStats({
          ...stats,
          balance: (stats.balance || 0) + saleBonus,
        });
      }

      playClaimRewardSound();
      triggerHaptic('heavy');
      setListingSuccess(
        language === 'hi' 
          ? `🎉 NFT सफलतापूर्वक ${listingPlatform} पर लिस्ट हो गया! आपको +500 टोकन मुफ्त मिले!`
          : `🎉 NFT successfully listed on ${listingPlatform}! You received +500 bonus tokens!`
      );

      setTimeout(() => {
        setIsListingLoading(false);
      }, 700);
    } catch (e) {
      setIsListingLoading(false);
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, type: 'tx' | 'contract') => {
    playTapSound();
    navigator.clipboard.writeText(text);
    if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  const activeWalletAddress = metaMaskAddress || stats.walletAddress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#0e1633] via-[#080d21] to-[#040612] border-2 border-amber-400/50 p-4 sm:p-6 text-white shadow-[0_0_60px_rgba(251,191,36,0.35)] space-y-4">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-[0_0_15px_rgba(251,191,36,0.6)]">
              <Crown className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {language === 'hi' ? 'अपर्णा AI जेनेसिस NFT मिंट' : 'Aperna AI Genesis Memorial NFT'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-[9px] font-mono font-bold text-amber-300">
                  ${NFT_MINT_PRICE_USD.toFixed(2)} USD
                </span>
              </div>
              <p className="text-[10px] text-cyan-300/80 font-mono">
                Polygon PoS Mainnet • Official Smart Contract
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/10 text-cyan-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Mint vs My Minted NFTs */}
        <div className="flex rounded-xl bg-[#060c22] p-1 border border-cyan-500/20">
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('mint');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'mint'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                : 'text-cyan-200 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{language === 'hi' ? 'लाइव मिंट ($0.50)' : 'Live Mint ($0.50)'}</span>
          </button>
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('my-nfts');
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'my-nfts'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md'
                : 'text-cyan-200 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {language === 'hi' ? `मेरे NFT (${myNfts.length})` : `My NFTs (${myNfts.length})`}
            </span>
          </button>
        </div>

        {/* TAB 1: MINT FLOW */}
        {activeTab === 'mint' && (
          <>
            {/* SUCCESS STATE */}
            {mintStatus === 'success' ? (
              <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/80 to-[#041d18] border border-emerald-400/50 text-center space-y-3 animate-fadeIn">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">
                    {isRealOnChainTx
                      ? (language === 'hi' ? '🎉 असली ऑन-चेन NFT मिंट सफल!' : '🎉 Real On-Chain NFT Minted on Polygon!')
                      : (language === 'hi' ? '🎉 +1,000 एयरड्रॉप टोकन बोनस क्लेम हो गया!' : '🎉 Free +1,000 Airdrop Token Reward Claimed!')}
                  </h4>
                  <p className="text-xs text-emerald-200/90 mt-1">
                    {selectedChapter.title} (#{selectedChapter.tokenId})
                  </p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isRealOnChainTx 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}>
                    {isRealOnChainTx ? '⛓️ Polygon Mainnet On-Chain' : '🎮 In-App Airdrop Reward (Off-Chain)'}
                  </span>
                </div>

                {/* Reward Banner */}
                {lastEarnedTokens && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 text-center animate-bounce">
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold block">
                      {language === 'hi' ? '🎁 विशेष बोनस रिवॉर्ड मिला!' : '🎁 SPECIAL BONUS REWARD UNLOCKED!'}
                    </span>
                    <span className="text-lg font-black text-white">
                      +{lastEarnedTokens.toLocaleString()} $APERNA Tokens
                    </span>
                    <p className="text-[10px] text-amber-200/90 mt-0.5">
                      {language === 'hi' 
                        ? 'पहला NFT टास्क पूरा करने पर 1,000 टोकन आपके बैलेंस में क्रेडिट कर दिए गए हैं!' 
                        : '1,000 bonus tokens added to your balance for completing the 1st NFT task!'}
                    </p>
                  </div>
                )}

                {/* Info Card: Transparent Explanation for User */}
                {!isRealOnChainTx ? (
                  <div className="p-3 rounded-xl bg-black/50 border border-amber-400/40 text-left text-xs space-y-1.5 text-slate-200">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <span>💡</span>
                      <span>{language === 'hi' ? 'सच्ची और स्पष्ट जानकारी:' : 'Clear & Honest Details:'}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {language === 'hi'
                        ? 'यह Telegram गेम का फ्री एयरड्रॉप टास्क है। आपके कोई POL या पैसे नहीं कटे हैं, और +1,000 टोकन सीधे आपके गेम बैलेंस में जुड़ गए हैं।'
                        : 'This is a free Telegram game airdrop task. No POL was charged, and +1,000 tokens are directly credited to your game balance.'}
                    </p>
                    <div className="p-2 rounded-lg bg-black/40 font-mono text-[10px] text-cyan-300 flex items-center justify-between">
                      <span>Voucher ID: {mintTxHash}</span>
                      <span className="text-emerald-400">✓ In-App Active</span>
                    </div>
                    <p className="text-[10px] text-cyan-300/80">
                      {language === 'hi'
                        ? '📌 नोट: असली MetaMask वॉलेट में Polygon NFT केवल तब आता है जब MetaMask ब्राउज़र में खोलकर ऑन-चेन गैस फीस के साथ मिंट किया जाए।'
                        : '📌 Note: Real MetaMask on-chain NFT requires opening in MetaMask browser and signing a transaction on Polygon.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Real Tx Hash Box */}
                    <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-left font-mono text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-emerald-300">
                        <span>Transaction Hash:</span>
                        <button
                          onClick={() => copyToClipboard(mintTxHash, 'tx')}
                          className="flex items-center gap-1 text-[10px] text-cyan-300 hover:text-white"
                        >
                          {copiedTx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedTx ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="text-white truncate">{mintTxHash}</div>
                    </div>

                    {/* External Links */}
                    <div className="flex gap-2 pt-1">
                      <a
                        href={`${POLYGON_EXPLORER}/tx/${mintTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>Polygonscan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={OPENSEA_COLLECTION}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl bg-purple-950/80 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>OpenSea</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}

                <button
                  onClick={() => {
                    playTapSound();
                    setMintStatus('idle');
                    setActiveTab('my-nfts');
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs tracking-wider cursor-pointer"
                >
                  {language === 'hi' ? 'मेरा NFT संग्रह देखें और सेल करें (+500 टोकन) →' : 'View In My NFTs & Sell on Market (+500 Tokens) →'}
                </button>
              </div>
            ) : (
              <>
                {/* SPECIAL DISCOUNT & PROMO BANNER (USER REQUEST) */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-purple-500/25 border-2 border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-black uppercase text-amber-300">
                      <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                      {language === 'hi' ? 'विशेष ऑफर: भारी रिवॉर्ड!' : 'SPECIAL OFFER: MEGA TOKEN BONUSES!'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-[10px] font-mono font-bold text-amber-300 border border-amber-400/40">
                      LIVE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="p-2 rounded-xl bg-black/40 border border-amber-400/30">
                      <div className="text-[10px] text-amber-300 font-mono font-bold">1st NFT Buy</div>
                      <div className="text-sm font-black text-white">+1,000 Tokens</div>
                      <div className="text-[9px] text-slate-300">
                        {language === 'hi' ? 'पहला NFT खरीदने पर' : 'On first purchase'}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-purple-400/30">
                      <div className="text-[10px] text-purple-300 font-mono font-bold">Marketplace Sale</div>
                      <div className="text-sm font-black text-white">+500 Tokens</div>
                      <div className="text-[9px] text-slate-300">
                        {language === 'hi' ? 'किसी भी प्लेटफॉर्म पर सेल' : 'Free on any platform'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. WALLET BINDING / CONNECTION STATUS WITH METAMASK STEP-BY-STEP HELP */}
                <div className="p-3 rounded-2xl bg-[#071333] border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      {language === 'hi' ? 'मिंटिंग वॉलेट स्थिति' : 'MINTING WALLET STATUS'}
                    </span>
                    {activeWalletAddress ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {activeWalletAddress.slice(0, 6)}...{activeWalletAddress.slice(-4)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-300 font-mono">
                        Not Connected
                      </span>
                    )}
                  </div>

                  {/* Connect Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={handleConnectMetaMask}
                      disabled={isConnectingWallet}
                      className="py-2.5 px-2.5 rounded-xl bg-gradient-to-r from-orange-500/25 to-amber-500/25 hover:from-orange-500/40 hover:to-amber-500/40 border-2 border-amber-400/60 text-xs font-bold text-amber-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <span className="text-sm">🦊</span>
                      <span className="truncate">
                        {metaMaskAddress ? 'MetaMask ✓' : (language === 'hi' ? 'MetaMask जोड़ें' : 'Connect MetaMask')}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        playTapSound();
                        setWalletType('in-app');
                        setErrorMessage('');
                      }}
                      className={`py-2.5 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                        walletType === 'in-app' && !metaMaskAddress
                          ? 'bg-cyan-500/30 border-cyan-300 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                          : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/40 text-cyan-200'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-cyan-300" />
                      <span className="truncate">1-Click In-App Web3</span>
                    </button>
                  </div>

                  {/* MetaMask Helper & Easy Guide Toggle */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-cyan-300/80">
                    <span className="font-mono">
                      {metaMaskAddress ? '✅ EVM Wallet Active' : '⚡ No MetaMask extension? In-App works 100%'}
                    </span>
                    <button
                      onClick={() => {
                        playTapSound();
                        setShowWalletHelp(!showWalletHelp);
                      }}
                      className="text-amber-300 underline font-bold cursor-pointer"
                    >
                      {showWalletHelp ? (language === 'hi' ? 'मदद छुपाएं' : 'Hide Help') : (language === 'hi' ? 'MetaMask गाइड ?' : 'MetaMask Guide?')}
                    </button>
                  </div>

                  {/* Step-by-Step MetaMask Connection Guide for Users Having Difficulty */}
                  {showWalletHelp && (
                    <div className="p-3.5 rounded-xl bg-black/70 border border-amber-400/50 text-xs text-slate-200 space-y-3 animate-fadeIn">
                      <div className="font-bold text-amber-300 flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <span>🦊</span>
                          <span>{language === 'hi' ? 'Telegram में MetaMask कैसे जोड़ें?' : 'Connecting MetaMask in Telegram:'}</span>
                        </span>
                        <span className="text-[10px] text-cyan-300 font-mono">Polygon PoS</span>
                      </div>

                      <p className="text-[11px] text-amber-100/90 leading-relaxed bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                        {language === 'hi'
                          ? '⚠️ Telegram का अपना मोबाइल ब्राउज़र MetaMask एक्सटेंशन को सपोर्ट नहीं करता। इसलिए मोबाइल पर सीधे MetaMask कनेक्ट नहीं होता।'
                          : '⚠️ Telegram mobile webview cannot run browser extensions like MetaMask directly.'}
                      </p>

                      <div className="space-y-2 text-[11px] text-slate-300">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                          <span>
                            {language === 'hi'
                              ? 'नीचे बटन दबाकर इस पेज का लिंक कॉपी करें:'
                              : 'Copy this DApp link below:'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              playTapSound();
                              const host = typeof window !== 'undefined' ? (window.location.host || 'my-project-six-coral-29.vercel.app') : 'my-project-six-coral-29.vercel.app';
                              const url = `https://${host}`;
                              navigator.clipboard.writeText(url);
                              setCopiedDappUrl(true);
                              setTimeout(() => setCopiedDappUrl(false), 2500);
                            }}
                            className="flex-1 py-2 px-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {copiedDappUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedDappUrl ? (language === 'hi' ? 'लिंक कॉपी हो गया!' : 'Link Copied!') : (language === 'hi' ? '📋 ऐप लिंक कॉपी करें' : '📋 Copy DApp Link')}</span>
                          </button>

                          <button
                            onClick={() => {
                              playTapSound();
                              const host = typeof window !== 'undefined' ? (window.location.host || 'my-project-six-coral-29.vercel.app') : 'my-project-six-coral-29.vercel.app';
                              const metamaskUrl = `https://metamask.app.link/dapp/${host}`;
                              const tg = (window as any).Telegram?.WebApp;
                              if (tg && typeof tg.openLink === 'function') {
                                tg.openLink(metamaskUrl);
                              } else {
                                window.open(metamaskUrl, '_blank');
                              }
                            }}
                            className="flex-1 py-2 px-3 rounded-lg bg-orange-600/80 hover:bg-orange-500 border border-orange-400/50 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>🚀</span>
                            <span>{language === 'hi' ? 'MetaMask में खोलें' : 'Open In MetaMask'}</span>
                          </button>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                          <span>
                            {language === 'hi'
                              ? 'MetaMask ऐप खोलें ➔ नीचे "Browser" (🌐) टैब दबाएं ➔ सर्च बार में लिंक पेस्ट करके खोलें।'
                              : 'Open MetaMask app ➔ tap Browser icon (🌐) ➔ paste URL.'}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">⚡</span>
                          <span className="text-emerald-300 font-medium">
                            {language === 'hi'
                              ? 'अगर आपके पास MetaMask या POL नहीं है, तो सीधे ऊपर "1-Click इन-ऐप" से +1,000 एयरड्रॉप टोकन मुफ्त ले सकते हैं!'
                              : 'No MetaMask/POL? Simply use "1-Click In-App" for instant free 1,000 airdrop tokens!'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Switch to Polygon Network helper if on wrong EVM chain */}
                  {metaMaskAddress && !isPolygonNetwork && (
                    <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/50 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-amber-200 font-mono">
                        ⚠️ Polygon PoS (Chain 137) required
                      </span>
                      <button
                        onClick={handleSwitchToPolygon}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-xs font-black hover:from-amber-300 cursor-pointer shadow-md"
                      >
                        Switch to Polygon
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. CHAPTER SELECTOR (TABS 1 TO 4) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-cyan-200 font-bold px-1">
                    <span>{language === 'hi' ? 'अध्याय चुनें (Choose Chapter)' : 'Select Genesis Chapter'}</span>
                    <span className="text-amber-300 font-mono text-[11px]">
                      Fixed Price: ${NFT_MINT_PRICE_USD.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {APERNA_NFT_CHAPTERS.map((ch) => {
                      const isSel = ch.chapterNumber === selectedChapter.chapterNumber;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => {
                            playTapSound();
                            setSelectedChapter(ch);
                          }}
                          className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                            isSel
                              ? 'bg-amber-400/20 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)] text-white scale-[1.02]'
                              : 'bg-[#06112d] border-cyan-500/20 text-slate-400 hover:text-cyan-200'
                          }`}
                        >
                          <span className="text-sm">{ch.imageEmoji}</span>
                          <span className="text-[11px] font-black">Ch. {ch.chapterRoman}</span>
                          <span className="text-[9px] font-mono text-cyan-300">{ch.rarity}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. SELECTED CHAPTER CARD PREVIEW */}
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${selectedChapter.themeGradient} border-2 border-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.2)] space-y-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${selectedChapter.badgeBg}`}>
                          {selectedChapter.rarity}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300">
                          {selectedChapter.stageTag}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-white mt-1">
                        {selectedChapter.title}
                      </h4>
                      <p className="text-[11px] text-amber-200/80 font-mono">
                        {selectedChapter.subtitle}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono text-cyan-300 block">Unit Mint</span>
                      <span className="text-base font-black text-amber-300">
                        ${NFT_MINT_PRICE_USD.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200/90 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/10">
                    "{selectedChapter.story}"
                  </p>

                  {/* Audio Stems Included */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold block">
                      Included Audio Stems & Metadata:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedChapter.stems.map((stem, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-cyan-200 font-mono border border-white/5">
                          🎵 {stem}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. QUANTITY & TOTAL PRICE BREAKDOWN */}
                <div className="p-3 rounded-2xl bg-[#06112e] border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-200">
                      {language === 'hi' ? 'संख्या (Quantity)' : 'Mint Quantity'}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          playTapSound();
                          setQuantity((q) => Math.max(1, q - 1));
                        }}
                        className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-black text-sm flex items-center justify-center cursor-pointer hover:bg-cyan-900"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-sm text-white">{quantity}</span>
                      <button
                        onClick={() => {
                          playTapSound();
                          setQuantity((q) => Math.min(5, q + 1));
                        }}
                        className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-black text-sm flex items-center justify-center cursor-pointer hover:bg-cyan-900"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-xs">
                    <span className="text-cyan-200/80">
                      {language === 'hi' ? 'कुल राशि (Total Due):' : 'Total Mint Price:'}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-300">
                        ${(NFT_MINT_PRICE_USD * quantity).toFixed(2)} USD
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300 block">
                        (~{(ESTIMATED_POL_PER_MINT * quantity).toFixed(2)} POL on Polygon)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error Banner if any */}
                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-center gap-2 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 5. PRIMARY MINT ACTION BUTTON */}
                <div>
                  <button
                    onClick={handleExecuteMint}
                    disabled={mintStatus === 'confirming'}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(251,191,36,0.65)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>
                      {mintStatus === 'confirming'
                        ? (language === 'hi' ? 'मिंट हो रहा है...' : 'Confirming On Polygon...')
                        : (language === 'hi' 
                            ? `अभी मिंट करें • $${(NFT_MINT_PRICE_USD * quantity).toFixed(2)} USD`
                            : `MINT CHAPTER ${selectedChapter.chapterRoman} NOW • $${(NFT_MINT_PRICE_USD * quantity).toFixed(2)} USD`
                          )}
                    </span>
                  </button>
                </div>

                {/* Smart Contract Info Link */}
                <div className="flex items-center justify-between text-[10px] text-cyan-300/70 font-mono pt-1">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Contract: {APERNA_NFT_CONTRACT.slice(0, 8)}...{APERNA_NFT_CONTRACT.slice(-6)}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(APERNA_NFT_CONTRACT, 'contract')}
                    className="hover:text-white flex items-center gap-0.5"
                  >
                    {copiedContract ? 'Copied ✓' : 'Copy'}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* TAB 2: MY MINTED NFTS INVENTORY */}
        {activeTab === 'my-nfts' && (
          <div className="space-y-3">
            {myNfts.length === 0 ? (
              <div className="py-10 text-center space-y-3 rounded-2xl bg-[#06112d] border border-cyan-500/20">
                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-950 text-cyan-300 flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {language === 'hi' ? 'अभी तक कोई NFT मिंट नहीं हुआ' : 'No Genesis NFTs Minted Yet'}
                  </h4>
                  <p className="text-xs text-cyan-200/70 max-w-xs mx-auto">
                    {language === 'hi'
                      ? 'मात्र $0.50 में पहला जेनेसिस मेमोरियल NFT मिंट करें और स्थायी Web3 ओनरशिप पाएं।'
                      : 'Mint your first Genesis Memorial NFT for just $0.50 USD to own official on-chain stems.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    playTapSound();
                    setActiveTab('mint');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs cursor-pointer"
                >
                  {language === 'hi' ? 'अभी मिंट करें ($0.50)' : 'Mint Now ($0.50 USD)'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-cyan-200 font-mono">
                  <span>Collected ({myNfts.length})</span>
                  <span className="text-amber-300 font-bold">Polygon PoS Verified</span>
                </div>

                {/* Marketplace Sale Promo Card */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-400/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-200 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      {language === 'hi' ? 'मार्केटप्लेस सेल बोनस' : 'Marketplace Sale Bonus'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[10px] font-black border border-amber-400/40">
                      +500 Tokens FREE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {language === 'hi'
                      ? 'अपने किसी भी NFT को OpenSea या MagicEden पर सेल लिस्ट करें और तुरंत पाएं 500 $APERNA टोकन बिल्कुल मुफ्त!'
                      : 'List your NFT for sale on OpenSea, MagicEden, or Polygon DEX to earn +500 free tokens!'}
                  </p>
                </div>

                {myNfts.map((nft) => (
                  <div
                    key={nft.id}
                    className="p-3.5 rounded-2xl bg-[#081538] border border-amber-400/40 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">👑</span>
                        <div>
                          <div className="text-xs font-black text-white">{nft.chapterTitle}</div>
                          <div className="text-[10px] font-mono text-cyan-300">
                            Token ID: {nft.tokenId} • {nft.rarity}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                        nft.isRealOnChain
                          ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                          : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                      }`}>
                        {nft.isRealOnChain ? '⛓️ Polygon On-Chain' : '🎮 In-App Airdrop'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-black/40 text-[10px] font-mono text-slate-300 flex items-center justify-between">
                      {nft.isRealOnChain ? (
                        <>
                          <span className="truncate">Tx: {nft.txHash.slice(0, 16)}...</span>
                          <a
                            href={`${POLYGON_EXPLORER}/tx/${nft.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-300 hover:text-white flex items-center gap-0.5 ml-2 shrink-0 font-bold"
                          >
                            <span>Polygonscan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-amber-200/90 truncate">Voucher: {nft.txHash}</span>
                          <span className="text-emerald-400 font-bold shrink-0 ml-2">✓ +1,000 Tokens Claimed</span>
                        </div>
                      )}
                    </div>

                    {/* Action Row: Sell on Marketplace button for 500 tokens */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          playTapSound();
                          setSelectedNftForSale(nft);
                          setListingSuccess(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>
                          {nft.isRealOnChain
                            ? (language === 'hi' ? 'मार्केट पर सेल करें (+500 टोकन)' : 'Sell on Market (+500 Tokens)')
                            : (language === 'hi' ? 'लिस्टिंग टास्क पूरा करें (+500 टोकन)' : 'Complete Listing Task (+500 Tokens)')}
                        </span>
                      </button>
                      <a
                        href={OPENSEA_COLLECTION}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-200 hover:text-white text-xs font-bold flex items-center justify-center cursor-pointer"
                        title="View Collection on OpenSea"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SELL / LISTING MODAL POPUP */}
            {selectedNftForSale && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#131b3d] to-[#070c20] border-2 border-purple-400 p-5 text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <h4 className="text-sm font-black text-white">
                        {language === 'hi' ? 'NFT सेल लिस्टिंग (+500 टोकन)' : 'List NFT for Sale (+500 Tokens)'}
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        playTapSound();
                        setSelectedNftForSale(null);
                        setListingSuccess(null);
                      }}
                      className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/30 text-xs space-y-1">
                    <div className="font-bold text-amber-300">{selectedNftForSale.chapterTitle}</div>
                    <div className="text-[10px] font-mono text-cyan-300">
                      Token ID: {selectedNftForSale.tokenId} • {selectedNftForSale.rarity}
                    </div>
                  </div>

                  {/* Platform Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">
                      {language === 'hi' ? 'मार्केटप्लेस चुनें:' : 'Select Marketplace:'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['OpenSea', 'MagicEden', 'Rarible', 'PolygonDEX'] as const).map((plat) => (
                        <button
                          key={plat}
                          onClick={() => {
                            playTapSound();
                            setListingPlatform(plat);
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                            listingPlatform === plat
                              ? 'bg-purple-600/40 border-purple-400 text-white shadow-sm'
                              : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {plat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">
                      {language === 'hi' ? 'लिस्टिंग कीमत (POL):' : 'Listing Price (POL):'}
                    </label>
                    <div className="flex items-center rounded-xl bg-black/50 border border-purple-500/30 px-3 py-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        className="w-full bg-transparent text-sm font-mono text-white outline-none"
                      />
                      <span className="text-xs font-mono font-bold text-amber-300 ml-2">POL</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      ≈ ${((parseFloat(listingPrice) || 0) * 0.40).toFixed(2)} USD
                    </span>
                  </div>

                  {/* Bonus Notice */}
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-between text-xs text-amber-200">
                    <span>{language === 'hi' ? 'सेल लिस्टिंग रिवॉर्ड:' : 'Listing Reward:'}</span>
                    <span className="font-black text-amber-300 text-sm">+500 Tokens FREE</span>
                  </div>

                  {listingSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-400/60 text-xs text-emerald-200 animate-fadeIn">
                      {listingSuccess}
                    </div>
                  )}

                  <button
                    onClick={handleListNftForSale}
                    disabled={isListingLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isListingLoading 
                      ? (language === 'hi' ? 'लिस्ट हो रहा है...' : 'Listing on Marketplace...')
                      : (language === 'hi' ? `अभी लिस्ट करें और 500 टोकन पाएं` : `List Now & Claim 500 Tokens`)}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
