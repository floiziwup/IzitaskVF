import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, CheckCircle2, AlertCircle, Clock, ArrowRightCircle, XCircle, LayoutGrid, Zap, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, CalendarDays, LogOut, UserCircle, FileText, 
  Link as LinkIcon, X, Save, MoreHorizontal, Edit2, GripVertical, CalendarPlus, BookOpen, Search, 
  TestTube, Lock, Building2, Bold, Italic, Underline, List, ListOrdered, Check, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, AlertTriangle, Send
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

// --- Constantes & Types ---
const QUADRANTS = {
  Q1: { id: 'Q1', title: 'À FAIRE', subtitle: 'Urgent & Important', color: 'bg-red-50/50', headerColor: 'bg-white', accentColor: 'text-red-600', borderColor: 'border-red-200', taskBg: 'bg-red-50 hover:bg-red-100 border-red-100', icon: AlertCircle, desc: 'Crises, deadlines immédiates' },
  Q2: { id: 'Q2', title: 'PLANIFIER', subtitle: 'Important, Pas Urgent', color: 'bg-blue-50/50', headerColor: 'bg-white', accentColor: 'text-blue-600', borderColor: 'border-blue-200', taskBg: 'bg-blue-50 hover:bg-blue-100 border-blue-100', icon: Clock, desc: 'Stratégie, prévention' },
  Q3: { id: 'Q3', title: 'DÉLÉGUER', subtitle: 'Urgent, Pas Important', color: 'bg-amber-50/50', headerColor: 'bg-white', accentColor: 'text-amber-600', borderColor: 'border-amber-200', taskBg: 'bg-amber-50 hover:bg-amber-100 border-amber-100', icon: ArrowRightCircle, desc: 'Interruptions, réunions' },
  Q4: { id: 'Q4', title: 'ÉLIMINER', subtitle: 'Ni Urgent, Ni Important', color: 'bg-slate-50/50', headerColor: 'bg-white', accentColor: 'text-slate-500', borderColor: 'border-slate-200', taskBg: 'bg-slate-50 hover:bg-slate-100 border-slate-200', icon: Trash2, desc: 'Distractions' }
};

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
    <div className="flex gap-1 p-1.5 bg-slate-50 border-b border-slate-200 flex-wrap">
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="p-1 text-slate-600 hover:bg-white hover:text-indigo-600 rounded transition-colors" title="Gras"><Bold size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className="p-1 text-slate-600 hover:bg-white hover:text-indigo-600 rounded transition-colors" title="Italique"><Italic size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} className="p-1 text-slate-600 hover:bg-white hover:text-indigo-600 rounded transition-colors" title="Souligné"><Underline size={14} /></button>
      <div className="w-px bg-slate-300 mx-1 h-3 self-center"></div>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} className="p-1 text-slate-600 hover:bg-white hover:text-indigo-600 rounded transition-colors" title="Gauche"><AlignLeft size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} className="p-1 text-slate-600 hover:bg-white hover:text-indigo-600 rounded transition-colors" title="Centrer"><AlignCenter size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} className="p-1 text-slate-600 hover:bg-white hover:text-indigo-600 rounded transition-colors" title="Droite"><AlignRight size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('justifyFull'); }} className="p-1 text-slate-600 hover:bg-white hover:text-indigo-600 rounded transition-colors" title="Justifier"><AlignJustify size={14} /></button>
      <div className="w-px bg-slate-300 mx-1 h-3 self-center"></div>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="p-1 text-slate-600 hover:bg-white hover:text-indigo-600 rounded transition-colors" title="Puces"><List size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} className="p-1 text-slate-600 hover:bg-white hover:text-indigo-600 rounded transition-colors" title="Numéros"><ListOrdered size={14} /></button>
    </div>
  );
}

// 2. Écran de Connexion
function LoginScreen({ onJoin, auth, user }) {
  const [error, setError] = useState('');
  const [showTestLogin, setShowTestLogin] = useState(false);

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
      await onJoin("Florent (Test)", result.user.uid);
    } catch (err) {
      setError("Erreur connexion test.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 font-sans selection:bg-indigo-100">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200"><Zap className="w-8 h-8 text-white fill-current" /></div></div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Bienvenue sur Izitask</h1>
        <p className="text-center text-slate-500 mb-10 text-sm">L'outil de productivité de votre équipe.</p>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg text-center border border-red-100">{error}</div>}
        <div className="space-y-4">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-200 transition-all text-sm shadow-sm hover:shadow-md">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuer avec Google
          </button>
          {showTestLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink mx-4 text-slate-300 text-[10px] uppercase font-bold tracking-wider">Mode Secours</span><div className="flex-grow border-t border-slate-100"></div></div>
              <button onClick={handleTestLogin} className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium py-2 px-4 rounded-xl border border-slate-200 border-dashed transition-all text-xs"><TestTube size={14} /> Connexion Test (Aperçu)</button>
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
  const [delegateTo, setDelegateTo] = useState(''); // Pour la délégation
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
      // CORRECTION ICI : On passe task.quadrant pour ne pas le perdre lors de la création
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
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">{isNew ? "Nouvelle tâche" : "Détails de la tâche"}</h3>
          <div className="flex gap-2">
             {!isNew && (
                <button onClick={handleToggleComplete} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                  {isCompleted ? <Check size={14} /> : <div className="w-3.5 h-3.5 border-2 border-current rounded-full" />}
                  {isCompleted ? 'Terminée' : 'À faire'}
                </button>
             )}
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors"><X size={18} /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* SECTION DÉLÉGATION (Visible uniquement si Quadrant = Q3 Délégué et pas nouvelle tâche) */}
          {task.quadrant === 'Q3' && !isNew && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                <ArrowRightCircle size={14} /> Déléguer cette tâche à :
              </label>
              <div className="flex gap-2">
                <select 
                  value={delegateTo}
                  onChange={(e) => setDelegateTo(e.target.value)}
                  className="flex-1 text-sm border-amber-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-amber-200 bg-white"
                >
                  <option value="">-- Choisir un membre --</option>
                  {allUsers.filter(u => u.id !== task.targetUserId).map(u => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
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
              <p className="text-[10px] text-amber-600 mt-2 italic">
                * La tâche sera déplacée dans la colonne "À FAIRE" de cette personne.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Titre</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full text-lg font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Nom de la tâche..." autoFocus />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2"><FileText size={14} /> Description</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all bg-white">
                <EditorToolbar />
                <div
                  ref={editorRef}
                  className="rich-text w-full p-3 text-sm text-slate-700 outline-none min-h-[8rem] max-h-[16rem] overflow-y-auto resize-y"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setDesc(e.currentTarget.innerHTML)}
                  placeholder="Ajouter des détails..."
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2"><CalendarIcon size={14} /> Échéance</label>
            <div className="flex gap-2">
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="text-sm p-2 border border-slate-200 bg-white rounded-lg outline-none focus:border-indigo-500 text-slate-600 w-full sm:w-auto" />
              {deadline && !isNew && <button onClick={handleAddToCalendar} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"><CalendarPlus size={14} /> RDV 9h</button>}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2"><LinkIcon size={14} /> Documents & Liens</label>
            {links.length > 0 && (
              <div className="space-y-2 mb-3">
                {links.map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 group">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 font-medium hover:underline truncate flex-1">{link.name}</a>
                    <button onClick={() => removeLink(idx)} className="text-indigo-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-2"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <input type="text" placeholder="Nom du fichier..." value={newLinkName} onChange={e => setNewLinkName(e.target.value)} className="bg-white text-xs p-2 rounded border border-slate-200 outline-none flex-1" />
              <input type="url" placeholder="https://..." value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} className="bg-white text-xs p-2 rounded border border-slate-200 outline-none flex-[2]" />
              <button onClick={handleAddLink} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition-colors text-xs font-bold">Ajouter</button>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">Annuler</button>
          <button onClick={handleSubmit} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all flex items-center gap-2"><Save size={16} /> Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// 4. Quadrant (Matrice)
function Quadrant({ config, tasks, onAdd, onDelete, onToggle, onEdit, onMoveTask }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const Icon = config.icon;
  const dragGhostRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const draggingTaskId = useRef(null);

  // Ce bouton remplace le formulaire du bas
  const handleInitiateAdd = () => {
    onAdd(config.id); // On demande à DataManager d'ouvrir la modale pour ce quadrant
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

  // TOUCH (Mobile Drag & Drop)
  const handleTouchStart = (e, task) => {
    document.body.style.overflow = 'hidden'; 
    const touch = e.touches[0];
    dragStartPos.current = { x: touch.clientX, y: touch.clientY };
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
    ghost.style.border = '2px solid #6366f1';
    ghost.style.transform = 'translate(-50%, -50%)';
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
      draggingTaskId.current = null;
    }
  };

  return (
    <div 
      className={`flex flex-col rounded-2xl border transition-all duration-300 bg-white min-h-[500px] h-auto shadow-sm hover:shadow-md ${isDragOver ? 'ring-2 ring-indigo-400 bg-indigo-50/10' : config.borderColor}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-quadrant-id={config.id}
    >
      <div className={`px-5 py-4 border-b border-slate-50 flex justify-between items-center ${config.headerColor}`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-md ${config.color.replace('/50', '')}`}><Icon size={16} className={config.accentColor} /></div>
          <div><h3 className={`text-sm font-bold ${config.accentColor} tracking-wide uppercase`}>{config.title}</h3></div>
        </div>
        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color} ${config.accentColor}`}>{tasks.length}</div>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {tasks.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-slate-300 gap-2 pointer-events-none">
            <div className="p-3 bg-slate-50 rounded-full"><Icon size={24} className="opacity-20" /></div>
            <p className="text-xs font-medium">{config.desc}</p>
          </div>
        )}
        
        {tasks.map(task => (
          <div 
            key={task.id} 
            draggable="true" 
            onDragStart={(e) => handleDragStart(e, task.id)}
            onClick={() => onEdit(task)}
            className={`group relative flex items-start gap-3 p-3 rounded-xl border transition-all ${task.isCompleted ? 'bg-slate-50 opacity-50 border-transparent' : `${config.taskBg} shadow-sm hover:shadow-md border`} active:cursor-grabbing`}
          >
            <div className="mt-1 text-slate-300 cursor-grab touch-none active:text-indigo-500" onTouchStart={(e) => handleTouchStart(e, task)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
              <GripVertical size={16} />
            </div>
            <button onClick={(e) => onToggle(task, e)} className={`mt-0.5 shrink-0 transition-colors ${task.isCompleted ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500'}`}>
              {task.isCompleted ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-current" />}
            </button>
            <div className="flex-1 min-w-0">
              <span className={`block text-sm leading-tight ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>{task.text}</span>
              <div className="flex items-center gap-3 mt-1.5">
                {task.deadline && <div className={`flex items-center gap-1 text-[10px] font-medium ${new Date(task.deadline) < new Date() && !task.isCompleted ? 'text-red-500' : 'text-slate-500'}`}><CalendarIcon size={10} />{formatDate(task.deadline)}</div>}
                {task.attachments?.length > 0 && <div className="flex items-center gap-1 text-[10px] font-medium text-indigo-500"><LinkIcon size={10} />{task.attachments.length} doc{task.attachments.length > 1 ? 's' : ''}</div>}
                {task.description && <FileText size={10} className="text-slate-400" />}
              </div>
            </div>
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
               <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><Edit2 size={12} /></button>
               <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"><X size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* BOUTON AJOUTER MODIFIÉ */}
      <div className="p-3 border-t border-slate-50 bg-white">
        <button 
          onClick={handleInitiateAdd}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-sm font-bold"
        >
          <Plus size={18} /> Ajouter une tâche
        </button>
      </div>
    </div>
  );
}

// 5. CalendarView
function CalendarView({ tasks, onToggle, onEdit }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  // FILTRE : On ne garde que Q1 (À FAIRE) et Q2 (PLANIFIER)
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
                    <div 
                      key={task.id} 
                      onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                      className={`text-[10px] px-2 py-1 rounded-md border truncate cursor-pointer transition-opacity flex items-center gap-1 ${qConfig.color} border-${qConfig.borderColor} ${task.isCompleted ? 'opacity-40 line-through' : 'opacity-100 hover:opacity-80'}`} 
                      title={task.text}
                    >
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

// 6. MeetingMinutesView
function MeetingMinutesView({ currentUser, userProfile }) {
  const [currentFolder, setCurrentFolder] = useState('team'); 
  const [minutes, setMinutes] = useState([]);
  const [selectedMinute, setSelectedMinute] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 
  const editorRef = useRef(null);

  const isFlorent = (currentUser?.email?.toLowerCase() === 'florent.lahilla@iziwup.com') || (userProfile?.displayName === 'Florent (Test)');
  const canCreate = currentFolder === 'team' ? isFlorent : true;
  const canModify = currentFolder === 'personal' ? true : (isFlorent || (selectedMinute && selectedMinute.createdBy === currentUser.uid));

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
    }, (err) => console.error("Erreur minutes", err));
    return () => unsubscribe();
  }, [currentFolder, currentUser.uid]);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.innerHTML = editContent;
    }
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

  const handleSelect = (minute) => {
    setSelectedMinute(minute);
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (!selectedMinute || !canModify) return;
    setEditDate(selectedMinute.date);
    setEditTitle(selectedMinute.title);
    setEditContent(selectedMinute.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editDate || !editTitle) return;
    const contentToSave = editorRef.current ? editorRef.current.innerHTML : editContent;
    try {
      let minutesRef;
      if (currentFolder === 'team') {
        minutesRef = collection(db, 'artifacts', appId, 'public', 'data', 'team_minutes');
      } else {
        minutesRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'personal_minutes');
      }
      const data = {
        date: editDate,
        title: editTitle,
        content: contentToSave,
        lastModifiedBy: currentUser.uid,
        lastModifiedAt: serverTimestamp()
      };
      if (selectedMinute.id === 'new') {
        const docRef = await addDoc(minutesRef, { ...data, createdBy: currentUser.uid, createdAt: serverTimestamp() });
        setIsEditing(false);
        setSelectedMinute({ id: docRef.id, ...data, createdBy: currentUser.uid }); 
      } else {
        let docPath;
        if (currentFolder === 'team') docPath = doc(db, 'artifacts', appId, 'public', 'data', 'team_minutes', selectedMinute.id);
        else docPath = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'personal_minutes', selectedMinute.id);
        await updateDoc(docPath, data);
        setIsEditing(false);
      }
    } catch (e) { console.error("Erreur sauvegarde", e); }
  };

  const confirmDelete = async () => {
     if (!selectedMinute) return;
     try {
        let docPath;
        if (currentFolder === 'team') {
           docPath = doc(db, 'artifacts', appId, 'public', 'data', 'team_minutes', selectedMinute.id);
        } else {
           docPath = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'personal_minutes', selectedMinute.id);
        }
        await deleteDoc(docPath);
        setSelectedMinute(null);
        setIsEditing(false);
        setShowDeleteConfirm(false);
      } catch (e) {
        console.error("Erreur suppression:", e);
        alert("Erreur lors de la suppression.");
      }
  }

  const handleDeleteClick = () => {
    if (!selectedMinute) return;
    if (selectedMinute.id === 'new') {
      setIsEditing(false);
      setSelectedMinute(null);
      return;
    }
    setShowDeleteConfirm(true);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)] relative">
      {/* Modale de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm rounded-2xl">
           <div className="bg-white p-6 rounded-xl shadow-xl border border-red-100 max-w-xs w-full animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center gap-3 text-center">
                 <div className="bg-red-100 p-3 rounded-full text-red-500">
                    <AlertTriangle size={24} />
                 </div>
                 <h3 className="font-bold text-slate-800">Supprimer la note ?</h3>
                 <p className="text-xs text-slate-500 mb-2">Cette action est irréversible.</p>
                 <div className="flex gap-2 w-full">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">Annuler</button>
                    <button onClick={confirmDelete} className="flex-1 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg text-sm font-bold transition-colors">Supprimer</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="w-full md:w-1/3 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600" /> Carnets</h3>
            {(canCreate || currentFolder === 'personal') && <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors shadow-sm"><Plus size={16} /></button>}
          </div>
          <div className="flex p-1 bg-slate-200/50 rounded-lg">
            <button onClick={() => setCurrentFolder('team')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${currentFolder === 'team' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Building2 size={12} /> IZIWUP</button>
            <button onClick={() => setCurrentFolder('personal')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-bold rounded-md transition-all ${currentFolder === 'personal' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Lock size={12} /> Mes Notes</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {minutes.length === 0 && <div className="text-center p-8 text-slate-400 text-sm italic">{currentFolder === 'team' ? "Aucun compte rendu officiel." : "Votre dossier personnel est vide."}</div>}
          {minutes.map(m => (
            <div key={m.id} onClick={() => handleSelect(m)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedMinute?.id === m.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm text-slate-800 truncate flex-1 pr-2">{m.title}</span>
                <span className="text-[10px] bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 text-slate-500 whitespace-nowrap">{formatDate(m.date)}</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{stripHtml(m.content) || "Nouvelle note..."}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm relative">
        {!selectedMinute ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            {currentFolder === 'team' ? <Building2 size={48} className="mb-4 opacity-20" /> : <Lock size={48} className="mb-4 opacity-20" />}
            <p className="text-sm font-medium">{currentFolder === 'team' ? "Dossier Public IZIWUP" : "Dossier Personnel"}</p>
            <p className="text-xs mt-1">Sélectionnez ou créez un document.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50">
              <div className="flex justify-between items-center">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full">
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:border-indigo-500" />
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Titre..." className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1 text-sm font-semibold outline-none focus:border-indigo-500" />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{selectedMinute.title}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><CalendarIcon size={12} /> {formatDate(selectedMinute.date)}{currentFolder === 'personal' && <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold flex items-center gap-1"><Lock size={8} /> Privé</span>}</p>
                  </div>
                )}
                <div className="flex gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button onClick={() => setIsEditing(false)} className="p-2 text-slate-500 hover:bg-white rounded-lg transition-colors"><X size={18} /></button>
                      <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"><Save size={16} /> Enregistrer</button>
                    </>
                  ) : (
                    canModify && (
                      <>
                        {/* BOUTON SUPPRIMER : ROUGE ET EXPLICITE */}
                        <button 
                            onClick={handleDeleteClick} 
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition-colors border border-red-200"
                        >
                          <Trash2 size={16} /> Supprimer
                        </button>
                        <button onClick={handleEdit} className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"><Edit2 size={16} /> Modifier</button>
                      </>
                    )
                  )}
                </div>
              </div>
              
              {isEditing && <EditorToolbar />}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white relative">
              {isEditing ? (
                <div
                  ref={editorRef}
                  className="rich-text w-full h-full outline-none text-slate-700 text-sm leading-relaxed overflow-y-auto cursor-text placeholder-div"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Écrivez ici..."
                />
              ) : (
                <div className="rich-text prose prose-sm max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedMinute.content || '<span class="text-slate-300 italic">Aucun contenu.</span>' }} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 7. DataManager
function DataManager({ currentUser, viewedUserId, currentView, allUsers }) {
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

  const handleInitiateTask = (quadrantId) => {
    setEditingTask({
      id: 'new',
      quadrant: quadrantId,
      text: '',
      description: '',
      deadline: '',
      attachments: [],
      isCompleted: false,
      targetUserId: viewedUserId
    });
  };

  const handleSaveTask = async (taskId, taskData) => {
    if (taskId === 'new') {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'team_tasks'), {
            ...taskData,
            targetUserId: viewedUserId,
            createdBy: currentUser.uid,
            createdAt: serverTimestamp()
        });
    } else {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', taskId), taskData);
    }
    setEditingTask(null);
  };

  const moveTask = async (taskId, newQuadrantId) => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', taskId), { quadrant: newQuadrantId }); } catch (e) { console.error(e); }
  };

  const deleteTask = async (taskId) => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', taskId)); } catch (e) { console.error(e); }
  };

  const toggleTask = async (task, e) => {
    e.stopPropagation();
    try { 
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'team_tasks', task.id), {
        isCompleted: !task.isCompleted
      }); 
    } catch (e) { console.error(e); }
  };

  return (
    <>
      {currentView === 'matrix' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(QUADRANTS).map(q => (
            <Quadrant 
              key={q.id} 
              config={q} 
              tasks={tasks.filter(t => t.quadrant === q.id)} 
              onAdd={handleInitiateTask} 
              onDelete={deleteTask} 
              onToggle={toggleTask} 
              onEdit={setEditingTask}
              onMoveTask={moveTask}
            />
          ))}
        </div>
      ) : (
        <CalendarView tasks={tasks} onToggle={toggleTask} onEdit={setEditingTask} />
      )}
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={handleSaveTask} allUsers={allUsers} />}
    </>
  );
}

// 8. Application Principale (Dernière)
export default function App() {
  return (
    <MainApp />
  );
}

function MainApp() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [viewedUserId, setViewedUserId] = useState(null);
  const [currentView, setCurrentView] = useState('matrix'); 
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setViewedUserId(u.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setMyProfile(null); return; }
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'team_users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) setMyProfile(snap.data());
    });
    return () => unsubscribe();
  }, [user]);

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

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900">
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
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1; /* slate-300 */
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8; /* slate-400 */
        }
      `}</style>

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3 border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm shadow-indigo-200">
              <Zap className="text-white w-4 h-4 fill-current" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Izitask</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-end">
            <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-100">
              <button onClick={() => setCurrentView('matrix')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${currentView === 'matrix' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid size={14} /> Matrice</button>
              <button onClick={() => setCurrentView('calendar')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${currentView === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}><CalendarIcon size={14} /> Calendrier</button>
              <button onClick={() => setCurrentView('minutes')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${currentView === 'minutes' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}><BookOpen size={14} /> C.R.</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <select value={viewedUserId || ''} onChange={(e) => setViewedUserId(e.target.value)} className="appearance-none bg-transparent pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer focus:outline-none transition-colors">
                  <option value={user.uid}>Mon Espace</option>
                  {allUsers.filter(u => u.id !== user.uid).map(u => (
                    <option key={u.id} value={u.id}>Espace de {u.displayName}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight className="w-3 h-3 text-slate-400 rotate-90" /></div>
              </div>
              <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] border border-indigo-100">{myProfile.displayName.substring(0, 2).toUpperCase()}</div>
              <button onClick={handleLogout} className="text-slate-300 hover:text-red-500 transition-colors" title="Déconnexion"><LogOut size={16} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-full md:max-w-7xl mx-auto p-4 md:p-6 w-full">
        {currentView === 'minutes' ? (
          <MeetingMinutesView currentUser={user} userProfile={myProfile} />
        ) : (
          <DataManager currentUser={user} viewedUserId={viewedUserId} currentView={currentView} allUsers={allUsers} />
        )}
      </main>
    </div>
  );
}