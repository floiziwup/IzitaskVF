import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRightCircle, 
  XCircle,
  LayoutGrid,
  Zap,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LogOut,
  UserCircle,
  FileText,
  Link as LinkIcon,
  X,
  Save,
  MoreHorizontal,
  Edit2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';

// --- Configuration Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyA5SWiG7-nDWSH97ERmL1b9-xw_XQ3ScUo",
  authDomain: "izitask-19ac3.firebaseapp.com",
  projectId: "izitask-19ac3",
  storageBucket: "izitask-19ac3.firebasestorage.app",
  messagingSenderId: "796907498239",
  appId: "1:796907498239:web:e74835098fe804b48ffaca",
  measurementId: "G-TVZE9B0NMD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'izitask-19ac3';

// --- Constantes & Types ---
const QUADRANTS = {
  Q1: { 
    id: 'Q1', 
    title: 'À FAIRE', 
    subtitle: 'Urgent & Important', 
    color: 'bg-red-50/50', 
    headerColor: 'bg-white',
    accentColor: 'text-red-600',
    borderColor: 'border-red-200',
    taskBg: 'bg-red-50 hover:bg-red-100 border-red-100',
    icon: AlertCircle,
    desc: 'Crises, deadlines immédiates'
  },
  Q2: { 
    id: 'Q2', 
    title: 'PLANIFIER', 
    subtitle: 'Important, Pas Urgent', 
    color: 'bg-blue-50/50', 
    headerColor: 'bg-white',
    accentColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    taskBg: 'bg-blue-50 hover:bg-blue-100 border-blue-100',
    icon: Clock,
    desc: 'Stratégie, prévention'
  },
  Q3: { 
    id: 'Q3', 
    title: 'DÉLÉGUER', 
    subtitle: 'Urgent, Pas Important', 
    color: 'bg-amber-50/50', 
    headerColor: 'bg-white',
    accentColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    taskBg: 'bg-amber-50 hover:bg-amber-100 border-amber-100',
    icon: ArrowRightCircle,
    desc: 'Interruptions, réunions'
  },
  Q4: { 
    id: 'Q4', 
    title: 'ÉLIMINER', 
    subtitle: 'Ni Urgent, Ni Important', 
    color: 'bg-slate-50/50', 
    headerColor: 'bg-white',
    accentColor: 'text-slate-500',
    borderColor: 'border-slate-200',
    taskBg: 'bg-slate-50 hover:bg-slate-100 border-slate-200',
    icon: Trash2,
    desc: 'Distractions'
  }
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; 
};

