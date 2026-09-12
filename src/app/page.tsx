'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { signUp, login, signOut } from '@/app/actions/auth';
import { createTask, updateTask, deleteTask, completeTask, buyShopItem } from '@/app/actions/rpg';
import { getRequiredXp } from '@/lib/rpg-utils';
import { Profile, Task, ShopItem, AttributeType, DifficultyType } from '@/types/game';
import confetti from 'canvas-confetti';
import { 
  Shield, Zap, Flame, Award, Plus, Trash2, Edit3, 
  CheckCircle2, ShoppingBag, LogOut, Terminal, Sparkles, X, Check
} from 'lucide-react';

export default function LifeRPGApp() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quests' | 'shop'>('quests');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const [{ data: prof }, { data: tList }, { data: items }, { data: inv }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('shop_items').select('*'),
        supabase.from('inventory').select('item_id').eq('user_id', user.id)
      ]);
      setProfile(prof);
      setTasks(tList || []);
      setShopItems(items || []);
      setOwnedItemIds((inv || []).map((i: any) => i.item_id));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const res = isSignUp ? await signUp(formData) : await login(formData);
    if (res?.error) {
      setAuthError(res.error);
    } else {
      await loadData();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setTasks([]);
  };

  const handleComplete = async (taskId: string) => {
    playChime();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
    const res = await completeTask(taskId);
    if (res?.error) showFeedback(res.error);
    await loadData();
  };

  const handleBuy = async (itemId: string) => {
    const res = await buyShopItem(itemId);
    if (res?.error) {
      showFeedback(res.error);
    } else {
      playChime();
      confetti({ particleCount: 50, spread: 60 });
      showFeedback('Item acquired and synchronized!');
    }
    await loadData();
  };

  const themeClass = profile?.active_theme === 'theme-synthwave'
    ? 'from-pink-950/40 via-purple-950/20 to-slate-950 text-pink-400 border-pink-500/30'
    : profile?.active_theme === 'theme-matrix'
    ? 'from-emerald-950/40 via-green-950/20 to-slate-950 text-emerald-400 border-emerald-500/30'
    : 'from-cyan-950/40 via-blue-950/20 to-slate-950 text-cyan-400 border-cyan-500/30';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-mono">
        <div className="animate-pulse flex items-center gap-3">
          <Terminal className="w-6 h-6 animate-spin" /> INITIALIZING NEURAL LINK...
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-8 backdrop-blur shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center gap-3 justify-center mb-6">
            <Zap className="w-8 h-8 text-cyan-400 animate-pulse" />
            <h1 className="text-2xl font-black tracking-wider text-slate-100 uppercase font-mono">LIFE RPG</h1>
          </div>
          <p className="text-center text-slate-400 text-sm mb-6">Translate your real-world progress into virtual power.</p>

          {authError && (
            <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs text-center font-mono">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">OPERATIVE HANDLE</label>
                <input
                  name="username"
                  required
                  placeholder="e.g. CyberSamurai"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">NEURAL ID (EMAIL)</label>
              <input
                type="email"
                name="email"
                required
                placeholder="operative@domain.com"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">ACCESS CIPHER (PASSWORD)</label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider transition shadow-lg shadow-cyan-500/25 mt-2"
            >
              {isSignUp ? 'Initialize Character' : 'Authenticate Session'}
            </button>
          </form>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
            className="w-full text-center text-xs text-slate-400 hover:text-cyan-400 transition mt-4 font-mono"
          >
            {isSignUp ? 'Already registered? Access terminal' : 'New operative? Create neural profile'}
          </button>
        </div>
      </div>
    );
  }

  const reqXp = getRequiredXp(profile.level);
  const xpPercent = Math.min(100, Math.round((profile.current_xp / reqXp) * 100));
  const filteredTasks = selectedCategory === 'All' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 bg-gradient-to-b ${themeClass} p-4 sm:p-8 font-sans relative`}>
      {/* Dynamic Feedback Toast */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 border border-cyan-400 text-cyan-300 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-2 animate-bounce">
          <Terminal className="w-4 h-4 text-cyan-400" /> {feedbackMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-mono font-bold text-cyan-400 text-xl shadow-lg shadow-cyan-500/20">
              L{profile.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-wide">{profile.username}</span>
                {profile.equipped_badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Netrunner
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">STATUS: SYNCHRONIZED</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" /> {profile.gold} CREDITS
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <Flame className="w-4 h-4 text-rose-400" /> {profile.streak_count}D STREAK (BEST: {profile.best_streak}D)
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <section className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-widest">Experience Buffer (LVL {profile.level})</span>
            <span className="text-cyan-400">{profile.current_xp} / {reqXp} XP ({xpPercent}%)</span>
          </div>
          <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          {[
            { name: 'Strength', val: profile.strength, color: 'text-rose-400 border-rose-500/30 bg-rose-500/5' },
            { name: 'Intellect', val: profile.intellect, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5' },
            { name: 'Endurance', val: profile.endurance, color: 'text-amber-400 border-amber-500/30 bg-amber-500/5' },
            { name: 'Vitality', val: profile.vitality, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' },
          ].map(attr => (
            <div key={attr.name} className={`p-4 rounded-xl border ${attr.color} flex flex-col justify-between`}>
              <span className="text-xs uppercase text-slate-400">{attr.name}</span>
              <span className="text-2xl font-black mt-1">{attr.val}</span>
            </div>
          ))}
        </section>

        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('quests')}
            className={`px-4 py-2 rounded-xl text-sm font-mono transition ${activeTab === 'quests' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-100'}`}
          >
            ACTIVE QUESTS
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-xl text-sm font-mono transition flex items-center gap-2 ${activeTab === 'shop' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-100'}`}
          >
            <ShoppingBag className="w-4 h-4" /> BLACK MARKET
          </button>
        </div>

        {activeTab === 'quests' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-1 overflow-x-auto text-xs font-mono">
                {['All', 'Strength', 'Intellect', 'Endurance', 'Vitality'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg border transition ${selectedCategory === cat ? 'bg-slate-800 border-cyan-400 text-cyan-300' : 'border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono rounded-xl uppercase transition shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" /> Initialize Quest
              </button>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
                <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-mono text-slate-400">NO ACTIVE CONTRACTS FOUND</p>
                <p className="text-xs text-slate-500 mt-1">Initialize a quest above to begin progressing.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredTasks.map(t => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                      t.completed 
                        ? 'bg-slate-900/20 border-slate-800/60 opacity-60' 
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-mono border ${
                          t.category === 'Strength' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          t.category === 'Intellect' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                          t.category === 'Endurance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {t.category}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">[{t.difficulty}]</span>
                        <h3 className={`font-medium ${t.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {t.title}
                        </h3>
                      </div>
                      {t.description && <p className="text-xs text-slate-400">{t.description}</p>}
                      <div className="text-xs font-mono text-slate-500">
                        REWARD: +{t.xp_reward} XP, +{t.gold_reward} CREDITS
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!t.completed ? (
                        <button
                          onClick={() => handleComplete(t.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500/40 text-emerald-300 hover:text-slate-950 text-xs font-mono transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> COMPLETE
                        </button>
                      ) : (
                        <span className="text-xs font-mono text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> CLAIMED
                        </span>
                      )}
                      <button
                        onClick={() => setEditingTask(t)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                        aria-label="Edit Quest"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => { await deleteTask(t.id); await loadData(); }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        aria-label="Delete Quest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SHOP TAB: Equipped / Owned Tracking */}
        {activeTab === 'shop' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shopItems.map(item => {
              const isOwned = ownedItemIds.includes(item.id);
              const isEquipped = 
                (item.type === 'theme' && profile.active_theme === item.value) ||
                (item.type === 'badge' && profile.equipped_badge === item.value);

              return (
                <div key={item.id} className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-100">{item.name}</h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {isOwned ? 'ACQUIRED' : `${item.cost} CREDITS`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{item.description}</p>
                  </div>
                  <button
                    disabled={(!isOwned && profile.gold < item.cost) || isEquipped}
                    onClick={() => handleBuy(item.id)}
                    className="w-full py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition disabled:opacity-30 disabled:cursor-not-allowed bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-1.5"
                  >
                    {isEquipped ? (
                      <><Check className="w-4 h-4" /> ACTIVE</>
                    ) : isOwned ? (
                      'EQUIP ITEM'
                    ) : profile.gold < item.cost ? (
                      'INSUFFICIENT CREDITS'
                    ) : (
                      'PURCHASE & EQUIP'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-mono font-bold text-sm text-cyan-400">INITIALIZE QUEST CONTRACT</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const res = await createTask(new FormData(e.currentTarget));
              if (res?.error) showFeedback(res.error);
              setIsAddModalOpen(false);
              await loadData();
            }} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">CONTRACT TITLE</label>
                <input name="title" required placeholder="e.g. 1-Hour LeetCode Protocol" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">BRIEF</label>
                <input name="description" placeholder="Optional protocol notes" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">ATTRIBUTE</label>
                  <select name="category" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100">
                    <option value="Strength">Strength</option>
                    <option value="Intellect">Intellect</option>
                    <option value="Endurance">Endurance</option>
                    <option value="Vitality">Vitality</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">DIFFICULTY</label>
                  <select name="difficulty" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100">
                    <option value="Easy">Easy (+50 XP)</option>
                    <option value="Medium">Medium (+100 XP)</option>
                    <option value="Hard">Hard (+200 XP)</option>
                    <option value="Epic">Epic (+400 XP)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-cyan-500 text-slate-950 font-bold uppercase rounded-lg mt-2">
                DEPLOY CONTRACT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-mono font-bold text-sm text-cyan-400">EDIT CONTRACT PARAMETERS</h3>
              <button onClick={() => setEditingTask(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const res = await updateTask(
                editingTask.id,
                fd.get('title') as string,
                fd.get('description') as string,
                fd.get('category') as AttributeType,
                fd.get('difficulty') as DifficultyType
              );
              if (res?.error) showFeedback(res.error);
              setEditingTask(null);
              await loadData();
            }} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">CONTRACT TITLE</label>
                <input name="title" defaultValue={editingTask.title} required className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">BRIEF</label>
                <input name="description" defaultValue={editingTask.description || ''} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">ATTRIBUTE</label>
                  <select name="category" defaultValue={editingTask.category} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100">
                    <option value="Strength">Strength</option>
                    <option value="Intellect">Intellect</option>
                    <option value="Endurance">Endurance</option>
                    <option value="Vitality">Vitality</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">DIFFICULTY</label>
                  <select name="difficulty" defaultValue={editingTask.difficulty} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Epic">Epic</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-cyan-500 text-slate-950 font-bold uppercase rounded-lg mt-2">
                UPDATE CONTRACT
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}