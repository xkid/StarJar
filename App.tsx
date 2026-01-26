import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Plus, Settings, UserPlus, ArrowLeft, Trash2, Camera, Key } from 'lucide-react';
import { Child, ActivityLog } from './types';
import { getChildren, saveChildren, getLogs, addLogEntry, updateLogEntry, deleteLogEntry, deleteChildData, getStoredApiKey, saveApiKey } from './services/storage';
import ChildCard from './components/ChildCard';
import ActivityForm from './components/ActivityForm';
import HistoryView from './components/HistoryView';

// --- Constants ---
const COIN_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"; 
const REDEEM_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3"; // Magic wand/success

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/fun-emoji/svg?seed=";

// --- Sub-components ---

const Dashboard: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setChildren(getChildren());
  }, []);

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
            {children.map(child => (
              <ChildCard 
                key={child.id} 
                child={child} 
                onClick={() => navigate(`/child/${child.id}`)} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Child Modal */}
      {isAddModalOpen && (
        <AddChildModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={(newChild) => {
            const updated = [...children, newChild];
            saveChildren(updated);
            setChildren(updated);
            setIsAddModalOpen(false);
          }} 
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

          <div className="flex gap-3">
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
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'earn' | 'redeem'>('earn');
  const [editingLog, setEditingLog] = useState<ActivityLog | undefined>(undefined);

  // Sound refs
  const coinAudio = useRef<HTMLAudioElement>(new Audio(COIN_SOUND_URL));
  const redeemAudio = useRef<HTMLAudioElement>(new Audio(REDEEM_SOUND_URL));

  const loadData = useCallback(() => {
    const allChildren = getChildren();
    const found = allChildren.find(c => c.id === id);
    if (!found) {
      navigate('/');
      return;
    }
    setChild(found);
    
    const allLogs = getLogs();
    setLogs(allLogs.filter(l => l.childId === id));
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = (mode: 'earn' | 'redeem') => {
    setEditingLog(undefined);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: ActivityLog) => {
    setEditingLog(log);
    // Mode is inferred in the form, but we can set a default
    setModalMode(log.points >= 0 ? 'earn' : 'redeem');
    setIsModalOpen(true);
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
      // No sound for edit usually, or maybe a subtle one? Keeping it silent for now.
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

  if (!child) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <div className="bg-white sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-slate-700">{child.name}'s Profile</span>
        <button onClick={handleDeleteChild} className="p-2 -mr-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Big Header Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white text-center shadow-xl relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-white/30 shadow-lg mb-4 bg-white/10 backdrop-blur-sm overflow-hidden">
               <img src={child.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
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

        {/* History Section */}
        <div>
          <h3 className="text-lg font-bold text-slate-700 mb-4 px-2">History</h3>
          <HistoryView 
            logs={logs} 
            onEdit={handleOpenEdit}
            onDelete={handleDeleteLog}
          />
        </div>
      </div>

      {/* Activity Modal */}
      {isModalOpen && (
        <ActivityForm 
          childId={child.id}
          mode={modalMode}
          initialData={editingLog}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveActivity}
        />
      )}
    </div>
  );
};

// --- Add Child Modal ---
const AddChildModal: React.FC<{ onClose: () => void, onSave: (c: Child) => void }> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  // Use a generic random seed for avatar initially
  const [avatarSeed, setAvatarSeed] = useState(Date.now().toString());
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newChild: Child = {
      id: Date.now().toString(),
      name,
      avatarUrl: `${DEFAULT_AVATAR}${avatarSeed}`,
      totalPoints: 0
    };
    onSave(newChild);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">New Profile</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-slate-100 mb-3 overflow-hidden border-2 border-slate-100 relative group cursor-pointer" onClick={() => setAvatarSeed(Date.now().toString())}>
               <img src={`${DEFAULT_AVATAR}${avatarSeed}`} alt="avatar preview" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera className="text-white w-8 h-8" />
               </div>
            </div>
            <button type="button" onClick={() => setAvatarSeed(Date.now().toString())} className="text-xs text-indigo-500 font-semibold hover:underline">
              Randomize Avatar
            </button>
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
              Create
            </button>
          </div>
        </form>
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