// --- Composant Principal ---
export default function App() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [viewedUserId, setViewedUserId] = useState(null);
  const [currentView, setCurrentView] = useState('matrix');
  const [loading, setLoading] = useState(true);

  // Injection Tailwind
  useEffect(() => {
    const scriptId = 'tailwind-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://cdn.tailwindcss.com";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setViewedUserId(u.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Profil
  useEffect(() => {
    if (!user) { setMyProfile(null); return; }
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setMyProfile(snap.data());
    });
    return () => unsubscribe();
  }, [user]);

  // Liste Users
  useEffect(() => {
    if (!user) return;
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'team_users');
    const unsubscribe = onSnapshot(usersRef, (snap) => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(users.sort((a, b) => a.displayName.localeCompare(b.displayName)));
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [user]);

  const handleJoinTeam = async (name, uid) => {
    if (!name.trim() || !uid) return;
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_users', uid);
    await setDoc(userRef, {
      displayName: name,
      lastActive: serverTimestamp(),
    }, { merge: true });
    
    const snap = await getDoc(userRef);
    if (!snap.data().createdAt) {
      await updateDoc(userRef, { createdAt: serverTimestamp() });
    }
    setViewedUserId(uid);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMyProfile(null);
    setUser(null);
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400 font-sans text-sm animate-pulse">Chargement Izitask...</div>;
  if (!user || !myProfile) return <LoginScreen onJoin={handleJoinTeam} auth={auth} user={user} />;

  const viewedUser = allUsers.find(u => u.id === viewedUserId) || myProfile;

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header Minimaliste */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm shadow-indigo-200">
              <Zap className="text-white w-4 h-4 fill-current" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Izitask</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
            {/* View Toggle */}
            <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-100">
              <button onClick={() => setCurrentView('matrix')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${currentView === 'matrix' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                <LayoutGrid size={14} /> Matrice
              </button>
              <button onClick={() => setCurrentView('calendar')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${currentView === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                <CalendarIcon size={14} /> Calendrier
              </button>
            </div>

            {/* User Selector */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <select 
                  value={viewedUserId || ''} 
                  onChange={(e) => setViewedUserId(e.target.value)} 
                  className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer focus:outline-none transition-colors"
                >
                  <option value={user.uid}>Mon Espace</option>
                  {allUsers.filter(u => u.id !== user.uid).map(u => (
                    <option key={u.id} value={u.id}>Espace de {u.displayName}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-3 h-3 text-slate-400 rotate-90" />
                </div>
              </div>
              
              <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] border border-indigo-100">
                {myProfile.displayName.substring(0, 2).toUpperCase()}
              </div>

              <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 transition-colors" title="Déconnexion">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-6 w-full overflow-hidden">
        <DataManager currentUser={user} viewedUserId={viewedUserId} currentView={currentView} />
      </main>
    </div>
  );
}

// --- Modale d'Édition ---
function TaskModal({ task, onClose, onSave }) {
  const [title, setTitle] = useState(task.text || '');
  const [desc, setDesc] = useState(task.description || '');
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [links, setLinks] = useState(task.attachments || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkName, setNewLinkName] = useState('');

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newLinkUrl.trim()) return;
    const name = newLinkName.trim() || 'Document';
    setLinks([...links, { url: newLinkUrl, name }]);
    setNewLinkUrl('');
    setNewLinkName('');
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSave(task.id, { 
      text: title, 
      description: desc, 
      deadline, 
      attachments: links 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">Détails de la tâche</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Titre */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Titre</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-300 transition-colors"
              placeholder="Nom de la tâche..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <FileText size={14} /> Description
            </label>
            <textarea 
              value={desc} 
              onChange={e => setDesc(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-32 leading-relaxed"
              placeholder="Ajouter des détails, contexte..."
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <CalendarIcon size={14} /> Échéance
            </label>
            <input 
              type="date" 
              value={deadline} 
              onChange={e => setDeadline(e.target.value)}
              className="text-sm p-2 border border-slate-200 bg-white rounded-lg outline-none focus:border-indigo-500 text-slate-600 w-full sm:w-auto"
            />
          </div>

          {/* Documents / Liens */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <LinkIcon size={14} /> Documents & Liens
            </label>
            
            {/* Liste des liens */}
            {links.length > 0 && (
              <div className="space-y-2 mb-3">
                {links.map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 group">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 font-medium hover:underline truncate flex-1">
                      {link.name}
                    </a>
                    <button onClick={() => removeLink(idx)} className="text-indigo-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Ajout de lien */}
            <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <input 
                type="text" 
                placeholder="Nom du fichier..." 
                value={newLinkName}
                onChange={e => setNewLinkName(e.target.value)}
                className="bg-white text-xs p-2 rounded border border-slate-200 outline-none flex-1"
              />
              <input 
                type="url" 
                placeholder="https://..." 
                value={newLinkUrl}
                onChange={e => setNewLinkUrl(e.target.value)}
                className="bg-white text-xs p-2 rounded border border-slate-200 outline-none flex-[2]"
              />
              <button onClick={handleAddLink} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition-colors text-xs font-bold">
                Ajouter
              </button>
            </div>
            <p className="text-[10px] text-slate-400 italic">Copiez ici les liens de vos Google Drive, Dropbox, Notion, etc.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
            Annuler
          </button>
          <button onClick={handleSubmit} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-2">
            <Save size={16} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Gestionnaire de Données ---
function DataManager({ currentUser, viewedUserId, currentView }) {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (!viewedUserId) return;
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'team_tasks');
    const q = query(tasksRef, where('targetUserId', '==', viewedUserId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const loadedTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(loadedTasks);
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [viewedUserId]);

  const addTask = async (text, quadrantId, deadline) => {
    if (!text.trim()) return;
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'team_tasks');
    await addDoc(tasksRef, {
      text: text,
      quadrant: quadrantId,
      targetUserId: viewedUserId,
      createdBy: currentUser.uid,
      isCompleted: false,
      deadline: deadline || null,
      createdAt: serverTimestamp()
    });
  };

  const updateTask = async (taskId, updates) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', taskId), updates);
    } catch (e) { console.error(e); }
  };

  const deleteTask = async (taskId) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', taskId)); } 
    catch (e) { console.error(e); }
  };

  const toggleTask = async (task, e) => {
    e.stopPropagation(); // Empêcher l'ouverture de la modale
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', task.id), {
        isCompleted: !task.isCompleted
      }); 
    } catch (e) { console.error(e); }
  };

  return (
    <>
      {currentView === 'matrix' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[calc(100vh-8rem)]">
          {Object.values(QUADRANTS).map(q => (
            <Quadrant 
              key={q.id} 
              config={q} 
              tasks={tasks.filter(t => t.quadrant === q.id)} 
              onAdd={addTask} 
              onDelete={deleteTask} 
              onToggle={toggleTask}
              onEdit={setEditingTask}
            />
          ))}
        </div>
      ) : (
        <CalendarView tasks={tasks} onToggle={toggleTask} />
      )}

      {editingTask && (
        <TaskModal 
          task={editingTask} 
          onClose={() => setEditingTask(null)} 
          onSave={updateTask}
        />
      )}
    </>
  );
}

// --- Composant Quadrant (Avec Date Picker à la création) ---
function Quadrant({ config, tasks, onAdd, onDelete, onToggle, onEdit }) {
  const [newItem, setNewItem] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [showDateInput, setShowDateInput] = useState(false);
  const Icon = config.icon;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(newItem, config.id, newDeadline);
    setNewItem('');
    setNewDeadline('');
    setShowDateInput(false);
  };

  return (
    <div className={`flex flex-col rounded-2xl border ${config.borderColor} bg-white h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300`}>
      {/* Header Fin et Élégant */}
      <div className={`px-5 py-4 border-b border-slate-50 flex justify-between items-center ${config.headerColor}`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-md ${config.color.replace('/50', '')}`}>
            <Icon size={16} className={config.accentColor} />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${config.accentColor} tracking-wide uppercase`}>{config.title}</h3>
          </div>
        </div>
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color} ${config.accentColor}`}>
          {tasks.length}
        </div>
      </div>

      {/* Liste Tâches Épurée */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-white">
        {tasks.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
            <div className="p-3 bg-slate-50 rounded-full"><Icon size={24} className="opacity-20" /></div>
            <p className="text-xs font-medium">{config.desc}</p>
          </div>
        )}
        
        {tasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => onEdit(task)}
            className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              task.isCompleted 
                ? 'bg-slate-50 opacity-50 border-transparent' 
                : `${config.taskBg} shadow-sm hover:shadow-md border`
            }`}
          >
            <button 
              onClick={(e) => onToggle(task, e)}
              className={`mt-0.5 shrink-0 transition-colors ${task.isCompleted ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}
            >
              {task.isCompleted ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-current" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <span className={`block text-sm leading-tight ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                {task.text}
              </span>
              
              <div className="flex items-center gap-3 mt-1.5">
                {task.deadline && (
                  <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.deadline) < new Date() && !task.isCompleted ? 'text-red-500' : 'text-slate-500'}`}>
                    <CalendarIcon size={10} />
                    {formatDate(task.deadline)}
                  </div>
                )}
                {task.attachments?.length > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-indigo-500">
                    <LinkIcon size={10} />
                    {task.attachments.length} doc{task.attachments.length > 1 ? 's' : ''}
                  </div>
                )}
                {task.description && (
                   <FileText size={10} className="text-slate-400" />
                )}
              </div>
            </div>

            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
               <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md">
                 <Edit2 size={12} />
               </button>
               <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                 <Trash2 size={12} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Input Minimaliste avec Date Picker */}
      <div className="p-3 border-t border-slate-50 bg-white">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-transparent focus-within:border-indigo-100 focus-within:bg-white focus-within:shadow-sm transition-all">
            <Plus size={16} className="text-slate-400" />
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Nouvelle tâche..."
              className="flex-1 text-sm bg-transparent border-none focus:ring-0 placeholder:text-slate-400 outline-none text-slate-700"
            />
            <button 
              type="button" 
              onClick={() => setShowDateInput(!showDateInput)}
              className={`p-1.5 rounded-md transition-colors ${showDateInput || newDeadline ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
              title="Ajouter une date limite"
            >
              <CalendarIcon size={14} />
            </button>
          </div>
          
          {/* Zone Date Picker qui s'affiche au clic */}
          {showDateInput && (
            <div className="flex items-center gap-2 px-1 animate-in slide-in-from-top-1 duration-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Pour le :</span>
              <input 
                type="date" 
                value={newDeadline} 
                onChange={(e) => setNewDeadline(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-indigo-400 text-slate-600"
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// --- Composant Calendrier (Légèrement épuré) ---
function CalendarView({ tasks, onToggle }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.deadline) {
      if (!acc[task.deadline]) acc[task.deadline] = [];
      acc[task.deadline].push(task);
    }
    return acc;
  }, {});
  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);
  const blanks = Array(startDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...days];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-slate-50">
        <h3 className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2"><CalendarDays className="text-indigo-600" />{monthName}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><ChevronLeft size={20} className="text-slate-500" /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><ChevronRight size={20} className="text-slate-500" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} className="py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>)}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
        {totalSlots.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="bg-slate-50/20 border-b border-r border-slate-50" />;
          const dateString = new Date(year, month, day, 12).toISOString().split('T')[0];
          const dayTasks = tasksByDate[dateString] || [];
          const isToday = new Date().toISOString().split('T')[0] === dateString;
          return (
            <div key={day} className={`min-h-[100px] p-2 border-b border-r border-slate-50 hover:bg-slate-50/50 transition-colors relative group ${isToday ? 'bg-indigo-50/20' : ''}`}>
              <div className={`text-xs font-bold mb-2 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{day}</div>
              <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayTasks.map(task => {
                  const qConfig = QUADRANTS[task.quadrant];
                  return (
                    <div key={task.id} onClick={(e) => onToggle(task, e)} className={`text-[10px] px-2 py-1 rounded-md border truncate cursor-pointer transition-opacity flex items-center gap-1 ${qConfig.color} border-${qConfig.borderColor} ${task.isCompleted ? 'opacity-40 line-through' : 'opacity-100 hover:opacity-80'}`} title={task.text}>
                       <div className={`w-1.5 h-1.5 rounded-full ${qConfig.accentColor.replace('text', 'bg')}`}></div>
                       {task.text}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Login Screen (Google Uniquement) ---
function LoginScreen({ onJoin, auth, user }) {
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.displayName) {
      onJoin(user.displayName, user.uid);
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion Google.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 font-sans selection:bg-indigo-100">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Bienvenue sur Izitask</h1>
        <p className="text-center text-slate-500 mb-10 text-sm">L'outil de productivité de votre équipe.</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center">{error}</div>}
        
        <div className="space-y-4">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-200 transition-all text-sm shadow-sm hover:shadow-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuer avec Google
          </button>
        </div>
      </div>
    </div>
  );
}