import React, { useState, useEffect } from 'react';
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
  UserCircle
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

// Initialisation
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ID Projet
const appId = 'izitask-19ac3';

// --- Constantes & Types ---
const QUADRANTS = {
  Q1: { 
    id: 'Q1', 
    title: 'FAIRE', 
    subtitle: 'Urgent & Important', 
    color: 'bg-red-50', 
    headerColor: 'bg-red-100',
    borderColor: 'border-red-500', 
    textColor: 'text-red-700',
    tagColor: 'bg-red-200 text-red-800',
    icon: AlertCircle,
    desc: 'Crises, deadlines immédiates'
  },
  Q2: { 
    id: 'Q2', 
    title: 'PLANIFIER', 
    subtitle: 'Pas Urgent & Important', 
    color: 'bg-blue-50', 
    headerColor: 'bg-blue-100',
    borderColor: 'border-blue-500', 
    textColor: 'text-blue-700',
    tagColor: 'bg-blue-200 text-blue-800',
    icon: Clock,
    desc: 'Stratégie, prévention'
  },
  Q3: { 
    id: 'Q3', 
    title: 'DÉLÉGUER', 
    subtitle: 'Urgent & Pas Important', 
    color: 'bg-amber-50', 
    headerColor: 'bg-amber-100',
    borderColor: 'border-amber-500', 
    textColor: 'text-amber-700',
    tagColor: 'bg-amber-200 text-amber-800',
    icon: ArrowRightCircle,
    desc: 'Interruptions, réunions'
  },
  Q4: { 
    id: 'Q4', 
    title: 'ÉLIMINER', 
    subtitle: 'Pas Urgent & Pas Important', 
    color: 'bg-slate-50', 
    headerColor: 'bg-slate-100',
    borderColor: 'border-slate-400', 
    textColor: 'text-slate-600',
    tagColor: 'bg-slate-200 text-slate-700',
    icon: Trash2,
    desc: 'Distractions'
  }
};

// --- Utilitaires Dates ---
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

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

  // --- AUTO-INJECTION DU STYLE ---
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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setViewedUserId(u.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Profil Perso
  useEffect(() => {
    if (!user) {
      setMyProfile(null);
      return;
    }
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setMyProfile(snap.data());
      else setMyProfile(null);
    });
    return () => unsubscribe();
  }, [user]);

  // Liste Utilisateurs
  useEffect(() => {
    if (!user) return;
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'team_users');
    const unsubscribe = onSnapshot(usersRef, (snap) => {
      const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(users.sort((a, b) => a.displayName.localeCompare(b.displayName)));
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [user]);

  // Gérer la création/mise à jour du profil après connexion
  const handleJoinTeam = async (name, uid) => {
    if (!name.trim() || !uid) return;
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_users', uid);
    
    // On utilise setDoc avec merge: true pour ne pas écraser la date de création si l'utilisateur existe déjà
    await setDoc(userRef, {
      displayName: name,
      lastActive: serverTimestamp(),
      // On ne met createdAt que si le document n'existait pas (géré par merge mais createdAt serait écrasé si on le passe ici sans check, 
      // astuce: on le fait en deux temps ou on accepte que createdAt soit reset si on force un nouveau profil, 
      // ici pour simplifier on merge tout, si createdAt manque il sera ajouté plus tard ou on l'ajoute si snapshot vide)
    }, { merge: true });

    // Pour garantir un createdAt sur les nouveaux :
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

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 font-sans">Chargement...</div>;
  
  // Si pas connecté ou pas de profil, afficher Login
  if (!user || !myProfile) {
    return <LoginScreen onJoin={handleJoinTeam} auth={auth} user={user} />;
  }

  const viewedUser = allUsers.find(u => u.id === viewedUserId) || myProfile;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
                <Zap className="text-white w-5 h-5 fill-current" />
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-indigo-900 tracking-tight">Izitask</h1>
            </div>
            
            <div className="flex md:hidden bg-slate-100 rounded-lg p-1">
              <button onClick={() => setCurrentView('matrix')} className={`p-1.5 rounded-md ${currentView === 'matrix' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setCurrentView('calendar')} className={`p-1.5 rounded-md ${currentView === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}><CalendarIcon size={18} /></button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
            <div className="hidden md:flex bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button onClick={() => setCurrentView('matrix')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'matrix' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <LayoutGrid size={16} /> Matrice
              </button>
              <button onClick={() => setCurrentView('calendar')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'calendar' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}>
                <CalendarIcon size={16} /> Calendrier
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 flex-1 sm:flex-none">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide whitespace-nowrap">Voir :</span>
                <select value={viewedUserId || ''} onChange={(e) => setViewedUserId(e.target.value)} className="bg-transparent text-sm font-medium text-indigo-700 focus:outline-none cursor-pointer w-full">
                  <option value={user.uid}>Moi ({myProfile.displayName})</option>
                  {allUsers.filter(u => u.id !== user.uid).map(u => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </select>
              </div>
              
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 shrink-0">
                {myProfile.displayName.substring(0, 2).toUpperCase()}
              </div>

              <button 
                onClick={handleLogout}
                className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Se déconnecter"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-4 md:p-6 w-full overflow-hidden">
        <div className="mb-4">
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             {viewedUser.id === user.uid ? "Mon Espace" : `Espace de ${viewedUser.displayName}`}
             <span className="text-slate-400 font-normal text-sm">| {currentView === 'matrix' ? 'Vue Priorités' : 'Vue Planning'}</span>
           </h2>
        </div>

        <DataManager currentUser={user} viewedUserId={viewedUserId} currentView={currentView} />
      </main>
    </div>
  );
}

// --- Login Screen ---
function LoginScreen({ onJoin, auth, user }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Si l'utilisateur est déjà authentifié (ex: via Google) mais n'a pas de profil,
  // on déclenche automatiquement la création du profil.
  useEffect(() => {
    if (user && user.displayName) {
      onJoin(user.displayName, user.uid);
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Le useEffect ci-dessus gérera la suite une fois 'user' mis à jour
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion Google. Vérifiez que le domaine est autorisé.");
    }
  };

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const result = await signInAnonymously(auth);
      onJoin(name, result.user.uid);
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion invité.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-4 rounded-full shadow-inner">
            <Zap className="w-10 h-10 text-indigo-600 fill-current" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-center text-slate-800 mb-2">Izitask</h1>
        <p className="text-center text-slate-500 mb-8">Rejoignez votre équipe.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 text-center">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-lg border border-slate-300 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase font-medium">Ou en invité</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleGuestLogin} className="space-y-3">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Votre Prénom"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-200">
              Entrer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- Gestionnaire de Données ---
function DataManager({ currentUser, viewedUserId, currentView }) {
  const [tasks, setTasks] = useState([]);

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

  const deleteTask = async (taskId) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', taskId)); } 
    catch (e) { console.error(e); }
  };

  const toggleTask = async (task) => {
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', task.id), {
        isCompleted: !task.isCompleted
      }); 
    } catch (e) { console.error(e); }
  };

  if (currentView === 'matrix') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 h-auto md:h-[calc(100vh-12rem)]">
        {Object.values(QUADRANTS).map(q => (
          <Quadrant key={q.id} config={q} tasks={tasks.filter(t => t.quadrant === q.id)} onAdd={addTask} onDelete={deleteTask} onToggle={toggleTask} />
        ))}
      </div>
    );
  } else {
    return <CalendarView tasks={tasks} onToggle={toggleTask} />;
  }
}

// --- Composant Calendrier ---
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2"><CalendarDays className="text-indigo-600" />{monthName}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</div>)}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
        {totalSlots.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="bg-slate-50/30 border-b border-r border-slate-100" />;
          const dateString = new Date(year, month, day, 12).toISOString().split('T')[0];
          const dayTasks = tasksByDate[dateString] || [];
          const isToday = new Date().toISOString().split('T')[0] === dateString;
          return (
            <div key={day} className={`min-h-[100px] p-1 sm:p-2 border-b border-r border-slate-100 hover:bg-slate-50 transition-colors relative group ${isToday ? 'bg-indigo-50/30' : ''}`}>
              <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{day}</div>
              <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayTasks.map(task => {
                  const qConfig = QUADRANTS[task.quadrant];
                  return (
                    <div key={task.id} onClick={() => onToggle(task)} className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer transition-opacity ${qConfig.tagColor} ${qConfig.borderColor} ${task.isCompleted ? 'opacity-40 line-through' : 'opacity-100 hover:opacity-80'}`} title={task.text}>{task.text}</div>
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

// --- Composant Quadrant (Matrice) ---
function Quadrant({ config, tasks, onAdd, onDelete, onToggle }) {
  const [newItem, setNewItem] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showDateInput, setShowDateInput] = useState(false);
  const Icon = config.icon;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(newItem, config.id, deadline);
    setNewItem('');
    setDeadline('');
    setShowDateInput(false);
  };

  return (
    <div className={`flex flex-col rounded-xl border-t-4 shadow-sm bg-white h-full overflow-hidden transition-all hover:shadow-md ${config.borderColor}`}>
      <div className={`p-3 border-b border-slate-100 flex justify-between items-start ${config.headerColor}`}>
        <div>
          <h3 className={`font-bold text-lg flex items-center gap-2 ${config.textColor}`}><Icon size={20} />{config.title}</h3>
          <p className="text-xs font-medium text-slate-600 opacity-80 uppercase tracking-wider mt-0.5">{config.subtitle}</p>
        </div>
        <span className="bg-white/50 text-xs font-bold px-2 py-1 rounded-md text-slate-600">{tasks.length}</span>
      </div>
      <div className={`flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar ${config.color}`}>
        {tasks.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm p-4 text-center italic opacity-60">{config.desc}</div>}
        {tasks.map(task => (
          <div key={task.id} className={`group relative flex flex-col gap-1 p-3 rounded-lg border transition-all ${task.isCompleted ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-100 hover:border-indigo-300 shadow-sm'}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => onToggle(task)} className={`mt-0.5 shrink-0 ${task.isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}>
                {task.isCompleted ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-current" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`block text-sm break-words ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>{task.text}</span>
                {task.deadline && <div className={`flex items-center gap-1 text-[10px] mt-1 font-medium ${new Date(task.deadline) < new Date() && !task.isCompleted ? 'text-red-500' : 'text-slate-400'}`}><CalendarIcon size={10} />{formatDate(task.deadline)}</div>}
              </div>
              <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-1 absolute top-2 right-2 bg-white rounded-full shadow-sm" title="Supprimer"><XCircle size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100 bg-white">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Nouvelle tâche..." className="flex-1 text-sm px-3 py-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
            <button type="button" onClick={() => setShowDateInput(!showDateInput)} className={`p-2 rounded-md border transition-colors ${showDateInput || deadline ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-500'}`} title="Ajouter une deadline"><CalendarIcon size={18} /></button>
            <button type="submit" disabled={!newItem.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:hover:bg-indigo-600 p-2 rounded-md transition-colors shadow-sm"><Plus size={18} /></button>
          </div>
          {showDateInput && <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200"><span className="text-xs text-slate-500 font-medium">Échéance :</span><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="text-xs p-1 border border-slate-200 rounded focus:border-indigo-500 outline-none text-slate-600" /></div>}
        </form>
      </div>
    </div>
  );
}