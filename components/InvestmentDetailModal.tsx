import React from 'react';
import { X, Lock, AlertTriangle, ArrowRight, Calendar, PiggyBank } from 'lucide-react';
import { Investment, Bank } from '../types';
import { getBanks } from '../services/storage';

interface InvestmentDetailModalProps {
  investment: Investment;
  onClose: () => void;
  onWithdraw: (id: string) => void;
}

const InvestmentDetailModal: React.FC<InvestmentDetailModalProps> = ({ investment, onClose, onWithdraw }) => {
  const banks = getBanks();
  const bank = banks.find(b => b.id === investment.bankId) as Bank;
  const startDate = new Date(investment.startDate);
  const maturityDate = new Date(investment.maturityDate);
  const now = Date.now();
  
  const totalDays = Math.max(1, (investment.maturityDate - investment.startDate));
  const elapsedDays = Math.max(0, (now - investment.startDate));
  const progressPercent = Math.min(100, (elapsedDays / totalDays) * 100);

  const daysLeft = Math.ceil((investment.maturityDate - now) / (1000 * 60 * 60 * 24));
  const isMature = now >= investment.maturityDate;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`${bank.color} p-6 text-white relative overflow-hidden`}>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="text-white/80 font-bold text-sm uppercase tracking-wider mb-1">Fixed Deposit</div>
              <h2 className="text-3xl font-black">{bank.name}</h2>
              <p className="text-white/90 text-sm mt-1">{bank.description}</p>
            </div>
            <button onClick={onClose} className="bg-black/20 hover:bg-black/30 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Decor */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
        </div>

        <div className="p-6">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="text-slate-400 text-xs font-bold uppercase">Principal</div>
              <div className="text-2xl font-black text-slate-800">{investment.principal}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
              <div className="text-indigo-400 text-xs font-bold uppercase">Upon Maturity</div>
              <div className="text-2xl font-black text-indigo-600">
                +{investment.projectedReturn} <span className="text-sm">pts</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm font-semibold text-slate-500 mb-2">
              <span>{startDate.toLocaleDateString()}</span>
              <span>{maturityDate.toLocaleDateString()}</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-1000 ${isMature ? 'bg-green-500' : 'bg-indigo-500'}`} 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="text-center mt-2 text-sm font-bold text-indigo-600">
              {isMature ? "Matured!" : `${daysLeft} days remaining`}
            </div>
          </div>

          {/* Action Section */}
          {!isMature && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-rose-100 p-2 rounded-full text-rose-500 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-700">Need points now?</h3>
                  <p className="text-sm text-rose-600/90 leading-snug">
                    If you withdraw early, you will <span className="font-black underline">LOSE</span> your interest of 
                    <span className="font-black mx-1 bg-white px-1 rounded text-rose-600">{investment.projectedReturn} points</span>.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm px-2">
                   <span className="text-slate-500">You will receive:</span>
                   <span className="font-bold text-slate-800">{investment.principal} pts</span>
                </div>
                <button 
                  onClick={() => onWithdraw(investment.id)}
                  className="w-full py-3 bg-white border-2 border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95"
                >
                  Withdraw Early & Lose Interest
                </button>
              </div>
            </div>
          )}
          
          {isMature && (
            <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200 text-green-700 font-bold">
               Investment Matured! Points have been credited.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailModal;