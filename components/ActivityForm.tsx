import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Minus, Plus, Coins, Gift } from 'lucide-react';
import { suggestActivity } from '../services/ai';
import { ActivityLog } from '../types';

// Sounds
const SOUND_BTN_PLUS = "https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3"; // Light coin
const SOUND_BTN_MINUS = "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3"; // Coin drop/clink

interface ActivityFormProps {
  childId: string;
  initialData?: ActivityLog;
  onSave: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  onClose: () => void;
  mode?: 'earn' | 'redeem';
}

const ActivityForm: React.FC<ActivityFormProps> = ({ childId, initialData, onSave, onClose, mode: propMode }) => {
  // Determine mode from initialData if available, otherwise use prop
  const effectiveMode = initialData 
    ? (initialData.points >= 0 ? 'earn' : 'redeem') 
    : (propMode || 'earn');

  const [description, setDescription] = useState(initialData?.description || '');
  const [points, setPoints] = useState(initialData ? Math.abs(initialData.points) : 10);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [category, setCategory] = useState<'chore' | 'behavior' | 'redemption' | 'other'>(
    initialData?.category || (effectiveMode === 'earn' ? 'chore' : 'redemption')
  );

  // Audio refs for button interaction
  const audioPlus = useRef(new Audio(SOUND_BTN_PLUS));
  const audioMinus = useRef(new Audio(SOUND_BTN_MINUS));

  // Pre-load sounds
  useEffect(() => {
    audioPlus.current.volume = 0.5;
    audioMinus.current.volume = 0.5;
  }, []);

  const playSound = (type: 'plus' | 'minus') => {
    const audio = type === 'plus' ? audioPlus.current : audioMinus.current;
    audio.currentTime = 0;
    audio.play().catch(() => {}); // Ignore interaction errors
  };

  const handleAiSuggest = async () => {
    if (!description.trim()) return;
    setIsAiLoading(true);
    const suggestion = await suggestActivity(description);
    setIsAiLoading(false);

    if (suggestion) {
      setDescription(suggestion.description);
      // Ensure points polarity matches mode
      const absPoints = Math.abs(suggestion.points);
      setPoints(absPoints);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPoints = effectiveMode === 'redeem' ? -Math.abs(points) : Math.abs(points);
    onSave({
      childId,
      description,
      points: finalPoints,
      category
    });
    onClose();
  };

  const presetAmounts = [5, 10, 20, 50, 100];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
        
        {/* Header */}
        <div className={`p-4 flex justify-between items-center ${effectiveMode === 'earn' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {effectiveMode === 'earn' ? <Coins className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
            {initialData ? 'Edit Activity' : (effectiveMode === 'earn' ? 'Add Points' : 'Redeem Reward')}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 block">Activity Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={effectiveMode === 'earn' ? "e.g. Cleaned room, Finished homework" : "e.g. Bought a toy, 1 hour TV"}
                className="w-full pl-4 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none text-lg transition-colors"
                autoFocus
                required
              />
              {process.env.API_KEY && (
                <button 
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={isAiLoading || !description}
                  className="absolute right-2 top-2 p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Auto-suggest points"
                >
                  <Sparkles className={`w-5 h-5 ${isAiLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Points Control */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 block">Points</label>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => {
                  playSound('minus');
                  setPoints(Math.max(1, points - 1));
                }}
                className="p-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-600"
              >
                <Minus className="w-6 h-6" />
              </button>
              
              <div className="flex-1 text-center">
                <span className={`text-5xl font-bold ${effectiveMode === 'earn' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {points}
                </span>
              </div>

              <button 
                type="button"
                onClick={() => {
                  playSound('plus');
                  setPoints(points + 1);
                }}
                className="p-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-600"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            
            {/* Presets */}
            <div className="flex gap-2 justify-center mt-2">
              {presetAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    playSound('plus');
                    setPoints(amt);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    points === amt 
                      ? (effectiveMode === 'earn' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-rose-100 border-rose-300 text-rose-700')
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
              effectiveMode === 'earn' 
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-emerald-200' 
                : 'bg-gradient-to-r from-rose-400 to-pink-500 shadow-rose-200'
            }`}
          >
            {initialData ? 'Update' : (effectiveMode === 'earn' ? 'Add Points' : 'Redeem Points')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;
