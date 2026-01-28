import React, { useState, useEffect } from 'react';
import { X, Landmark, TrendingUp, Calendar, ArrowRight, RefreshCw, Signal, Globe, ExternalLink } from 'lucide-react';
import { getBanks, createInvestment, updateBankRates } from '../services/storage';
import { fetchLiveBankRates } from '../services/ai';
import { Child, Bank } from '../types';

interface InvestmentModalProps {
  child: Child;
  onClose: () => void;
  onSuccess: () => void;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ child, onClose, onSuccess }) => {
  const [banks, setBanks] = useState<Bank[]>(getBanks());
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [duration, setDuration] = useState<number>(1); // Months
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);

  // Fetch live rates on mount
  useEffect(() => {
    const updateRates = async () => {
      setIsLoadingRates(true);
      const result = await fetchLiveBankRates();
      if (result) {
        updateBankRates(result.rates);
        setBanks(getBanks()); // Reload from storage
        setSources(result.sources);
      }
      setIsLoadingRates(false);
    };

    updateRates();
  }, []);

  const selectedBank = banks.find(b => b.id === selectedBankId);

  const calculateReturn = () => {
    if (!selectedBank || !amount) return 0;
    // P * R * T formula
    const interest = Math.ceil(amount * (selectedBank.rate / 100) * (duration / 12));
    return interest;
  };

  const handleInvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankId || amount <= 0 || amount > child.totalPoints) return;
    
    createInvestment(child.id, selectedBankId, amount, duration);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Landmark className="w-6 h-6 text-yellow-400" />
              Fixed Deposit
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-400 text-sm">Invest points to earn more!</p>
              {isLoadingRates ? (
                 <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Finding Best Promo Rates...
                 </span>
              ) : (
                 <span className="text-[10px] bg-green-900 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Signal className="w-3 h-3" /> Best Live Rates Active
                 </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!selectedBankId ? (
            <div className="space-y-4">
              <p className="font-bold text-slate-700 mb-2">Choose a Bank:</p>
              {banks.map(bank => (
                <button
                  key={bank.id}
                  onClick={() => setSelectedBankId(bank.id)}
                  className="w-full text-left group relative overflow-hidden bg-white border-2 border-slate-100 rounded-2xl p-4 hover:border-indigo-500 hover:shadow-lg transition-all"
                >
                  <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-xs font-bold ${bank.color}`}>
                    {bank.rate.toFixed(2)}% p.a.
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-sm shrink-0 ${bank.color}`}>
                      {bank.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">
                        {bank.name}
                      </h3>
                      <p className="text-slate-500 text-sm leading-snug mt-1">
                        {bank.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleInvest} className="space-y-6">
              
              {/* Selected Bank Summary */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${selectedBank?.color}`}>
                    {selectedBank?.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedBank?.name}</h3>
                    <div className="text-xs text-slate-500">{selectedBank?.rate}% Return</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedBankId(null)}
                  className="text-indigo-500 text-sm font-semibold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 flex justify-between">
                  Investment Amount
                  <span className="text-indigo-600">Max: {child.totalPoints}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={child.totalPoints}
                    value={amount || ''}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full p-4 text-2xl font-black text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="0"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">PTS</div>
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Duration</label>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDuration(m)}
                      className={`py-3 rounded-xl font-bold border-2 transition-all ${
                        duration === m 
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {m} Mo
                    </button>
                  ))}
                </div>
              </div>

              {/* Return Preview */}
              <div className="bg-indigo-900 text-white p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Estimated Return</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">+{calculateReturn()}</span>
                    <span className="text-sm font-medium opacity-80">points</span>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-400" />
              </div>

              <button
                type="submit"
                disabled={amount <= 0 || amount > child.totalPoints}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                 Confirm Investment <ArrowRight className="w-5 h-5" />
              </button>

            </form>
          )}

          {/* Sources Section */}
          {sources.length > 0 && !selectedBankId && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Data Sources (Google Search)
              </h4>
              <div className="space-y-2">
                {sources.slice(0, 3).map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-indigo-50 transition-colors group"
                  >
                    <span className="text-xs font-medium text-slate-600 truncate max-w-[80%] group-hover:text-indigo-700">
                      {source.title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentModal;