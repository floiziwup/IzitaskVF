import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, CheckCircle2, AlertCircle, Clock, ArrowRightCircle, XCircle, LayoutGrid, Zap, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, CalendarDays, LogOut, UserCircle, FileText, 
  Link as LinkIcon, X, Save, MoreHorizontal, Edit2, GripVertical, CalendarPlus, BookOpen, Search, 
  TestTube, Lock, Building2, Bold, Italic, Underline, List, ListOrdered, Check, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, AlertTriangle, Send, Briefcase, Users, Palette
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, where, updateDoc, 
  serverTimestamp, setDoc, getDoc, orderBy 
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

// --- CONFIGURATION ADMINISTRATEURS ---
const ADMIN_EMAILS = [
  'florent.lahilla@iziwup.com',
  'stanislas.hoareau@iziwup.com',
  'jeanne.lemelinaire@iziwup.com'
];

const isUserAdmin = (user) => {
  if (!user) return false;
  if (user.isAnonymous) return true; 
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
  return false;
};

// --- Constantes & Types ---
// Mise à jour des couleurs pour le mode sombre (dark:)
const QUADRANTS = {
  Q1: { 
    id: 'Q1', title: 'À FAIRE', subtitle: 'Urgent & Important', 
    color: 'bg-red-50/50 dark:bg-red-900/20', 
    headerColor: 'bg-white dark:bg-slate-800', 
    accentColor: 'text-red-600 dark:text-red-400', 
    borderColor: 'border-red-200 dark:border-red-900', 
    taskBg: 'bg-red-50 hover:bg-red-100 border-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:border-red-800', 
    icon: AlertCircle, desc: 'Crises, deadlines immédiates' 
  },
  Q2: { 
    id: 'Q2', title: 'PLANIFIER', subtitle: 'Important, Pas Urgent', 
    color: 'bg-blue-50/50 dark:bg-blue-900/20', 
    headerColor: 'bg-white dark:bg-slate-800', 
    accentColor: 'text-blue-600 dark:text-blue-400', 
    borderColor: 'border-blue-200 dark:border-blue-900', 
    taskBg: 'bg-blue-50 hover:bg-blue-100 border-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:border-blue-800', 
    icon: Clock, desc: 'Stratégie, prévention' 
  },
  Q3: { 
    id: 'Q3', title: 'DÉLÉGUER', subtitle: 'Urgent, Pas Important', 
    color: 'bg-amber-50/50 dark:bg-amber-900/20', 
    headerColor: 'bg-white dark:bg-slate-800', 
    accentColor: 'text-amber-600 dark:text-amber-400', 
    borderColor: 'border-amber-200 dark:border-amber-900', 
    taskBg: 'bg-amber-50 hover:bg-amber-100 border-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:border-amber-800', 
    icon: ArrowRightCircle, desc: 'Interruptions, réunions' 
  },
  Q4: { 
    id: 'Q4', title: 'ÉLIMINER', subtitle: 'Ni Urgent, Ni Important', 
    color: 'bg-slate-50/50 dark:bg-slate-800/30', 
    headerColor: 'bg-white dark:bg-slate-800', 
    accentColor: 'text-slate-500 dark:text-slate-400', 
    borderColor: 'border-slate-200 dark:border-slate-700', 
    taskBg: 'bg-slate-50 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600', 
    icon: Trash2, desc: 'Distractions' 
  }
};

const DEFAULT_KANBAN_COLUMNS = [
  { id: 'todo', title: 'À FAIRE', color: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-200 dark:border-slate-700', accentColor: 'text-slate-600 dark:text-slate-300' },
  { id: 'doing', title: 'EN COURS', color: 'bg-blue-50 dark:bg-blue-900/30', borderColor: 'border-blue-200 dark:border-blue-800', accentColor: 'text-blue-600 dark:text-blue-400' },
  { id: 'done', title: 'TERMINÉ', color: 'bg-emerald-50 dark:bg-emerald-900/30', borderColor: 'border-emerald-200 dark:border-emerald-800', accentColor: 'text-emerald-600 dark:text-emerald-400' }
];

const COLOR_PALETTES = [
  { id: 'slate', color: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-200 dark:border-slate-700', accentColor: 'text-slate-600 dark:text-slate-300' },
  { id: 'blue', color: 'bg-blue-50 dark:bg-blue-900/30', borderColor: 'border-blue-200 dark:border-blue-800', accentColor: 'text-blue-600 dark:text-blue-400' },
  { id: 'emerald', color: 'bg-emerald-50 dark:bg-emerald-900/30', borderColor: 'border-emerald-200 dark:border-emerald-800', accentColor: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'red', color: 'bg-red-50 dark:bg-red-900/30', borderColor: 'border-red-200 dark:border-red-800', accentColor: 'text-red-600 dark:text-red-400' },
  { id: 'amber', color: 'bg-amber-50 dark:bg-amber-900/30', borderColor: 'border-amber-200 dark:border-amber-800', accentColor: 'text-amber-600 dark:text-amber-400' },
  { id: 'purple', color: 'bg-purple-50 dark:bg-purple-900/30', borderColor: 'border-purple-200 dark:border-purple-800', accentColor: 'text-purple-600 dark:text-purple-400' },
  { id: 'pink', color: 'bg-pink-50 dark:bg-pink-900/30', borderColor: 'border-pink-200 dark:border-pink-800', accentColor: 'text-pink-600 dark:text-pink-400' },
];

// --- Helpers ---
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

const stripHtml = (html) => {
   if (!html) return "";
   if (typeof html !== 'string') return "";
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

const execCmd = (cmd) => {
  document.execCommand(cmd, false, null);
};

// ==========================================
// COMPOSANTS ENFANTS
// ==========================================

// 1. Barre d'outils Éditeur
function EditorToolbar() {
  return (
    <div className="flex gap-1 p-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex-wrap">
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors" title="Gras"><Bold size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors" title="Italique"><Italic size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors" title="Souligné"><Underline size={14} /></button>
      <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 h-3 self-center"></div>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors" title="Gauche"><AlignLeft size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors" title="Centrer"><AlignCenter size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors" title="Droite"><AlignRight size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyFull'); }} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors" title="Justifier"><AlignJustify size={14} /></button>
      <div className="w-px bg-slate-300 dark:bg-slate-700 mx-1 h-3 self-center"></div>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors" title="Puces"><List size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} className="p-1 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors" title="Numéros"><ListOrdered size={14} /></button>
    </div>
  );
}

// 2. Écran de Connexion
function LoginScreen({ onJoin, auth, user, externalError }) {
  const [error, setError] = useState('');
  const [showTestLogin, setShowTestLogin] = useState(false);

  useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  useEffect(() => {
    if (user && user.displayName && !externalError) {
      onJoin(user.displayName, user.uid, user.email); 
    }
  }, [user, externalError]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login Error:", err);
      setShowTestLogin(true);
      if (err.code === 'auth/operation-not-allowed') setError("Google Auth non activé.");
      else if (err.code === 'auth/popup-blocked') setError("Popup bloquée.");
      else if (err.code === 'auth/unauthorized-domain') setError(`Domaine non autorisé.`);
      else setError("Erreur connexion (Aperçu). Utilisez le mode Test.");
    }
  };

  const handleTestLogin = async () => {
    try {
      const result = await signInAnonymously(auth);
      await onJoin("Florent (Test)", result.user.uid, "test@iziwup.com");
    } catch (err) {
      setError("Erreur connexion test.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-4 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
           {/* LOGO */}
           <img src="https://static.wixstatic.com/media/cc17fd_d3286f978f6a47dcb202b3eeb3eb1419~mv2.png" alt="Logo IZIWUP" className="h-16 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">Bienvenue sur Izitask</h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10 text-sm">L'outil de productivité de votre équipe.</p>
        {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg text-center border border-red-100 dark:border-red-900 font-medium">{error}</div>}
        <div className="space-y-4">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-semibold py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-all text-sm shadow-sm hover:shadow-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuer avec Google
          </button>
          {showTestLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div><span className="flex-shrink mx-4 text-slate-300 dark:text-slate-600 text-[10px] uppercase font-bold tracking-wider">Mode Secours</span><div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div></div>
              <button onClick={handleTestLogin} className="w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed transition-all text-xs"><TestTube size={14} /> Connexion Test (Aperçu)</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. Modale Tâche
function TaskModal({ task, onClose, onSave, allUsers }) {
  const [title, setTitle] = useState(task.text || '');
  const [desc, setDesc] = useState(task.description || '');
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [links, setLinks] = useState(task.attachments || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkName, setNewLinkName] = useState('');
  const [isCompleted, setIsCompleted] = useState(task.isCompleted || false);
  const [delegateTo, setDelegateTo] = useState(''); 
  const editorRef = useRef(null);

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

  useEffect(() => {
    if (editorRef.current) {
        editorRef.current.innerHTML = desc;
    }
  }, []);

  const handleSubmit = () => {
    const contentToSave = editorRef.current ? editorRef.current.innerHTML : desc;
    
    // Logique de délégation
    if (delegateTo) {
      onSave(task.id, { 
        text: title, 
        description: contentToSave, 
        deadline, 
        attachments: links, 
        isCompleted,
        targetUserId: delegateTo,
        quadrant: 'Q1'
      });
    } else {
      onSave(task.id, { 
        text: title, 
        description: contentToSave, 
        deadline, 
        attachments: links, 
        isCompleted,
        quadrant: task.quadrant 
      });
    }
    
    onClose();
  };

  const handleToggleComplete = () => setIsCompleted(!isCompleted);

  const handleAddToCalendar = () => {
    if (!deadline) return;
    const dateStr = deadline.replace(/-/g, '');
    const startDateTime = `${dateStr}T090000`;
    const endDateTime = `${dateStr}T100000`;
    const plainDesc = stripHtml(desc);
    const details = `${plainDesc || ''}\n\nLien Izitask : ${window.location.href}`;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&dates=${startDateTime}/${endDateTime}`;
    window.open(url, '_blank');
  };

  const isNew = task.id === 'new';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-50 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">{isNew ? "Nouvelle tâche" : "Détails de la tâche"}</h3>
          <div className="flex gap-2">
             {!isNew && (
                <button onClick={handleToggleComplete} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                  {isCompleted ? <Check size={14} /> : <div className="w-3.5 h-3.5 border-2 border-current rounded-full" />}
                  {isCompleted ? 'Terminée' : 'À faire'}
                </button>
             )}
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors"><X size={18} /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          
          {task.quadrant === 'Q3' && !isNew && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <ArrowRightCircle size={14} /> Déléguer cette tâche à :
              </label>
              <div className="flex gap-2">
                <select 
                  value={delegateTo}
                  onChange={(e) => setDelegateTo(e.target.value)}
                  className="flex-1 text-sm border-amber-200 dark:border-amber-800 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-slate-900 dark:text-white"
                >
                  <option value="">-- Choisir un membre --</option>
                  {allUsers.filter(u => u.id !== task.targetUserId).map(u => (
                    <option key={u.id} value={u.id}>{u.displayName} {u.email ? `(${u.email})` : ''}</option>
                  ))}
                </select>
                {delegateTo && (
                   <button 
                     onClick={handleSubmit} 
                     className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 rounded-lg flex items-center gap-2 transition-colors"
                   >
                     <Send size={14} /> Transférer
                   </button>
                )}
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-2 italic">
                * La tâche sera déplacée dans la colonne "À FAIRE" de cette personne.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Titre</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full text-lg font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Nom de la tâche..." autoFocus />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2"><FileText size={14} /> Description</label>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all bg-white dark:bg-slate-950">
                <EditorToolbar />
                <div
                  ref={editorRef}
                  className="rich-text w-full p-3 text-sm text-slate-700 dark:text-slate-200 outline-none min-h-[8rem] max-h-[16rem] overflow-y-auto resize-y"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setDesc(e.currentTarget.innerHTML)}
                  placeholder="Ajouter des détails..."
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2"><CalendarIcon size={14} /> Échéance</label>
            <div className="flex gap-2">
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="text-sm p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg outline-none focus:border-indigo-500 text-slate-600 dark:text-white w-full sm:w-auto" />
              {deadline && !isNew && <button onClick={handleAddToCalendar} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800"><CalendarPlus size={14} /> RDV 9h</button>}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-2"><LinkIcon size={14} /> Documents & Liens</label>
            {links.length > 0 && (
              <div className="space-y-2 mb-3">
                {links.map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-900/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline truncate flex-1">{link.name}</a>
                    <button onClick={() => removeLink(idx)} className="text-indigo-300 hover:text-red-500 dark:hover:text-red-400 px-2"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
              <input type="text" placeholder="Nom du fichier..." value={newLinkName} onChange={e => setNewLinkName(e.target.value)} className="bg-white dark:bg-slate-900 text-xs p-2 rounded border border-slate-200 dark:border-slate-700 outline-none flex-1 dark:text-white" />
              <input type="url" placeholder="https://..." value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} className="bg-white dark:bg-slate-900 text-xs p-2 rounded border border-slate-200 dark:border-slate-700 outline-none flex-[2] dark:text-white" />
              <button onClick={handleAddLink} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition-colors text-xs font-bold">Ajouter</button>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">Annuler</button>
          <button onClick={handleSubmit} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"><Save size={16} /> Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// 4. Modale Projet Tâche (Kanban)
function ProjectTaskModal({ task, onClose, onSave, allUsers }) {
  const [title, setTitle] = useState(task.text || '');
  const [desc, setDesc] = useState(task.description || '');
  const [deadline, setDeadline] = useState(task.deadline || '');
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || '');
  const editorRef = useRef(null);

  const handleSubmit = () => {
    const contentToSave = editorRef.current ? editorRef.current.innerHTML : desc;
    onSave(task.id, { text: title, description: contentToSave, deadline, assignedTo, projectId: task.projectId, status: task.status });
    onClose();
  };

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = desc;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">{task.id === 'new' ? 'Nouvelle Tâche de Projet' : 'Modifier la Tâche'}</h3>
        <input className="w-full text-lg font-bold border-b border-slate-200 dark:border-slate-700 mb-4 outline-none pb-2 focus:border-indigo-500 transition-colors bg-transparent dark:text-white" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre..." />
        <div className="mb-4">
           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Assigner à</label>
           <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full mt-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500">
             <option value="">Non assigné</option>
             {allUsers.map(u => <option key={u.id} value={u.id}>{u.displayName} {u.email ? `(${u.email})` : ''}</option>)}
           </select>
        </div>
        <div className="mb-4">
             <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Échéance</label>
             <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full mt-1 text-sm p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white rounded-lg outline-none focus:border-indigo-500" />
        </div>
        <div className="mb-4 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
           <EditorToolbar />
           <div ref={editorRef} contentEditable className="outline-none p-3 text-sm h-32 overflow-y-auto dark:text-slate-200" suppressContentEditableWarning onInput={(e) => setDesc(e.currentTarget.innerHTML)} placeholder="Description détaillée..." />
        </div>
        <div className="flex justify-end gap-2">
           <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Annuler</button>
           <button onClick={handleSubmit} className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// 5. Quadrant (Matrice)
function Quadrant({ config, tasks, onAdd, onDelete, onToggle, onEdit, onMoveTask }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const Icon = config.icon;
  const dragGhostRef = useRef(null);
  const draggingTaskId = useRef(null);

  const handleInitiateAdd = () => {
    onAdd(config.id); 
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { setIsDragOver(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onMoveTask(taskId, config.id);
  };
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTouchStart = (e, task) => {
    document.body.style.overflow = 'hidden'; 
    const touch = e.touches[0];
    draggingTaskId.current = task.id;
    const ghost = document.createElement('div');
    ghost.innerText = task.text;
    ghost.style.position = 'fixed';
    ghost.style.left = `${touch.clientX}px`;
    ghost.style.top = `${touch.clientY}px`;
    ghost.style.background = 'white';
    ghost.style.padding = '10px';
    ghost.style.borderRadius = '8px';
    ghost.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2)';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    ghost.style.width = '200px';
    ghost.style.opacity = '0.9';
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;
  };
  const handleTouchMove = (e) => {
    if (!dragGhostRef.current) return;
    const touch = e.touches[0];
    dragGhostRef.current.style.left = `${touch.clientX}px`;
    dragGhostRef.current.style.top = `${touch.clientY}px`;
  };
  const handleTouchEnd = (e) => {
    document.body.style.overflow = '';
    if (dragGhostRef.current) {
      const touch = e.changedTouches[0];
      const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
      const targetQuadrant = elements.find(el => el.getAttribute('data-quadrant-id'));
      if (targetQuadrant) {
        const targetId = targetQuadrant.getAttribute('data-quadrant-id');
        if (targetId && draggingTaskId.current) onMoveTask(draggingTaskId.current, targetId);
      }
      document.body.removeChild(dragGhostRef.current);
      dragGhostRef.current = null;
    }
  };

  return (
    <div 
      className={`flex flex-col rounded-2xl border transition-all duration-300 bg-white dark:bg-slate-900 min-h-[500px] h-auto shadow-sm hover:shadow-md ${isDragOver ? 'ring-2 ring-indigo-400 bg-indigo-50/10' : config.borderColor}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-quadrant-id={config.id}
    >
      <div className={`px-5 py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center ${config.headerColor}`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-md ${config.color.replace('/50', '')}`}><Icon size={16} className={config.accentColor} /></div>
          <div><h3 className={`text-sm font-bold ${config.accentColor} tracking-wide uppercase`}>{config.title}</h3></div>
        </div>
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color} ${config.accentColor}`}>{tasks.length}</div>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {tasks.map(task => (
          <div 
            key={task.id} 
            draggable="true" 
            onDragStart={(e) => handleDragStart(e, task.id)}
            onClick={() => onEdit(task)}
            className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all ${task.isCompleted ? 'bg-slate-50 dark:bg-slate-800 opacity-50 border-transparent' : `${config.taskBg} shadow-sm hover:shadow-md border`} active:cursor-grabbing`}
          >
            <div className="mt-1 text-slate-300 dark:text-slate-600 cursor-grab touch-none active:text-indigo-500" onTouchStart={(e) => handleTouchStart(e, task)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}><GripVertical size={16} /></div>
            <button onClick={(e) => onToggle(task, e)} className={`mt-0.5 shrink-0 transition-colors ${task.isCompleted ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}>{task.isCompleted ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-current dark:border-slate-500" />}</button>
            <div className="flex-1 min-w-0">
              <span className={`block text-sm leading-tight ${task.isCompleted ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>{task.text}</span>
              <div className="flex items-center gap-3 mt-1.5">
                {task.deadline && <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.deadline) < new Date() && !task.isCompleted ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}><CalendarIcon size={10} />{formatDate(task.deadline)}</div>}
                {task.attachments?.length > 0 && <div className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 dark:text-indigo-400"><LinkIcon size={10} />{task.attachments.length} doc</div>}
              </div>
            </div>
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
               <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md"><Edit2 size={12} /></button>
               <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"><X size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button 
          onClick={handleInitiateAdd}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-sm font-bold"
        >
          <Plus size={18} /> Ajouter une tâche
        </button>
      </div>
    </div>
  );
}

// 6. CalendarView
function CalendarView({ tasks, onToggle, onEdit }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const filteredTasks = tasks.filter(t => t.quadrant === 'Q1' || t.quadrant === 'Q2');
  const tasksByDate = filteredTasks.reduce((acc, task) => {
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2"><CalendarDays className="text-indigo-600 dark:text-indigo-400" />{monthName}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"><ChevronLeft size={20} className="text-slate-500 dark:text-slate-400" /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"><ChevronRight size={20} className="text-slate-500 dark:text-slate-400" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} className="py-3 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{d}</div>)}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
        {totalSlots.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="bg-slate-50/20 dark:bg-slate-800/20 border-b border-r border-slate-50 dark:border-slate-800" />;
          const dateString = new Date(year, month, day, 12).toISOString().split('T')[0];
          const dayTasks = tasksByDate[dateString] || [];
          return (
            <div key={day} className="min-h-[100px] p-2 border-b border-r border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 relative group">
              <div className="text-xs font-bold mb-2 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">{day}</div>
              <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayTasks.map(task => (
                  <div key={task.id} onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="text-[10px] px-2 py-1 rounded-md border truncate cursor-pointer bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title={task.text}>{task.text}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 7. ProjectCalendarView (Nouveau - Calendrier pour les projets)
function ProjectCalendarView({ tasks, columns, onEdit, allUsers }) {
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1 flex flex-col overflow-hidden min-h-[500px]">
      <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2"><CalendarDays className="text-indigo-600 dark:text-indigo-400" size={18} />{monthName}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"><ChevronLeft size={18} className="text-slate-500 dark:text-slate-400" /></button>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"><ChevronRight size={18} className="text-slate-500 dark:text-slate-400" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{d}</div>)}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
        {totalSlots.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="bg-slate-50/10 dark:bg-slate-800/10 border-b border-r border-slate-50 dark:border-slate-800" />;
          const dateString = new Date(year, month, day, 12).toISOString().split('T')[0];
          const dayTasks = tasksByDate[dateString] || [];
          const isToday = new Date().toISOString().split('T')[0] === dateString;
          return (
            <div key={day} className={`min-h-[100px] p-2 border-b border-r border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 relative group ${isToday ? 'bg-indigo-50/10 dark:bg-indigo-900/10' : ''}`}>
              <div className={`text-[10px] font-bold mb-1.5 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{day}</div>
              <div className="space-y-1.5 overflow-y-auto max-h-[120px] custom-scrollbar">
                {dayTasks.map(task => {
                  const col = columns.find(c => c.id === task.status) || columns[0];
                  const assignedUser = allUsers.find(u => u.id === task.assignedTo);
                  return (
                    <div key={task.id} onClick={(e) => { e.stopPropagation(); onEdit(task); }} className={`p-1.5 rounded-md border cursor-pointer hover:shadow-sm transition-all ${col.color} ${col.borderColor}`} title={task.text}>
                       <div className={`text-[10px] font-bold truncate ${col.accentColor}`}>{task.text}</div>
                       {assignedUser && (
                         <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-600 bg-white/60 dark:bg-slate-900/60 px-1 rounded truncate">
                            <UserCircle size={10} className="shrink-0" /> <span className="truncate">{assignedUser.displayName}</span>
                         </div>
                       )}
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

// 8. MeetingMinutesView
function MeetingMinutesView({ currentUser, userProfile, isAdmin }) {
  const [currentFolder, setCurrentFolder] = useState('team'); 
  const [minutes, setMinutes] = useState([]);
  const [selectedMinute, setSelectedMinute] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const editorRef = useRef(null);

  const canCreate = currentFolder === 'team' ? isAdmin : true;
  const canModify = currentFolder === 'personal' ? true : (isAdmin || (selectedMinute && selectedMinute.createdBy === currentUser.uid));

  useEffect(() => {
    setSelectedMinute(null);
    setIsEditing(false);
    let minutesRef;
    if (currentFolder === 'team') {
      minutesRef = collection(db, 'artifacts', appId, 'public', 'data', 'team_minutes');
    } else {
      minutesRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'personal_minutes');
    }
    const unsubscribe = onSnapshot(minutesRef, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setMinutes(docs);
      if (selectedMinute) {
        const updated = docs.find(d => d.id === selectedMinute.id);
        if (updated && !isEditing) setSelectedMinute(updated);
      }
    });
    return () => unsubscribe();
  }, [currentFolder, currentUser.uid]);

  useEffect(() => {
    if (isEditing && editorRef.current) editorRef.current.innerHTML = editContent;
  }, [isEditing]);

  const handleCreate = () => {
    if (!canCreate) return;
    const today = new Date().toISOString().split('T')[0];
    const newDraft = { id: 'new', date: today, title: 'Note sans titre', content: '', createdBy: currentUser.uid };
    setSelectedMinute(newDraft);
    setEditDate(newDraft.date);
    setEditTitle(newDraft.title);
    setEditContent(newDraft.content);
    setIsEditing(true);
  };
  const handleSelect = (minute) => { setSelectedMinute(minute); setIsEditing(false); };
  const handleEdit = () => { if (!selectedMinute || !canModify) return; setEditDate(selectedMinute.date); setEditTitle(selectedMinute.title); setEditContent(selectedMinute.content); setIsEditing(true); };
  const handleSave = async () => {
    const contentToSave = editorRef.current ? editorRef.current.innerHTML : editContent;
    const data = { date: editDate, title: editTitle, content: contentToSave, lastModifiedBy: currentUser.uid, lastModifiedAt: serverTimestamp() };
    let minutesRef = currentFolder === 'team' ? collection(db, 'artifacts', appId, 'public', 'data', 'team_minutes') : collection(db, 'artifacts', appId, 'users', currentUser.uid, 'personal_minutes');
    
    if (selectedMinute.id === 'new') {
      const docRef = await addDoc(minutesRef, { ...data, createdBy: currentUser.uid, createdAt: serverTimestamp() });
      setIsEditing(false);
      setSelectedMinute({ id: docRef.id, ...data, createdBy: currentUser.uid });
    } else {
       let docPath = currentFolder === 'team' ? doc(db, 'artifacts', appId, 'public', 'data', 'team_minutes', selectedMinute.id) : doc(db, 'artifacts', appId, 'users', currentUser.uid, 'personal_minutes', selectedMinute.id);
       await updateDoc(docPath, data);
       setIsEditing(false);
    }
  };
  const confirmDelete = async () => {
     let docPath = currentFolder === 'team' ? doc(db, 'artifacts', appId, 'public', 'data', 'team_minutes', selectedMinute.id) : doc(db, 'artifacts', appId, 'users', currentUser.uid, 'personal_minutes', selectedMinute.id);
     await deleteDoc(docPath);
     setSelectedMinute(null);
     setIsEditing(false);
     setShowDeleteConfirm(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)] relative">
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm rounded-2xl">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl border border-red-100 dark:border-red-900 max-w-xs w-full animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center gap-3 text-center">
                 <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full text-red-500 dark:text-red-400"><AlertTriangle size={24} /></div>
                 <h3 className="font-bold text-slate-800 dark:text-white">Supprimer la note ?</h3>
                 <div className="flex gap-2 w-full">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">Annuler</button>
                    <button onClick={confirmDelete} className="flex-1 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg text-sm font-bold">Supprimer</button>
                 </div>
              </div>
           </div>
        </div>
      )}
      <div className="w-full md:w-1/3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex justify-between items-center"><h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" /> Carnets</h3>{(canCreate || currentFolder === 'personal') && <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg"><Plus size={16} /></button>}</div>
          <div className="flex p-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg">
            <button onClick={() => setCurrentFolder('team')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${currentFolder === 'team' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Building2 size={12} /> IZIWUP</button>
            <button onClick={() => setCurrentFolder('personal')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${currentFolder === 'personal' ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}><Lock size={12} /> Mes Notes</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {minutes.map(m => (
            <div key={m.id} onClick={() => handleSelect(m)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedMinute?.id === m.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'}`}>
              <div className="flex justify-between items-start mb-1"><span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate flex-1 pr-2">{m.title}</span><span className="text-[10px] bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(m.date)}</span></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{stripHtml(m.content) || "Nouvelle note..."}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm relative">
        {!selectedMinute ? <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600"><p className="text-sm font-medium">Sélectionnez un document</p></div> : (
          <>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex justify-between items-center">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full"><input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="bg-white dark:bg-slate-950 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-500" /><input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Titre..." className="flex-1 bg-white dark:bg-slate-950 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 text-sm font-semibold outline-none focus:border-indigo-500" /></div>
                ) : (
                  <div><h2 className="text-lg font-bold text-slate-800 dark:text-white">{selectedMinute.title}</h2><p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><CalendarIcon size={12} /> {formatDate(selectedMinute.date)}</p></div>
                )}
                <div className="flex gap-2 ml-4">
                  {isEditing ? <><button onClick={() => setIsEditing(false)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg"><X size={18} /></button><button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold"><Save size={16} /> Enregistrer</button></> : canModify && <><button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold border border-red-100 dark:border-red-900 transition-colors"><Trash2 size={16} /> Supprimer</button><button onClick={handleEdit} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium"><Edit2 size={16} /> Modifier</button></>}
                </div>
              </div>
              {isEditing && <EditorToolbar />}
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950 relative">
              {isEditing ? <div ref={editorRef} className="rich-text w-full h-full outline-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed overflow-y-auto cursor-text" contentEditable suppressContentEditableWarning onInput={(e) => setEditContent(e.currentTarget.innerHTML)} /> : <div className="rich-text prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedMinute.content || '<span class="text-slate-300 dark:text-slate-600 italic">Aucun contenu.</span>' }} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 8. ProjectBoard (Kanban)
function ProjectBoard({ project, currentUser, allUsers }) {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editingColId, setEditingColId] = useState(null);
  const [editColTitle, setEditColTitle] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'calendar'
  const [showColorPickerFor, setShowColorPickerFor] = useState(null);

  const columns = project.columns || DEFAULT_KANBAN_COLUMNS;

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'team_project_tasks'), where('projectId', '==', project.id));
    const unsubscribe = onSnapshot(q, (snap) => {
       setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [project.id]);

  const addTask = async (status) => {
    setEditingTask({ id: 'new', projectId: project.id, status, text: '', description: '', assignedTo: '' });
  };

  const updateTask = async (taskId, data) => {
    if (taskId === 'new') {
       await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'team_project_tasks'), { ...data, createdAt: serverTimestamp() });
    } else {
       await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_project_tasks', taskId), data);
    }
    setEditingTask(null);
  };
  
  const moveTask = async (taskId, newStatus) => {
     await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_project_tasks', taskId), { status: newStatus });
  };

  // --- NOUVELLES FONCTIONS COLONNES ---
  const handleAddColumn = async () => {
    const newId = 'col_' + Date.now();
    const newCol = { id: newId, title: 'Nouvelle Colonne', color: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-200 dark:border-slate-700', accentColor: 'text-slate-600 dark:text-slate-300' };
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_projects', project.id), {
      columns: [...columns, newCol]
    });
    setEditingColId(newId);
    setEditColTitle('Nouvelle Colonne');
  };

  const saveColName = async (colId) => {
    if (!editColTitle.trim()) { setEditingColId(null); return; }
    const updatedColumns = columns.map(c => c.id === colId ? { ...c, title: editColTitle } : c);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_projects', project.id), { columns: updatedColumns });
    setEditingColId(null);
  };

  const deleteColumn = async (colId) => {
     if (tasks.some(t => t.status === colId)) {
        alert("La colonne doit être vide pour la supprimer.");
        return; 
     }
     const updatedColumns = columns.filter(c => c.id !== colId);
     await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_projects', project.id), { columns: updatedColumns });
  };

  const changeColColor = async (colId, palette) => {
    const updatedColumns = columns.map(c => c.id === colId ? { ...c, color: palette.color, borderColor: palette.borderColor, accentColor: palette.accentColor } : c);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_projects', project.id), { columns: updatedColumns });
    setShowColorPickerFor(null);
  };

  const handleDragStart = (e, id) => e.dataTransfer.setData("id", id);
  const handleDrop = (e, status) => {
    const id = e.dataTransfer.getData("id");
    if(id) moveTask(id, status);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
         <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg">
            <button onClick={() => setViewMode('kanban')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><LayoutGrid size={14}/> Kanban</button>
            <button onClick={() => setViewMode('calendar')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><CalendarIcon size={14}/> Calendrier</button>
         </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
          <div className="flex gap-6 h-full w-max px-2">
            {columns.map((col) => (
              <div 
                key={col.id} 
                className="w-80 shrink-0 flex flex-col bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-full max-h-[calc(100vh-12rem)]"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, col.id)}
              >
                <div className={`p-4 border-b ${col.borderColor} flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-2xl group`}>
                  {editingColId === col.id ? (
                    <input 
                      autoFocus
                      type="text" 
                      value={editColTitle} 
                      onChange={e => setEditColTitle(e.target.value)} 
                      onBlur={() => saveColName(col.id)}
                      onKeyDown={e => e.key === 'Enter' && saveColName(col.id)}
                      className="font-bold text-sm outline-none border-b-2 border-indigo-400 w-full mr-2 bg-transparent dark:text-white" 
                    />
                  ) : (
                    <h3 
                    onClick={() => { setEditingColId(col.id); setEditColTitle(col.title); }} 
                    className={`font-bold ${col.accentColor} cursor-pointer hover:underline flex-1 truncate mr-2`}
                    title="Cliquez pour renommer"
                  >
                    {col.title}
                  </h3>
                )}
                <div className="flex items-center gap-1 relative">
                  <button onClick={() => setShowColorPickerFor(showColorPickerFor === col.id ? null : col.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-opacity p-1" title="Changer la couleur">
                    <Palette size={14} />
                  </button>
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full font-bold text-slate-600 dark:text-slate-300">{tasks.filter(t => t.status === col.id).length}</span>
                  {tasks.filter(t => t.status === col.id).length === 0 && (
                     <button onClick={() => deleteColumn(col.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-opacity p-1" title="Supprimer la colonne vide"><Trash2 size={14}/></button>
                  )}
                  
                  {showColorPickerFor === col.id && (
                    <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-2 z-10 flex gap-1.5 animate-in fade-in zoom-in-95">
                      {COLOR_PALETTES.map(pal => (
                        <button 
                          key={pal.id} 
                          onClick={() => changeColColor(col.id, pal)}
                          className={`w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 ${pal.color} hover:scale-110 transition-transform`}
                          title={pal.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {tasks.filter(t => t.status === col.id).map(task => (
                    <div 
                      key={task.id} 
                      draggable 
                      onDragStart={e => handleDragStart(e, task.id)}
                      onClick={() => setEditingTask(task)}
                      className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{task.text}</span>
                         {task.assignedTo && (
                           <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 shrink-0 ml-2" title={allUsers.find(u => u.id === task.assignedTo)?.displayName}>
                             {allUsers.find(u => u.id === task.assignedTo)?.displayName?.substring(0, 2).toUpperCase()}
                           </div>
                         )}
                      </div>
                      {task.deadline && <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1"><CalendarIcon size={10} /> {formatDate(task.deadline)}</div>}
                    </div>
                  ))}
                </div>
                <div className="p-3">
                  <button onClick={() => addTask(col.id)} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 font-bold text-xs hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"><Plus size={14}/> Ajouter</button>
                </div>
              </div>
            ))}
            <div className="w-80 shrink-0 flex flex-col h-full">
              <button 
                 onClick={handleAddColumn} 
                 className="h-16 flex items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all font-bold"
              >
                 <Plus size={18} /> Nouvelle colonne
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ProjectCalendarView tasks={tasks} columns={columns} onEdit={setEditingTask} allUsers={allUsers} />
      )}
      {editingTask && <ProjectTaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={updateTask} allUsers={allUsers} />}
    </div>
  );
}

// 10. ProjectsModule (Vue d'ensemble des projets)
function ProjectsModule({ currentUser, allUsers, isAdmin }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'team_projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const createProject = async () => {
    if (!newProjectTitle.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'team_projects'), {
      title: newProjectTitle,
      columns: DEFAULT_KANBAN_COLUMNS,
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
      members: allUsers.map(u => u.id)
    });
    setNewProjectTitle('');
    setIsCreating(false);
  };

  const deleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (window.confirm("Supprimer ce projet et toutes ses tâches ?")) {
       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_projects', projectId));
    }
  };

  const currentProject = projects.find(p => p.id === selectedProjectId);

  if (currentProject) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setSelectedProjectId(null)} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 text-sm font-bold"><ChevronLeft size={16} /> Retour aux projets</button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Briefcase size={20} className="text-indigo-600 dark:text-indigo-400"/> {currentProject.title}</h2>
        </div>
        <ProjectBoard project={currentProject} currentUser={currentUser} allUsers={allUsers} />
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Projets d'équipe</h2>
      </div>
      
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Créer un nouveau projet</h3>
            <input 
               autoFocus
               type="text" 
               value={newProjectTitle} 
               onChange={e => setNewProjectTitle(e.target.value)} 
               placeholder="Nom du projet (ex: Refonte Site Web)" 
               className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-6"
               onKeyDown={e => e.key === 'Enter' && createProject()}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">Annuler</button>
              <button onClick={createProject} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">Créer</button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 && !isCreating && (
        <div className="text-center p-16 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 mt-8 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <Briefcase size={40} className="text-indigo-300 dark:text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">Aucun projet en cours</h3>
          <p className="text-base mb-8 max-w-md mx-auto">Centralisez vos tâches et collaborez facilement avec votre équipe en créant votre premier projet Kanban.</p>
          {isAdmin ? (
            <button 
              onClick={() => setIsCreating(true)} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 mx-auto shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-105 hover:-translate-y-1"
            >
              <Plus size={28} /> Créer mon premier projet
            </button>
          ) : (
            <p className="text-sm bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 p-3 rounded-lg border border-amber-200 dark:border-amber-800 inline-block">Seul un administrateur peut créer un projet.</p>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isAdmin && (
             <div 
               onClick={() => setIsCreating(true)} 
               className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer transition-all min-h-[160px] group shadow-sm hover:shadow-md"
             >
               <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-700">
                 <Plus size={32} className="text-current" />
               </div>
               <span className="font-bold text-base">Nouveau Projet</span>
             </div>
          )}
          
          {projects.map(p => (
            <div key={p.id} onClick={() => setSelectedProjectId(p.id)} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all group relative min-h-[160px] flex flex-col">
               <div className="flex items-center justify-between mb-4">
                 <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl"><Briefcase size={24} className="text-indigo-600 dark:text-indigo-400" /></div>
                 {isAdmin && <button onClick={(e) => deleteProject(p.id, e)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 p-2"><Trash2 size={16} /></button>}
               </div>
               <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1 flex-1">{p.title}</h3>
               <p className="text-xs text-slate-500 dark:text-slate-500 mt-auto">Créé le {p.createdAt ? formatDate(p.createdAt.toDate()) : 'Récemment'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 11. DataManager
function DataManager({ currentUser, viewedUserId, currentView, allUsers }) {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    if (!viewedUserId) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'team_tasks'), where('targetUserId', '==', viewedUserId));
    const unsubscribe = onSnapshot(q, (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, [viewedUserId]);

  const handleSaveTask = async (taskId, data) => {
    if (taskId === 'new') await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'team_tasks'), { ...data, targetUserId: viewedUserId, createdBy: currentUser.uid, createdAt: serverTimestamp() });
    else await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', taskId), data);
    setEditingTask(null);
  };
  
  const moveTask = async (id, q) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', id), { quadrant: q });
  const deleteTask = async (id) => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', id));
  const toggleTask = async (t, e) => { e.stopPropagation(); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', t.id), { isCompleted: !t.isCompleted }); };

  return (
    <>
      {currentView === 'matrix' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(QUADRANTS).map(q => (
            <Quadrant key={q.id} config={q} tasks={tasks.filter(t => t.quadrant === q.id)} onAdd={() => setEditingTask({ id: 'new', quadrant: q.id })} onDelete={deleteTask} onToggle={toggleTask} onEdit={setEditingTask} onMoveTask={moveTask} />
          ))}
        </div>
      ) : (
        <CalendarView tasks={tasks} onToggle={toggleTask} onEdit={setEditingTask} />
      )}
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={handleSaveTask} allUsers={allUsers} />}
    </>
  );
}

// 12. MainApp
function MainApp() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [viewedUserId, setViewedUserId] = useState(null);
  const [currentView, setCurrentView] = useState('matrix'); 
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  
  const isAdmin = isUserAdmin(user);

  useEffect(() => { const script = document.createElement('script'); script.src = "https://cdn.tailwindcss.com"; document.head.appendChild(script); }, []);
  useEffect(() => { 
    const unsubscribe = onAuthStateChanged(auth, async u => { 
      if (u) {
        let isAllowed = u.isAnonymous || (u.email && u.email.toLowerCase().endsWith('@iziwup.com'));
        if (!isAllowed) {
          const userDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_users', u.uid));
          if (userDoc.exists()) isAllowed = true;
        }
        if (!isAllowed) {
          await signOut(auth);
          setAuthError("Accès refusé. Seules les adresses @iziwup.com sont autorisées.");
          setUser(null);
          setLoading(false);
          return;
        }
        setAuthError('');
        setUser(u); 
        setViewedUserId(u.uid); 
      } else {
        setUser(null);
      }
      setLoading(false); 
    }); 
    return () => unsubscribe(); 
  }, []);
  useEffect(() => { if (user) { const unsubscribe = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'team_users', user.uid), s => setMyProfile(s.exists() ? s.data() : null)); return () => unsubscribe(); } }, [user]);
  useEffect(() => { if (user) { const unsubscribe = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'team_users'), s => setAllUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))); return () => unsubscribe(); } }, [user]);

  const handleJoinTeam = async (name, uid, email) => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_users', uid), { 
      displayName: name, 
      email: email || '', 
      lastActive: serverTimestamp() 
    }, { merge: true });
    setViewedUserId(uid);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMyProfile(null);
    setUser(null);
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-400 font-sans text-sm animate-pulse dark:bg-slate-950">Chargement Izitask...</div>;
  if (!user || !myProfile) return <LoginScreen onJoin={handleJoinTeam} auth={auth} user={user} externalError={authError} />;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col antialiased selection:bg-indigo-100 dark:selection:bg-indigo-900">
      <style>{`
        .rich-text ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 0.5em; }
        .rich-text ol { list-style-type: decimal; margin-left: 1.5em; margin-bottom: 0.5em; }
        .rich-text h1 { font-size: 1.5em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
        .rich-text h2 { font-size: 1.25em; font-weight: bold; margin-top: 0.5em; margin-bottom: 0.5em; }
        .rich-text p { margin-bottom: 0.5em; }
        .rich-text b, .rich-text strong { font-weight: bold; }
        .rich-text i, .rich-text em { font-style: italic; }
        .rich-text u { text-decoration: underline; }
        .rich-text a { color: #4f46e5; text-decoration: underline; }
        .rich-text blockquote { border-left: 4px solid #e2e8f0; padding-left: 1em; color: #64748b; font-style: italic; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #64748b; }
          .rich-text a { color: #818cf8; }
          .rich-text blockquote { border-left-color: #475569; color: #94a3b8; }
        }
      `}</style>

      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm shadow-indigo-200"><Zap className="text-white w-4 h-4 fill-current" /></div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Izitask</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
              <button onClick={() => setCurrentView('matrix')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${currentView === 'matrix' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><LayoutGrid size={14}/> Matrice</button>
              <button onClick={() => setCurrentView('calendar')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${currentView === 'calendar' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><CalendarIcon size={14}/> Calendrier</button>
              <button onClick={() => setCurrentView('minutes')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${currentView === 'minutes' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><BookOpen size={14}/> C.R.</button>
              <button onClick={() => setCurrentView('projects')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${currentView === 'projects' ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><Briefcase size={14}/> Projets</button>
            </div>
            {currentView !== 'projects' && (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                   <div className="relative group">
                     <select value={viewedUserId || ''} onChange={e => setViewedUserId(e.target.value)} className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer focus:outline-none transition-colors">
                       <option value={user.uid} className="dark:bg-slate-900">Mon Espace</option>
                       {allUsers.filter(u => u.id !== user.uid).map(u => (
                         <option key={u.id} value={u.id} className="dark:bg-slate-900">
                           {u.displayName} {u.email ? `(${u.email})` : ''}
                         </option>
                       ))}
                     </select>
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500 rotate-90" /></div>
                   </div>
                ) : <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Mon Espace</span>}
                <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-[10px] border border-indigo-100 dark:border-indigo-800">{myProfile.displayName.substring(0, 2).toUpperCase()}</div>
              </div>
            )}
            <button onClick={handleLogout} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Déconnexion"><LogOut size={16}/></button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-full md:max-w-7xl mx-auto p-4 md:p-6 w-full">
        {currentView === 'projects' ? <ProjectsModule currentUser={user} allUsers={allUsers} isAdmin={isAdmin} /> : 
         currentView === 'minutes' ? <MeetingMinutesView currentUser={user} userProfile={myProfile} isAdmin={isAdmin} /> : 
         <DataManager currentUser={user} viewedUserId={viewedUserId} currentView={currentView} allUsers={allUsers} />
        }
      </main>
    </div>
  );
}

export default function App() {
  return (
    <MainApp />
  );
}