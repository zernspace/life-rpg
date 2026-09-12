'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signUp, login, signOut } from '@/app/actions/auth';
import { createTask, updateTask, deleteTask, completeTask, buyShopItem, updateGenre } from '@/app/actions/rpg';
import { getRequiredXp } from '@/lib/rpg-utils';
import { Profile, Task, ShopItem, AttributeType, DifficultyType } from '@/types/game';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Zap, Flame, Plus, Trash2, Edit3, 
  CheckCircle2, ShoppingBag, LogOut, Terminal, Sparkles, X, Check, Activity,
  Sun, Moon, Hexagon, Cpu, Calendar, Clock, Play, Pause, RotateCcw, User, Anchor, Heart,
  ArrowLeft, Loader2, Target
} from 'lucide-react';

const GENRES: Record<string, any> = {
  cyberpunk: {
    id: 'cyberpunk', name: 'Cyberpunk', currency: 'Credits', currencyName: 'Credits', icon: Hexagon,
    ranks: ['Novice', 'Adept', 'Specialist', 'Veteran', 'Master', 'Apex'],
    stats: { Strength: 'STRENGTH', Intellect: 'INTELLECT', Endurance: 'ENDURANCE', Vitality: 'VITALITY' },
    dark: { bg: 'from-cyan-950/40 via-blue-950/20 to-slate-950', accent: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]', bar: 'from-cyan-500 to-blue-500' },
    light: { bg: 'from-cyan-100/50 via-blue-50/50 to-slate-50', accent: 'text-cyan-600', border: 'border-cyan-400/50', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]', bar: 'from-cyan-400 to-blue-500' }
  },
  fantasy: {
    id: 'fantasy', name: 'Fantasy RPG', currency: 'Gold Pieces', currencyName: 'Gold Pieces', icon: Shield,
    ranks: ['Villager', 'Adventurer', 'Hero', 'Champion', 'Legend', 'Demigod'],
    stats: { Strength: 'MIGHT', Intellect: 'WISDOM', Endurance: 'STAMINA', Vitality: 'VIGOR' },
    dark: { bg: 'from-amber-950/40 via-orange-950/20 to-slate-950', accent: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]', bar: 'from-amber-500 to-orange-500' },
    light: { bg: 'from-amber-100/50 via-orange-50/50 to-slate-50', accent: 'text-amber-600', border: 'border-amber-400/50', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]', bar: 'from-amber-400 to-orange-500' }
  },
  pirate: {
    id: 'pirate', name: 'High Seas Pirate', currency: 'Doubloons', currencyName: 'Doubloons', icon: Anchor,
    ranks: ['Swab', 'Deckhand', 'Boatswain', 'Quartermaster', 'Captain', 'Pirate King'],
    stats: { Strength: 'BRAWN', Intellect: 'CUNNING', Endurance: 'SEA LEGS', Vitality: 'GRIT' },
    dark: { bg: 'from-red-950/40 via-rose-950/20 to-slate-950', accent: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-[0_0_15px_rgba(248,113,113,0.2)]', bar: 'from-red-500 to-rose-500' },
    light: { bg: 'from-red-100/50 via-rose-50/50 to-slate-50', accent: 'text-red-600', border: 'border-red-400/50', glow: 'shadow-[0_0_15px_rgba(248,113,113,0.2)]', bar: 'from-red-400 to-rose-500' }
  },
  casual: {
    id: 'casual', name: 'Cozy Minimal', currency: 'Points', currencyName: 'Points', icon: Heart,
    ranks: ['Beginner', 'Learner', 'Achiever', 'Professional', 'Expert', 'Master'],
    stats: { Strength: 'FITNESS', Intellect: 'MIND', Endurance: 'FOCUS', Vitality: 'WELLNESS' },
    dark: { bg: 'from-emerald-950/40 via-green-950/20 to-slate-950', accent: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]', bar: 'from-emerald-500 to-green-500' },
    light: { bg: 'from-emerald-100/50 via-green-50/50 to-slate-50', accent: 'text-emerald-600', border: 'border-emerald-400/50', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]', bar: 'from-emerald-400 to-green-500' }
  }
};

export default function LifeRPGApp() {
  const supabase = useMemo(() => createClient(), []);
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Form State
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'quests' | 'shop'>('quests');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Focus Timer State
  const [timerTask, setTimerTask] = useState<Task | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [initialDuration, setInitialDuration] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedFocusTime, setElapsedFocusTime] = useState(0);

  const activeGenre = GENRES[profile?.genre || 'cyberpunk'] || GENRES['cyberpunk'];
  const currentStyle = isDarkMode ? activeGenre.dark : activeGenre.light;
  const GenreIcon = activeGenre.icon;

  const showFeedback = (msg: string) => { setFeedbackMessage(msg); setTimeout(() => setFeedbackMessage(null), 3500); };

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const [{ data: prof }, { data: tList }, { data: items }, { data: inv }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('shop_items').select('*'),
          supabase.from('inventory').select('item_id').eq('user_id', user.id)
        ]);
        setProfile(prof); setTasks(tList || []); setShopItems(items || []); setOwnedItemIds((inv || []).map((i: any) => i.item_id));
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => { setTimerSeconds(s => s - 1); setElapsedFocusTime(e => e + 1); }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (timerTask) {
        handleComplete(timerTask.id, elapsedFocusTime);
        showFeedback(`Protocol Cleared! +${timerTask.xp_reward} XP`);
        setTimerTask(null);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerTask, elapsedFocusTime]);

  const startTimerForTask = (task: Task, minutes: number) => {
    setTimerTask(task); setInitialDuration(minutes * 60); setTimerSeconds(minutes * 60); setElapsedFocusTime(0); setIsTimerRunning(true);
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const fd = new FormData(e.currentTarget);
      const res = authView === 'signup' ? await signUp(fd) : await login(fd);
      
      if (res?.error) {
        setAuthError(res.error);
        setIsSubmitting(false);
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => { 
    await signOut(); 
    window.location.reload();
  };

  const handleComplete = async (taskId: string, focusTime: number = 0) => {
    playChime(); confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    const res = await completeTask(taskId, focusTime);
    if (res?.error) showFeedback(res.error);
    await loadData();
  };

  const handleBuy = async (itemId: string) => {
    const res = await buyShopItem(itemId);
    if (res?.error) { showFeedback(res.error); } 
    else { playChime(); confetti({ particleCount: 60, spread: 60 }); showFeedback('Acquired and synchronized!'); }
    await loadData();
  };

  const getRank = (lvl: number) => {
    const idx = lvl < 5 ? 0 : lvl < 10 ? 1 : lvl < 20 ? 2 : lvl < 30 ? 3 : lvl < 50 ? 4 : 5;
    return activeGenre.ranks[idx];
  };

  const formatHours = (seconds: number) => `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  const formatTimer = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  const bgBase = isDarkMode ? 'bg-slate-950' : 'bg-slate-50';
  const gridPattern = isDarkMode ? 'bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]' : 'bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:24px_24px]';
  const cardBg = isDarkMode ? 'bg-slate-800/40' : 'bg-white/70';
  const cardBorder = isDarkMode ? 'border-slate-700/50' : 'border-slate-300/60';
  const textMain = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDarkMode ? 'bg-slate-900/50' : 'bg-white/80';
  const btnInvert = isDarkMode ? 'bg-slate-100 text-slate-900 hover:bg-white' : 'bg-slate-900 text-slate-100 hover:bg-slate-800';
  
  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVars = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

  const reqXp = profile ? getRequiredXp(profile.level) : 100;
  const xpPercent = profile ? Math.min(100, Math.round((profile.current_xp / reqXp) * 100)) : 0;
  const filteredTasks = selectedCategory === 'All' ? tasks : tasks.filter(t => t.category === selectedCategory);
  
  const currentMonthDays = useMemo(() => {
    const d = new Date(); const y = d.getFullYear(); const m = d.getMonth();
    return Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => new Date(y, m, i + 1).toISOString().split('T')[0]);
  }, []);
  const completedDates = useMemo(() => new Set(tasks.filter(t => t.completed && t.completed_at).map(t => t.completed_at!.split('T')[0])), [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex items-center gap-3">
          <Activity className="w-6 h-6 animate-spin" /> INITIALIZING NEURAL LINK...
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // UNAUTHENTICATED: LANDING PAGE & AUTH FORMS
  // ==========================================
  if (!user || !profile) {
    if (authView === 'landing') {
      return (
        <div className={`min-h-screen ${bgBase} ${gridPattern} flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors`}>
          <div className={`absolute top-[-20%] left-[-10%] w-[600px] h-[600px] ${isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-400/20'} rounded-full blur-[120px] pointer-events-none`} />
          <div className={`absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/20'} rounded-full blur-[120px] pointer-events-none`} />
          
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="max-w-4xl w-full text-center z-10 space-y-8 mt-10">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative flex items-center justify-center w-16 h-16">
                <Hexagon className="absolute w-16 h-16 text-cyan-500 opacity-20" />
                <Hexagon className="absolute w-16 h-16 text-cyan-500 animate-[spin_10s_linear_infinite] opacity-60" style={{ transform: 'rotate(30deg)' }}/>
                <Zap className="absolute w-8 h-8 text-cyan-500" />
              </div>
              <h1 className={`text-5xl md:text-7xl font-black tracking-widest uppercase font-mono ${textMain}`}>
                LIFE<span className="text-cyan-500">RPG</span>
              </h1>
            </div>
            
            <p className={`text-lg md:text-xl ${textMuted} font-medium max-w-2xl mx-auto leading-relaxed`}>
              Stop making to-do lists. Start completing Quests. <br className="hidden md:block"/> 
              Track habits, master your attribute matrix, and level up your real life across multiple universes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setAuthView('signup')} className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-cyan-500/20">
                Create Account
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setAuthView('login')} className={`w-full sm:w-auto px-8 py-4 ${inputBg} border ${cardBorder} ${textMain} font-black rounded-xl uppercase tracking-widest shadow-lg`}>
                Sign In
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
              <div className={`p-6 ${cardBg} border ${cardBorder} rounded-3xl backdrop-blur-md`}>
                <Cpu className="w-8 h-8 text-cyan-500 mb-4" />
                <h3 className={`font-black text-lg ${textMain} mb-2 uppercase tracking-wider`}>Dynamic Attributes</h3>
                <p className={`text-sm ${textMuted}`}>Turn real-world chores into permanent progression across custom stats tailored to your chosen universe.</p>
              </div>
              <div className={`p-6 ${cardBg} border ${cardBorder} rounded-3xl backdrop-blur-md`}>
                <Clock className="w-8 h-8 text-cyan-500 mb-4" />
                <h3 className={`font-black text-lg ${textMain} mb-2 uppercase tracking-wider`}>Focus Protocols</h3>
                <p className={`text-sm ${textMuted}`}>Lock in with built-in Pomodoro timers. Engage deep work sessions to earn multiplier XP and Credits.</p>
              </div>
              <div className={`p-6 ${cardBg} border ${cardBorder} rounded-3xl backdrop-blur-md`}>
                <Hexagon className="w-8 h-8 text-cyan-500 mb-4" />
                <h3 className={`font-black text-lg ${textMain} mb-2 uppercase tracking-wider`}>Multi-Genre Engine</h3>
                <p className={`text-sm ${textMuted}`}>Experience your journey as a Cyberpunk hacker, a Fantasy RPG hero, a High Seas Pirate, or through a Cozy Minimalist aesthetic.</p>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className={`min-h-screen ${bgBase} ${gridPattern} flex items-center justify-center p-4 relative overflow-hidden transition-colors`}>
        <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 ${isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-400/20'} rounded-full blur-[100px]`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/20'} rounded-full blur-[100px]`} />
        
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`max-w-md w-full ${cardBg} border ${cardBorder} rounded-3xl p-8 backdrop-blur-xl shadow-2xl z-10`}>
          <button onClick={() => { setAuthView('landing'); setAuthError(null); }} className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase ${textMuted} hover:${textMain} mb-6 transition-colors`}>
            <ArrowLeft className="w-4 h-4" /> Return to Main
          </button>
          
          <div className="flex items-center gap-3 justify-center mb-2">
            <Hexagon className={`w-8 h-8 text-cyan-500`} />
            <h1 className={`text-3xl font-black tracking-widest uppercase font-mono ${textMain}`}>LIFE<span className="text-cyan-500">RPG</span></h1>
          </div>
          <p className={`text-center ${textMuted} text-sm mb-8 font-medium`}>
            {authView === 'signup' ? 'Select your universe. Build your reality.' : 'Enter your credentials to synchronize.'}
          </p>

          <AnimatePresence>
            {authError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="p-3 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-bold">
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-4">
            {authView === 'signup' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold tracking-wider ${textMuted} mb-1.5 ml-1`}>OPERATIVE HANDLE</label>
                  <input name="username" required placeholder="Name" className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} text-sm focus:border-cyan-400 outline-none`} />
                </div>
                <div>
                  <label className={`block text-xs font-bold tracking-wider ${textMuted} mb-1.5 ml-1`}>CHOOSE YOUR UNIVERSE</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(GENRES).map((g) => (
                      <label key={g.id} className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${inputBg} hover:${cardBg} ${cardBorder}`}>
                        <input type="radio" name="genre" value={g.id} defaultChecked={g.id === 'cyberpunk'} className="sr-only peer" />
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent peer-checked:border-cyan-500 peer-checked:bg-cyan-500/10 peer-checked:shadow-[0_0_15px_rgba(6,182,212,0.4)] pointer-events-none transition-all" />
                        <g.icon className={`w-6 h-6 ${textMuted} peer-checked:text-cyan-500 relative z-10 transition-colors`} />
                        <span className={`text-[10px] font-bold ${textMuted} peer-checked:${textMain} relative z-10 transition-colors`}>{g.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div>
              <label className={`block text-xs font-bold tracking-wider ${textMuted} mb-1.5 ml-1`}>NEURAL ID (EMAIL)</label>
              <input type="email" name="email" required placeholder="operative@domain.com" className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} text-sm focus:border-cyan-400 outline-none`} />
            </div>
            <div>
              <label className={`block text-xs font-bold tracking-wider ${textMuted} mb-1.5 ml-1`}>ACCESS CODE (PASSWORD)</label>
              <input type="password" name="password" required placeholder="••••••••" className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} text-sm focus:border-cyan-400 outline-none`} />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              disabled={isSubmitting} 
              type="submit" 
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-black uppercase tracking-widest mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Synchronizing...</>
              ) : (
                authView === 'signup' ? 'Create Account' : 'Sign In'
              )}
            </motion.button>
          </form>
          
          <button onClick={() => { setAuthView(authView === 'signup' ? 'login' : 'signup'); setAuthError(null); }} className={`w-full text-center text-xs ${textMuted} hover:text-cyan-500 transition mt-6 font-bold`}>
            {authView === 'signup' ? 'Already registered? Sign In' : 'New? Create Profile & Choose Universe'}
          </button>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // AUTHENTICATED: MAIN DASHBOARD
  // ==========================================
  return (
    <div className={`min-h-screen ${bgBase} ${gridPattern} ${textMain} bg-gradient-to-br ${currentStyle.bg} p-4 sm:p-6 font-sans relative pb-24 transition-colors duration-500`}>
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className={`fixed bottom-8 right-8 z-50 px-5 py-3.5 ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-md border border-cyan-500/50 text-cyan-500 rounded-2xl shadow-lg font-mono text-sm font-bold flex items-center gap-3`}>
            <Terminal className="w-5 h-5" /> {feedbackMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER & CONTROLS */}
        <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`flex flex-wrap items-center justify-between gap-6 p-4 sm:p-5 ${cardBg} border ${cardBorder} rounded-3xl backdrop-blur-xl shadow-xl transition-colors`}>
          <div className="flex items-center gap-5">
            <div className={`relative w-14 h-14 rounded-2xl ${inputBg} border ${currentStyle.border} flex items-center justify-center font-black ${currentStyle.accent} text-2xl ${currentStyle.glow}`}>
              <GenreIcon className="absolute w-14 h-14 opacity-20 animate-[spin_12s_linear_infinite]" />
              <span className="relative z-10">L{profile.level}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className={`font-black text-2xl sm:text-3xl ${textMain} tracking-tight`}>{profile.username}</span>
                {profile.equipped_badge && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase ${inputBg} ${currentStyle.accent} border ${currentStyle.border} inline-flex items-center gap-1 shadow-sm`}>
                    <Sparkles className="w-3 h-3" /> EQUIPPED
                  </span>
                )}
              </div>
              <p className={`text-xs ${currentStyle.accent} font-mono mt-0.5 tracking-widest uppercase font-bold flex items-center gap-1.5`}>
                <Shield className="w-3.5 h-3.5" /> Rank: {getRank(profile.level)}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm font-mono font-bold">
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-100 border-amber-300'} text-amber-500`}>
              <Sparkles className="w-4 h-4" /> {profile.gold} {activeGenre.currency}
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${isDarkMode ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-100 border-rose-300'} text-rose-500`}>
              <Flame className="w-4 h-4" /> {profile.streak_count}D 
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsProfileModalOpen(true)} className={`p-2.5 rounded-xl ${inputBg} hover:${cardBg} border ${cardBorder} ${textMuted} transition-colors`} title="Profile & Universe Settings">
              <User className="w-4 h-4" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-xl ${inputBg} hover:${cardBg} border ${cardBorder} ${textMuted} transition-colors`} title="Toggle Light/Dark Mode">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
            
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSignOut} className={`px-4 py-2.5 flex items-center gap-2 rounded-xl ${inputBg} hover:${cardBg} border ${cardBorder} ${textMuted} hover:text-rose-500 transition-colors uppercase tracking-widest text-[10px]`}>
              <LogOut className="w-4 h-4" /> Sign Out
            </motion.button>
          </div>
        </motion.header>

        {/* MAIN DASHBOARD CONTENT */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: QUESTS & ARMORY */}
          <div className="xl:col-span-2 space-y-6">
            <motion.section initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`p-6 ${cardBg} border ${cardBorder} rounded-3xl backdrop-blur-md shadow-lg`}>
              <div className="flex flex-wrap items-end justify-between gap-4 mb-3">
                <div>
                  <h2 className={`text-xs font-black font-mono tracking-widest ${textMuted} uppercase`}>Experience To Next Rank</h2>
                </div>
                <span className={`font-black text-xl font-mono ${currentStyle.accent}`}>{profile.current_xp} / {reqXp}</span>
              </div>
              <div className={`w-full h-5 ${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-200'} rounded-full overflow-hidden p-1 border ${cardBorder}`}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} transition={{ duration: 1 }} className={`h-full bg-gradient-to-r ${currentStyle.bar} rounded-full ${currentStyle.glow}`} />
              </div>
            </motion.section>

            <div className={`flex gap-3 border-b ${cardBorder} pb-3`}>
              <button onClick={() => setActiveTab('quests')} className={`px-6 py-2.5 rounded-2xl text-sm font-black tracking-wider transition-all ${activeTab === 'quests' ? `${btnInvert} shadow-lg` : `${textMuted} hover:${cardBg} hover:${textMain}`}`}>ACTIVE QUESTS</button>
              <button onClick={() => setActiveTab('shop')} className={`px-6 py-2.5 rounded-2xl text-sm font-black tracking-wider transition-all flex items-center gap-2 ${activeTab === 'shop' ? `${btnInvert} shadow-lg` : `${textMuted} hover:${cardBg} hover:${textMain}`}`}><ShoppingBag className="w-4 h-4" /> THE ARMORY</button>
            </div>

            {/* QUESTS VIEW WITH EMPTY-STATE WATERMARK CONTAINER */}
            {activeTab === 'quests' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-2 overflow-x-auto text-xs font-mono font-bold pb-2 sm:pb-0">
                    {['All', 'Strength', 'Intellect', 'Endurance', 'Vitality'].map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl border transition-all ${selectedCategory === cat ? `${inputBg} ${currentStyle.border} ${currentStyle.accent}` : `${cardBorder} ${textMuted}`}`}>
                        {cat === 'All' ? 'All' : activeGenre.stats[cat as AttributeType]}
                      </button>
                    ))}
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsAddModalOpen(true)} className={`inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r ${currentStyle.bar} text-white font-black text-xs font-mono tracking-wider rounded-xl uppercase shadow-lg`}>
                    <Plus className="w-4 h-4" /> Initialize
                  </motion.button>
                </div>

                {filteredTasks.length === 0 ? (
                  /* TACTICAL EMPTY STATE WATERMARK CONTAINER */
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className={`p-10 sm:p-14 rounded-3xl border-2 border-dashed ${cardBorder} ${cardBg} backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4 my-2 relative overflow-hidden`}
                  >
                    <div className={`absolute w-40 h-40 rounded-full ${isDarkMode ? 'bg-cyan-500/5' : 'bg-cyan-400/10'} blur-3xl pointer-events-none`} />

                    <div className={`relative w-16 h-16 rounded-2xl ${inputBg} border ${cardBorder} flex items-center justify-center shadow-lg z-10`}>
                      <Target className={`w-8 h-8 ${currentStyle.accent} animate-pulse`} />
                    </div>

                    <div className="space-y-1.5 max-w-md z-10">
                      <h3 className={`text-base font-black font-mono tracking-widest uppercase ${textMain}`}>
                        No Active Contracts Found
                      </h3>
                      <p className={`text-xs ${textMuted} leading-relaxed`}>
                        Your operational buffer is empty. Initialize your first directive above to begin earning XP, building attribute dominance, and banking {activeGenre.currency}.
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAddModalOpen(true)}
                      className={`px-6 py-3 rounded-xl bg-gradient-to-r ${currentStyle.bar} text-white font-mono font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 z-10 mt-2`}
                    >
                      <Plus className="w-4 h-4" /> Deploy First Directive
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div variants={containerVars} initial="hidden" animate="show" className="grid gap-3">
                    {filteredTasks.map(t => (
                      <motion.div variants={itemVars} key={t.id} className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${t.completed ? `${isDarkMode ? 'bg-slate-950/40 border-slate-800/50' : 'bg-slate-100/40 border-slate-200/50'} opacity-50` : `${cardBg} ${cardBorder} hover:${currentStyle.border} hover:-translate-y-0.5`}`}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black tracking-wider uppercase border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-600'}`}>{activeGenre.stats[t.category]}</span>
                            <span className={`text-[10px] ${textMuted} font-bold uppercase tracking-widest ${inputBg} px-2 py-0.5 rounded-lg border ${cardBorder}`}>{t.difficulty}</span>
                            <h3 className={`font-bold text-base sm:text-lg leading-tight ${t.completed ? `line-through ${textMuted}` : textMain}`}>{t.title}</h3>
                          </div>
                          {t.description && <p className={`text-xs sm:text-sm ${textMuted} font-medium`}>{t.description}</p>}
                          <div className={`text-[10px] font-black font-mono tracking-widest ${textMuted} flex gap-3 pt-1`}>
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-cyan-500" /> +{t.xp_reward} XP</span>
                            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> +{t.gold_reward} {activeGenre.currency}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!t.completed ? (
                            <>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => startTimerForTask(t, 25)} className={`px-3 py-2 rounded-xl ${inputBg} hover:${cardBg} border ${cardBorder} text-xs font-black font-mono tracking-wider transition-all flex items-center gap-1.5`}>
                                <Clock className={`w-4 h-4 ${currentStyle.accent}`} /> FOCUS
                              </motion.button>
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleComplete(t.id)} className={`px-3 py-2 rounded-xl ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950' : 'bg-emerald-100 border-emerald-300 text-emerald-600 hover:bg-emerald-500 hover:text-white'} border text-xs font-black font-mono tracking-wider transition-all flex items-center gap-1.5`}>
                                <CheckCircle2 className="w-4 h-4" /> COMPLETE
                              </motion.button>
                            </>
                          ) : (
                            <span className={`text-xs font-black font-mono text-emerald-500 flex items-center gap-1.5 px-3 py-2 ${isDarkMode ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-emerald-50/50 border-emerald-200'} rounded-xl border`}><CheckCircle2 className="w-4 h-4" /> CLAIMED</span>
                          )}
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setEditingTask(t)} className={`p-2 rounded-xl ${inputBg} hover:${cardBg} ${textMuted} hover:${textMain} border ${cardBorder}`}><Edit3 className="w-4 h-4" /></motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={async () => { await deleteTask(t.id); await loadData(); }} className={`p-2 rounded-xl ${inputBg} hover:${cardBg} ${textMuted} hover:text-rose-500 border ${cardBorder}`}><Trash2 className="w-4 h-4" /></motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* SHOP VIEW */}
            {activeTab === 'shop' && (
              <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopItems.map(item => {
                  const isOwned = ownedItemIds.includes(item.id);
                  const isEquipped = (item.type === 'theme' && profile.active_theme === item.value) || (item.type === 'badge' && profile.equipped_badge === item.value);
                  return (
                    <motion.div variants={itemVars} key={item.id} className={`p-5 ${cardBg} backdrop-blur-md border ${cardBorder} rounded-3xl flex flex-col justify-between gap-5 group`}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={`font-black text-lg ${textMain}`}>{item.name}</h3>
                          <span className={`text-[10px] font-black font-mono px-2 py-1 rounded-lg tracking-wider border ${isOwned ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border-emerald-300') : (isDarkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-600 border-amber-300')}`}>
                            {isOwned ? 'ACQUIRED' : `${item.cost} ${activeGenre.currency}`}
                          </span>
                        </div>
                        <p className={`text-sm ${textMuted} font-medium leading-relaxed`}>{item.description}</p>
                      </div>
                      <motion.button whileHover={!isEquipped ? { scale: 1.02 } : {}} whileTap={!isEquipped ? { scale: 0.98 } : {}} disabled={(!isOwned && profile.gold < item.cost) || isEquipped} onClick={() => handleBuy(item.id)} className={`w-full py-3 rounded-xl font-mono text-xs tracking-widest font-black transition-all flex items-center justify-center gap-2 ${isEquipped ? `${inputBg} ${textMuted} border ${cardBorder}` : isOwned ? `${btnInvert} shadow-lg` : profile.gold < item.cost ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 opacity-50 cursor-not-allowed' : `bg-gradient-to-r ${currentStyle.bar} text-white shadow-lg`}`}>
                        {isEquipped ? <><Check className="w-4 h-4" /> ACTIVE</> : isOwned ? 'EQUIP ITEM' : 'PURCHASE & EQUIP'}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN: ATTRIBUTES & MATRIX */}
          <div className="xl:col-span-1 space-y-6">
            <div className={`p-6 ${cardBg} border ${cardBorder} rounded-3xl backdrop-blur-md shadow-lg`}>
              <h2 className={`text-xs font-black font-mono tracking-widest ${textMuted} mb-5 flex items-center gap-2 uppercase`}><Cpu className="w-4 h-4" /> Attribute Dominance</h2>
              <div className="space-y-4">
                {[
                  { name: activeGenre.stats.Strength, val: profile.strength, color: isDarkMode ? 'bg-rose-500' : 'bg-rose-400', text: isDarkMode ? 'text-rose-400' : 'text-rose-600' },
                  { name: activeGenre.stats.Intellect, val: profile.intellect, color: isDarkMode ? 'bg-cyan-500' : 'bg-cyan-400', text: isDarkMode ? 'text-cyan-400' : 'text-cyan-600' },
                  { name: activeGenre.stats.Endurance, val: profile.endurance, color: isDarkMode ? 'bg-amber-500' : 'bg-amber-400', text: isDarkMode ? 'text-amber-400' : 'text-amber-600' },
                  { name: activeGenre.stats.Vitality, val: profile.vitality, color: isDarkMode ? 'bg-emerald-500' : 'bg-emerald-400', text: isDarkMode ? 'text-emerald-400' : 'text-emerald-600' },
                ].map(attr => {
                  const maxStat = Math.max(profile.strength, profile.intellect, profile.endurance, profile.vitality, 1);
                  return (
                    <div key={attr.name} className="relative">
                      <div className="flex justify-between items-end mb-1">
                        <span className={`text-[10px] font-black tracking-widest uppercase ${textMuted}`}>{attr.name}</span>
                        <span className={`text-sm font-black ${attr.text}`}>{attr.val}</span>
                      </div>
                      <div className={`w-full h-2.5 ${inputBg} rounded-full overflow-hidden border ${cardBorder}`}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(attr.val / maxStat) * 100}%` }} transition={{ duration: 1 }} className={`h-full ${attr.color} rounded-full`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-6 ${cardBg} border ${cardBorder} rounded-3xl backdrop-blur-md shadow-lg`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xs font-black font-mono tracking-widest ${textMuted} flex items-center gap-2 uppercase`}><Calendar className="w-4 h-4" /> Consistency Matrix</h2>
                <span className={`text-[10px] font-mono font-bold ${currentStyle.accent}`}>{completedDates.size} ACTIVE DAYS</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {currentMonthDays.map((dateStr) => {
                  const day = parseInt(dateStr.split('-')[2], 10);
                  const isCompleted = completedDates.has(dateStr);
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <div key={dateStr} className={`h-9 rounded-xl border flex flex-col items-center justify-center text-[10px] font-mono font-bold transition-all ${isCompleted ? `${currentStyle.glow} bg-emerald-500/20 border-emerald-500/40 text-emerald-400` : isToday ? `${inputBg} border-cyan-500 text-cyan-400` : `${inputBg} ${cardBorder} ${textMuted} opacity-40`}`}>
                      {day} {isCompleted && <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-6 ${inputBg} border ${cardBorder} rounded-3xl backdrop-blur-md shadow-inner`}>
              <div className={`text-[11px] font-mono ${currentStyle.accent} space-y-2.5 opacity-80 leading-relaxed font-bold`}>
                <p>{'>'} STATUS: SYNCHRONIZED</p>
                <p>{'>'} TOTAL_FOCUS: {formatHours(profile.total_focus_time || 0)}</p>
                <p>{'>'} CURRENT_STREAK: {profile.streak_count} DAYS</p>
                <p>{'>'} BEST_RECORD: {profile.best_streak} DAYS</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: FOCUS PROTOCOL TIMER */}
      <AnimatePresence>
        {timerTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-900/40'} backdrop-blur-md flex items-center justify-center p-4 z-50`}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`max-w-md w-full ${cardBg} border ${cardBorder} rounded-3xl p-8 shadow-2xl text-center space-y-6`}>
              <div>
                <span className={`text-[10px] font-mono font-black tracking-widest uppercase ${currentStyle.accent} ${inputBg} px-3 py-1 rounded-full border ${cardBorder}`}>ACTIVE FOCUS PROTOCOL</span>
                <h3 className={`text-xl font-black mt-4 ${textMain}`}>{timerTask.title}</h3>
                <p className={`text-xs ${textMuted} mt-1`}>+{timerTask.xp_reward} XP • +{timerTask.gold_reward} {activeGenre.currency}</p>
              </div>
              <div className="relative py-6">
                <div className={`text-6xl font-black font-mono tracking-widest ${textMain}`}>{formatTimer(timerSeconds)}</div>
                <div className="w-full h-2 bg-slate-500/20 rounded-full mt-6 overflow-hidden">
                  <motion.div className={`h-full bg-gradient-to-r ${currentStyle.bar}`} style={{ width: `${((initialDuration - timerSeconds) / initialDuration) * 100}%` }} />
                </div>
              </div>
              <div className="flex justify-center gap-2">
                {[15, 25, 45].map((mins) => (
                  <button key={mins} onClick={() => { setInitialDuration(mins * 60); setTimerSeconds(mins * 60); setIsTimerRunning(false); }} className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition ${initialDuration === mins * 60 ? `${currentStyle.border} ${currentStyle.accent} ${inputBg}` : `${cardBorder} ${textMuted}`}`}>
                    {mins}m
                  </button>
                ))}
              </div>
              <div className="flex justify-center items-center gap-3 pt-2">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsTimerRunning(!isTimerRunning)} className={`px-6 py-3 bg-gradient-to-r ${currentStyle.bar} text-white font-mono font-black text-sm rounded-xl uppercase flex items-center gap-2 shadow-lg`}>
                  {isTimerRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setTimerSeconds(initialDuration); setIsTimerRunning(false); }} className={`p-3 rounded-xl ${inputBg} border ${cardBorder} ${textMuted}`}>
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700/40 text-xs font-mono font-bold">
                <button onClick={() => {
                  setTimerTask(null); setIsTimerRunning(false);
                  if (elapsedFocusTime > 0) completeTask(timerTask.id, elapsedFocusTime).then(() => loadData());
                }} className="text-rose-400 hover:underline">Abort Protocol</button>
                <button onClick={() => {
                  setIsTimerRunning(false); handleComplete(timerTask.id, elapsedFocusTime); setTimerTask(null);
                }} className="text-emerald-400 hover:underline">Claim Early Complete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: PROFILE & GENRE SWITCHER */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-900/40'} backdrop-blur-md flex items-center justify-center p-4 z-50`}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`max-w-md w-full ${cardBg} border ${cardBorder} rounded-3xl p-8 shadow-2xl`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-mono font-black text-sm tracking-widest ${textMain} uppercase`}>Operative Profile</h3>
                <button onClick={() => setIsProfileModalOpen(false)} className={`p-2 ${inputBg} hover:${cardBg} rounded-full transition-colors`}><X className={`w-4 h-4 ${textMuted}`} /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className={`block ${textMuted} mb-3 text-xs font-bold tracking-widest`}>CHANGE UNIVERSE (GENRE)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(GENRES).map((g) => (
                      <button key={g.id} onClick={async () => { await updateGenre(g.id); await loadData(); }} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${profile.genre === g.id ? `${inputBg} border-cyan-500` : `${cardBg} ${cardBorder} hover:border-slate-500`}`}>
                        <g.icon className={`w-6 h-6 ${profile.genre === g.id ? 'text-cyan-500' : textMuted}`} />
                        <span className={`text-[10px] font-bold ${profile.genre === g.id ? textMain : textMuted}`}>{g.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE QUEST */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 ${isDarkMode ? 'bg-slate-950/60' : 'bg-slate-900/20'} backdrop-blur-sm flex items-center justify-center p-4 z-50`}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className={`max-w-md w-full ${cardBg} border ${cardBorder} rounded-3xl p-7 shadow-2xl`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-mono font-black text-sm tracking-widest ${textMain} uppercase`}>Initialize Quest</h3>
                <button onClick={() => setIsAddModalOpen(false)} className={`p-2 ${inputBg} hover:${cardBg} rounded-full`}><X className={`w-4 h-4 ${textMuted}`} /></button>
              </div>
              <form onSubmit={async (e) => { e.preventDefault(); const res = await createTask(new FormData(e.currentTarget)); if (res?.error) showFeedback(res.error); setIsAddModalOpen(false); await loadData(); }} className="space-y-4 font-mono text-xs font-bold">
                <div><label className={`block ${textMuted} mb-2 tracking-widest`}>CONTRACT TITLE</label><input name="title" required className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} outline-none`} /></div>
                <div><label className={`block ${textMuted} mb-2 tracking-widest`}>BRIEF (OPTIONAL)</label><input name="description" className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} outline-none`} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block ${textMuted} mb-2 tracking-widest`}>ATTRIBUTE</label>
                    <select name="category" defaultValue="Intellect" className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} outline-none appearance-none`}>
                      <option value="Strength">{activeGenre.stats.Strength}</option><option value="Intellect">{activeGenre.stats.Intellect}</option><option value="Endurance">{activeGenre.stats.Endurance}</option><option value="Vitality">{activeGenre.stats.Vitality}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block ${textMuted} mb-2 tracking-widest`}>DIFFICULTY</label>
                    <select name="difficulty" defaultValue="Medium" className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} outline-none appearance-none`}>
                      <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option><option value="Epic">Epic</option>
                    </select>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className={`w-full py-4 ${btnInvert} font-black tracking-widest uppercase rounded-xl mt-4 shadow-lg transition-colors`}>Deploy Contract</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT QUEST */}
      <AnimatePresence>
        {editingTask && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 ${isDarkMode ? 'bg-slate-950/60' : 'bg-slate-900/20'} backdrop-blur-sm flex items-center justify-center p-4 z-50`}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className={`max-w-md w-full ${cardBg} border ${cardBorder} rounded-3xl p-7 shadow-2xl`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-mono font-black text-sm tracking-widest ${textMain} uppercase`}>Reconfigure Quest</h3>
                <button onClick={() => setEditingTask(null)} className={`p-2 ${inputBg} hover:${cardBg} rounded-full`}><X className={`w-4 h-4 ${textMuted}`} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const res = await updateTask(editingTask.id, fd.get('title') as string, fd.get('description') as string, fd.get('category') as AttributeType, fd.get('difficulty') as DifficultyType);
                if (res?.error) showFeedback(res.error);
                setEditingTask(null);
                await loadData();
              }} className="space-y-4 font-mono text-xs font-bold">
                <div>
                  <label className={`block ${textMuted} mb-2 tracking-widest`}>CONTRACT TITLE</label>
                  <input name="title" defaultValue={editingTask.title} required className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} outline-none`} />
                </div>
                <div>
                  <label className={`block ${textMuted} mb-2 tracking-widest`}>BRIEF (OPTIONAL)</label>
                  <input name="description" defaultValue={editingTask.description || ''} className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} outline-none`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block ${textMuted} mb-2 tracking-widest`}>ATTRIBUTE</label>
                    <select name="category" defaultValue={editingTask.category} className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} outline-none appearance-none`}>
                      <option value="Strength">{activeGenre.stats.Strength}</option><option value="Intellect">{activeGenre.stats.Intellect}</option><option value="Endurance">{activeGenre.stats.Endurance}</option><option value="Vitality">{activeGenre.stats.Vitality}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block ${textMuted} mb-2 tracking-widest`}>DIFFICULTY</label>
                    <select name="difficulty" defaultValue={editingTask.difficulty} className={`w-full px-4 py-3 ${inputBg} border ${cardBorder} rounded-xl ${textMain} outline-none appearance-none`}>
                      <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option><option value="Epic">Epic</option>
                    </select>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className={`w-full py-4 ${btnInvert} font-black tracking-widest uppercase rounded-xl mt-4 shadow-lg transition-colors`}>Update Contract</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}