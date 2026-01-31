import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Plus, Settings, UserPlus, ArrowLeft, Trash2, Camera, Key, GripVertical, RotateCcw, Video, Pencil, Landmark, Lock, TrendingUp, Download, Upload } from 'lucide-react';
import { Child, ActivityLog, Investment } from './types';
import { getChildren, saveChildren, getLogs, addLogEntry, updateLogEntry, deleteLogEntry, deleteChildData, getStoredApiKey, saveApiKey, checkMaturedInvestments, getInvestments, getBanks, withdrawInvestment, exportData, importData } from './services/storage';
import ChildCard from './components/ChildCard';
import ActivityForm from './components/ActivityForm';
import HistoryView from './components/HistoryView';
import InvestmentModal from './components/InvestmentModal';
import InvestmentDetailModal from './components/InvestmentDetailModal';

// --- Constants ---
const COIN_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"; // Arcade coin
const REDEEM_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3"; // Coin drop

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/fun-emoji/svg?seed=";

// --- Sub-components ---

const Dashboard: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for FD maturities globally on dashboard load
    checkMaturedInvestments();
    setChildren(getChildren());
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Required for Firefox
    e.dataTransfer.effectAllowed = "move"; 
    // Make the drag ghost transparent or custom if desired, but default is okay
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Allow drop
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Optional: Visual feedback could go here
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newChildren = [...children];
    const [draggedItem] = newChildren.splice(draggedIndex, 1);
    newChildren.splice(dropIndex, 0, draggedItem);
    
    setChildren(newChildren);
    saveChildren(newChildren);
    setDraggedIndex(null);
  };

  const handleSaveChild = (childData: Partial<Child>) => {
    // This is for adding new child
    const newChild: Child = {
      id: Date.now().toString(),
      name: childData.name || 'Unknown',
      avatarUrl: childData.avatarUrl || `${DEFAULT_AVATAR}${Date.now()}`,
      totalPoints: 0
    };
    const updated = [...children, newChild];
    saveChildren(updated);
    setChildren(updated);
    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 border-b border-slate-100 shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-indigo-600 tracking-tight">StarJar</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Child</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto p-6">
        {children.length === 0 ? (
          <div className="text-center mt-20 p-8 border-2 border-dashed border-slate-200 rounded-3xl">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full mx-auto flex items-center justify-center mb-4">
              <UserPlus className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">No Kids Added Yet</h2>
            <p className="text-slate-400 mb-6">Start by adding a profile to track rewards!</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="text-indigo-600 font-bold hover:underline"
            >
              Create First Profile
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((child, index) => (
              <ChildCard 
                key={child.id} 
                child={child} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => navigate(`/child/${child.id}`)}
                className={`transition-opacity ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Child Modal */}
      {isAddModalOpen && (
        <ChildModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={handleSaveChild} 
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
};

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState(getStoredApiKey() || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiKey(apiKey.trim());
    onClose();
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starjar_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("This will overwrite all current data. Are you sure you want to restore?")) {
      e.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        alert("Data restored successfully!");
        window.location.reload(); // Reload to reflect changes
      } else {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          Settings
        </h2>
        <form onSubmit={handleSave}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Gemini API Key
            </label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none font-medium text-slate-700"
              placeholder="Enter your API Key"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-2">
              Your key is stored locally in your browser to power AI features. 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline ml-1">
                Get a key here
              </a>.
            </p>
          </div>

          <div className="mb-6 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Data Backup</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={handleExport}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all text-slate-600 font-bold"
              >
                <Download className="w-6 h-6 text-indigo-500" />
                <span className="text-xs">Export Data</span>
              </button>
              <label className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all text-slate-600 font-bold cursor-pointer">
                <Upload className="w-6 h-6 text-indigo-500" />
                <span className="text-xs">Import Data</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChildDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [child, setChild] = useState<Child | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  
  // Modal State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  
  const [modalMode, setModalMode] = useState<'earn' | 'redeem'>('earn');
  const [editingLog, setEditingLog] = useState<ActivityLog | undefined>(undefined);

  // Sound refs
  const coinAudio = useRef<HTMLAudioElement>(new Audio(COIN_SOUND_URL));
  const redeemAudio = useRef<HTMLAudioElement>(new Audio(REDEEM_SOUND_URL));

  // Preload sounds
  useEffect(() => {
    coinAudio.current.volume = 0.6;
    redeemAudio.current.volume = 0.6;
  }, []);

  const loadData = useCallback(() => {
    checkMaturedInvestments(); // Check for maturities first
    
    const allChildren = getChildren();
    const found = allChildren.find(c => c.id === id);
    if (!found) {
      navigate('/');
      return;
    }
    setChild(found);
    
    const allLogs = getLogs();
    setLogs(allLogs.filter(l => l.childId === id));

    const allInv = getInvestments();
    const banks = getBanks(); // Ensure we use latest bank info
    
    setInvestments(allInv.filter(i => i.childId === id && i.status === 'active'));
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = (mode: 'earn' | 'redeem') => {
    setEditingLog(undefined);
    setModalMode(mode);
    setIsActivityModalOpen(true);
  };

  const handleOpenEditLog = (log: ActivityLog) => {
    setEditingLog(log);
    setModalMode(log.points >= 0 ? 'earn' : 'redeem');
    setIsActivityModalOpen(true);
  };

  const handleDeleteLog = (log: ActivityLog) => {
    if (confirm(`Delete entry "${log.description}"?`)) {
      deleteLogEntry(log.id);
      loadData();
    }
  };

  const handleSaveActivity = (entry: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    if (!child) return;
    
    if (editingLog) {
      // Update existing
      updateLogEntry({
        ...editingLog,
        ...entry
      });
    } else {
      // Add new
      const newLog: ActivityLog = {
        ...entry,
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      addLogEntry(newLog);
      
      // Play sound based on points polarity
      if (entry.points > 0) {
        coinAudio.current.currentTime = 0;
        coinAudio.current.play().catch(e => console.log("Audio play failed", e));
      } else {
        redeemAudio.current.currentTime = 0;
        redeemAudio.current.play().catch(e => console.log("Audio play failed", e));
      }
    }

    loadData();
  };

  const handleDeleteChild = () => {
    if (confirm("Are you sure? This will delete all history for this child.")) {
      if (id) deleteChildData(id);
      navigate('/');
    }
  };

  const handleUpdateProfile = (data: Partial<Child>) => {
    if (!child) return;
    const allChildren = getChildren();
    const index = allChildren.findIndex(c => c.id === child.id);
    if (index !== -1) {
      allChildren[index] = { ...allChildren[index], ...data };
      saveChildren(allChildren);
      loadData();
    }
    setIsEditProfileOpen(false);
  };

  const handleInvestmentSuccess = () => {
    setIsInvestModalOpen(false);
    redeemAudio.current.currentTime = 0;
    redeemAudio.current.play().catch(() => {});
    loadData();
  };

  const handleWithdraw = (invId: string) => {
    withdrawInvestment(invId);
    setSelectedInvestment(null);
    loadData();
  };

  if (!child) return null;
  const banks = getBanks();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <div className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-slate-700">{child.name}'s Profile</span>
        <div className="flex items-center">
          <button onClick={() => setIsEditProfileOpen(true)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors mr-1">
            <Pencil className="w-5 h-5" />
          </button>
          <button onClick={handleDeleteChild} className="p-2 -mr-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Big Header Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white text-center shadow-xl relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-white/30 shadow-lg mb-4 bg-white/10 backdrop-blur-sm overflow-hidden relative group">
               <img src={child.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
               <button 
                onClick={() => setIsEditProfileOpen(true)}
                className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <Pencil className="w-8 h-8 text-white" />
               </button>
            </div>
            <h2 className="text-3xl font-black mb-1">{child.name}</h2>
            <div className="text-6xl font-black tracking-tighter drop-shadow-md my-2">
              {child.totalPoints}
            </div>
            <p className="text-indigo-100 font-medium">Total Points</p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-8">
              <button 
                onClick={() => handleOpenAdd('redeem')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white py-3 rounded-2xl font-bold transition-all active:scale-95"
              >
                Redeem
              </button>
              <button 
                onClick={() => handleOpenAdd('earn')}
                className="bg-white text-indigo-600 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Points
              </button>
            </div>
          </div>
        </div>

        {/* Investment Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-indigo-500" />
              My FD Investments
            </h3>
            <button 
              onClick={() => setIsInvestModalOpen(true)}
              className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Open FD
            </button>
          </div>
          
          {investments.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <TrendingUp className="w-8 h-8 mx-auto text-slate-300 mb-2" />
               <p className="text-slate-400 text-sm">Grow your points by investing!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {investments.map(inv => {
                const bank = banks.find(b => b.id === inv.bankId);
                const matureDate = new Date(inv.maturityDate);
                const progress = Math.min(100, Math.max(0, ((Date.now() - inv.startDate) / (inv.maturityDate - inv.startDate)) * 100));

                return (
                  <div 
                    key={inv.id} 
                    onClick={() => setSelectedInvestment(inv)}
                    className="bg-white border border-slate-200 rounded-xl p-3 relative overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200">
                      <div className="bg-indigo-500 w-full transition-all duration-1000" style={{ height: `${progress}%` }}></div>
                    </div>
                    <div className="pl-3 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${bank?.color || 'bg-slate-500'}`}>
                            {bank?.name}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                             <Lock className="w-3 h-3" /> {inv.durationMonths} Mo
                          </span>
                        </div>
                        <div className="font-bold text-slate-700 text-lg mt-1">
                          {inv.principal} <span className="text-xs text-slate-400 font-normal">pts</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Returns</div>
                         <div className="font-bold text-indigo-600">+{inv.projectedReturn}</div>
                         <div className="text-[10px] text-slate-400">{matureDate.toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* History Section */}
        <div>
          <h3 className="text-lg font-bold text-slate-700 mb-4 px-2">History</h3>
          <HistoryView 
            logs={logs} 
            onEdit={handleOpenEditLog}
            onDelete={handleDeleteLog}
          />
        </div>
      </div>

      {/* Activity Modal */}
      {isActivityModalOpen && (
        <ActivityForm 
          childId={child.id}
          mode={modalMode}
          initialData={editingLog}
          onClose={() => setIsActivityModalOpen(false)}
          onSave={handleSaveActivity}
          availablePoints={child.totalPoints}
        />
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <ChildModal
          initialData={child}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={handleUpdateProfile}
        />
      )}

      {/* Investment Modal */}
      {isInvestModalOpen && (
        <InvestmentModal
          child={child}
          onClose={() => setIsInvestModalOpen(false)}
          onSuccess={handleInvestmentSuccess}
        />
      )}

      {/* Investment Detail Modal */}
      {selectedInvestment && (
        <InvestmentDetailModal
          investment={selectedInvestment}
          onClose={() => setSelectedInvestment(null)}
          onWithdraw={handleWithdraw}
        />
      )}
    </div>
  );
};

// --- Child Modal (Add/Edit) ---
interface ChildModalProps {
  onClose: () => void;
  onSave: (data: Partial<Child>) => void;
  initialData?: Child;
}

const ChildModal: React.FC<ChildModalProps> = ({ onClose, onSave, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || `${DEFAULT_AVATAR}${Date.now()}`);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 300 }, height: { ideal: 300 } } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      // Removed immediate assignment to videoRef.current because it is likely null here (element not mounted)
      // The useEffect below will handle assignment once the video element is rendered.
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  // Effect to attach stream when video element becomes available
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("Video play failed", e));
    }
  }, [isCameraOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      // Set canvas size to video size
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Optional: Crop to square
        const size = Math.min(canvas.width, canvas.height);
        const startX = (canvas.width - size) / 2;
        const startY = (canvas.height - size) / 2;
        
        const squareCanvas = document.createElement('canvas');
        squareCanvas.width = size;
        squareCanvas.height = size;
        const squareCtx = squareCanvas.getContext('2d');
        
        if (squareCtx) {
           squareCtx.drawImage(canvas, startX, startY, size, size, 0, 0, size, size);
           const dataUrl = squareCanvas.toDataURL('image/jpeg', 0.8);
           setAvatarUrl(dataUrl);
        }
      }
    }
    stopCamera();
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, avatarUrl });
  };

  const randomizeAvatar = () => {
    setAvatarUrl(`${DEFAULT_AVATAR}${Date.now()}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">{initialData ? 'Edit Profile' : 'New Profile'}</h2>
        
        {!isCameraOpen ? (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-slate-100 mb-3 overflow-hidden border-2 border-slate-100 relative cursor-pointer" onClick={startCamera}>
                  <img src={avatarUrl} alt="avatar preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 text-sm">
                <button type="button" onClick={startCamera} className="flex items-center gap-1 text-indigo-500 font-semibold hover:underline">
                  <Camera className="w-4 h-4" /> Take Photo
                </button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={randomizeAvatar} className="flex items-center gap-1 text-indigo-500 font-semibold hover:underline">
                  <RotateCcw className="w-4 h-4" /> Randomize
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-600 mb-2">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none font-bold text-slate-700"
                placeholder="e.g. Alice"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!name} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {initialData ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center">
             <div className="w-full aspect-square bg-black rounded-xl overflow-hidden mb-4 relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-4 border-white/20 rounded-full scale-75 pointer-events-none"></div>
             </div>
             <div className="flex gap-3 w-full">
                <button 
                  onClick={stopCamera} 
                  className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={capturePhoto} 
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" /> Capture
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/child/:id" element={<ChildDetail />} />
      </Routes>
    </Router>
  );
};

export default App;