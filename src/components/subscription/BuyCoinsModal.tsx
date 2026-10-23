import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Coins, Sparkles, Check, ShieldCheck, X, CreditCard, ChevronRight, ArrowRight, Zap, Trophy, Heart, Smartphone } from 'lucide-react';
import { addUserCoins, getUserCoinsBalance } from '../../utils/readingStreak';

export interface CoinPack {
  id: string;
  coins: number;
  bonusCoins: number;
  totalCoins: number;
  priceZAR: number;
  priceUSD: number;
  tag?: string;
  isPopular?: boolean;
}

export const COIN_PACKS: CoinPack[] = [
  {
    id: 'pack-100',
    coins: 100,
    bonusCoins: 0,
    totalCoins: 100,
    priceZAR: 19,
    priceUSD: 1.05,
    tag: 'STARTER PACK',
  },
  {
    id: 'pack-500',
    coins: 500,
    bonusCoins: 50,
    totalCoins: 550,
    priceZAR: 89,
    priceUSD: 4.89,
    tag: 'MOST POPULAR',
    isPopular: true,
  },
  {
    id: 'pack-1200',
    coins: 1200,
    bonusCoins: 200,
    totalCoins: 1400,
    priceZAR: 199,
    priceUSD: 10.90,
    tag: 'BEST VALUE (+200 BONUS)',
  },
];

interface BuyCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinsPurchased?: (addedCoins: number, newBalance: number) => void;
}

export const BuyCoinsModal: React.FC<BuyCoinsModalProps> = ({
  isOpen,
  onClose,
  onCoinsPurchased,
}) => {
  const [selectedPackId, setSelectedPackId] = useState<string>('pack-500');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [coinsBalance, setCoinsBalance] = useState<number>(() => getUserCoinsBalance());

  if (!isOpen) return null;

  const selectedPack = COIN_PACKS.find((p) => p.id === selectedPackId) || COIN_PACKS[1];

  const handleCompletePurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newBal = addUserCoins(selectedPack.totalCoins);
      setCoinsBalance(newBal);
      setIsProcessing(false);
      setPurchaseSuccess(`Successfully added +${selectedPack.totalCoins} Pulse Coins via Google Play Billing!`);
      onCoinsPurchased?.(selectedPack.totalCoins, newBal);
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buy Pulse Coins"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-5 sm:p-7 shadow-2xl text-white space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black shadow-lg shadow-amber-500/30">
            <Coins className="w-6 h-6 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                COIN VAULT
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Balance: <strong className="text-amber-400">{coinsBalance} Coins</strong>
              </span>
            </div>
            <h2 className="font-['Bebas_Neue',sans-serif] text-2xl sm:text-3xl tracking-wide text-white">
              BUY <span className="text-amber-400">PULSE COINS</span>
            </h2>
          </div>
        </div>

        {purchaseSuccess ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-white">Coins Added!</h3>
            <p className="text-xs text-emerald-300">{purchaseSuccess}</p>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
              New Wallet Balance: <strong className="text-amber-400 text-base">{coinsBalance} Pulse Coins</strong>
            </div>
            <button
              onClick={() => {
                setPurchaseSuccess(null);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs hover:brightness-110 transition shadow-lg"
            >
              Continue Reading
            </button>
          </div>
        ) : (
          <>
            {/* Value Proposition Note */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-amber-500/20 p-2.5 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Unlock chapters for <strong className="text-amber-400">50 Coins</strong> each. <strong>70%</strong> goes straight to the manga author's ZAR Payouts!
              </span>
            </div>

            {/* Pack Selector Cards */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Select Coin Pack
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {COIN_PACKS.map((pack, idx) => {
                  const isSelected = selectedPackId === pack.id;
                  return (
                    <div
                      key={`coin-pack-${pack.id}-${idx}`}
                      onClick={() => setSelectedPackId(pack.id)}
                      className={`relative cursor-pointer rounded-2xl p-3.5 border transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/15'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                      }`}
                    >
                      {pack.tag && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide w-fit mb-2 ${
                            pack.isPopular
                              ? 'bg-amber-500 text-black shadow'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {pack.tag}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span className="text-xl font-black text-white font-mono">
                            {pack.coins}
                          </span>
                        </div>
                        {pack.bonusCoins > 0 && (
                          <span className="text-[10px] font-black text-emerald-400 block">
                            +{pack.bonusCoins} Bonus = {pack.totalCoins} Coins
                          </span>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800/80">
                        <span className="text-base font-black text-amber-300 font-mono block">
                          R{pack.priceZAR}.00
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          South African Rands (ZAR)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Google Play Billing Only */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Google Play Billing</span>
                <p className="text-[11px] text-slate-300">
                  Official Google Play In-App Purchase checkout.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCompletePurchase}
                className="min-h-[48px] w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm active:scale-95 transition shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {isProcessing ? (
                  <span>Authorizing Google Play...</span>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>Buy with Google Play (R{selectedPack.priceZAR}.00 ZAR)</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer Trust */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-Bit SSL Encrypted Escrow</span>
              </span>
              <span>70% Direct Creator Rev-Share</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
