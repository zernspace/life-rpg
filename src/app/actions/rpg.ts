'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { AttributeType, DifficultyType } from '@/types/game';
import { getRequiredXp } from '@/lib/rpg-utils';

const REWARD_MAP: Record<DifficultyType, { xp: number; gold: number }> = {
  Easy: { xp: 50, gold: 15 }, Medium: { xp: 100, gold: 35 },
  Hard: { xp: 200, gold: 75 }, Epic: { xp: 400, gold: 150 },
};

export async function createTask(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Authentication session expired. Please sign in again.' };
    }

    const title = (formData.get('title') as string || '').trim();
    if (!title) return { error: 'Title is required' };

    const diff = (formData.get('difficulty') as DifficultyType) || 'Medium';
    const rewards = REWARD_MAP[diff] || REWARD_MAP.Medium;

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title,
      description: (formData.get('description') as string) || '',
      category: formData.get('category') as AttributeType,
      difficulty: diff,
      xp_reward: rewards.xp,
      gold_reward: rewards.gold,
      completed: false
    });

    if (error) {
      console.error('Supabase Task Insert Error:', error.message);
      return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('createTask Exception:', err);
    return { error: err.message || 'Operation timed out. Please retry.' };
  }
}
export async function updateTask(taskId: string, title: string, description: string, category: AttributeType, difficulty: DifficultyType) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    const rewards = REWARD_MAP[difficulty] || REWARD_MAP.Medium;
    const { error } = await supabase.from('tasks').update({ title: title.trim(), description, category, difficulty, xp_reward: rewards.xp, gold_reward: rewards.gold }).match({ id: taskId, user_id: user.id });
    if (error) return { error: error.message };
    revalidatePath('/'); return { success: true };
  } catch (err: any) { return { error: err.message }; }
}

export async function deleteTask(taskId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    await supabase.from('tasks').delete().match({ id: taskId, user_id: user.id });
    revalidatePath('/'); return { success: true };
  } catch (err: any) { return { error: err.message }; }
}

export async function completeTask(taskId: string, focusSeconds: number = 0) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!task || task.completed || !profile) return { error: 'Invalid state' };

    await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);

    const today = new Date().toISOString().split('T')[0];
    let newStreak = profile.streak_count || 1;
    if (profile.last_active_date !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      if (profile.last_active_date === yesterday.toISOString().split('T')[0]) newStreak += 1;
      else newStreak = 1;
    }

    let newXp = profile.current_xp + task.xp_reward;
    let newLevel = profile.level;
    let reqXp = getRequiredXp(newLevel);
    while (newXp >= reqXp) { newXp -= reqXp; newLevel += 1; reqXp = getRequiredXp(newLevel); }

    const attrKey = task.category.toLowerCase() as 'strength' | 'intellect' | 'endurance' | 'vitality';
    
    await supabase.from('profiles').update({
      level: newLevel, current_xp: newXp, gold: profile.gold + task.gold_reward,
      streak_count: newStreak, best_streak: Math.max(newStreak, profile.best_streak || 1),
      last_active_date: today, [attrKey]: (profile[attrKey] || 10) + 2,
      total_focus_time: (profile.total_focus_time || 0) + focusSeconds
    }).eq('id', user.id);

    revalidatePath('/'); return { success: true };
  } catch (err: any) { return { error: err.message }; }
}

export async function buyShopItem(itemId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    const { data: item } = await supabase.from('shop_items').select('*').eq('id', itemId).single();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!item || !profile) return { error: 'Not found' };
    
    const { data: existing } = await supabase.from('inventory').select('id').match({ user_id: user.id, item_id: itemId }).maybeSingle();
    if (existing) {
      const updates: any = {};
      if (item.type === 'theme') updates.active_theme = item.value;
      if (item.type === 'badge') updates.equipped_badge = item.value;
      if (Object.keys(updates).length > 0) { await supabase.from('profiles').update(updates).eq('id', user.id); revalidatePath('/'); return { success: true }; }
      return { error: 'Already acquired' };
    }
    if (profile.gold < item.cost) return { error: 'Insufficient funds' };

    await supabase.from('inventory').insert({ user_id: user.id, item_id: itemId });
    const updates: any = { gold: profile.gold - item.cost };
    if (item.type === 'theme') updates.active_theme = item.value;
    if (item.type === 'badge') updates.equipped_badge = item.value;
    if (item.type === 'equipment' && item.boost_attribute) {
      const key = item.boost_attribute.toLowerCase(); updates[key] = (profile[key] || 10) + (item.boost_value || 0);
    }
    await supabase.from('profiles').update(updates).eq('id', user.id);
    revalidatePath('/'); return { success: true };
  } catch (err: any) { return { error: err.message }; }
}

export async function updateGenre(genre: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('profiles').update({ genre }).eq('id', user.id);
    revalidatePath('/');
  }
}
