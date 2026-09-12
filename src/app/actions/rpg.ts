'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { AttributeType, DifficultyType } from '@/types/game';
import { getRequiredXp } from '@/lib/rpg-utils';

const REWARD_MAP = {
  Easy: { xp: 10, gold: 5 },
  Medium: { xp: 25, gold: 15 },
  Hard: { xp: 50, gold: 35 },
  Epic: { xp: 100, gold: 75 }
};

export async function createTask(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Authentication session expired.' };

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

    if (error) return { error: error.message };
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Operation failed' };
  }
}

export async function updateTask(id: string, title: string, description: string, category: AttributeType, difficulty: DifficultyType) {
  const supabase = await createClient();
  const rewards = REWARD_MAP[difficulty] || REWARD_MAP.Medium;
  const { error } = await supabase.from('tasks').update({ title, description, category, difficulty, xp_reward: rewards.xp, gold_reward: rewards.gold }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  await supabase.from('tasks').delete().eq('id', id);
  revalidatePath('/');
  return { success: true };
}

export async function completeTask(id: string, focusTimeSeconds: number = 0) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!task || !profile) return { error: 'Record not found' };

  let finalXp = task.xp_reward;
  let finalGold = task.gold_reward;
  
  // Verify Buff is Active and multiply rewards
  if (profile.buff_expires_at && new Date(profile.buff_expires_at).getTime() > new Date().getTime()) {
    if (profile.active_buff === 'xp_potion') finalXp *= 2;
    if (profile.active_buff === 'power_rush') finalXp *= 3;
    if (profile.active_buff === 'lucky_coin') finalGold *= 2;
  }

  await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', id);

  // --- LEVEL UP LOGIC ---
  let newXp = (profile.current_xp || 0) + finalXp;
  let newLevel = profile.level || 1;
  
  let reqXp = getRequiredXp(newLevel);
  
  // Loop in case they gained enough XP to level up multiple times at once
  while (newXp >= reqXp) {
    newXp -= reqXp; // Consume the XP required for this level
    newLevel++;     // DING! Level up
    reqXp = getRequiredXp(newLevel); // Get the new threshold for the next level
  }

  const attrKey = task.category.toLowerCase();
  const newAttrVal = (profile[attrKey] || 0) + 1;
  const newFocusTime = (profile.total_focus_time || 0) + focusTimeSeconds;

  // Update profile with new XP and new Level
  await supabase.from('profiles').update({
    current_xp: newXp,
    level: newLevel,
    gold: profile.gold + finalGold,
    [attrKey]: newAttrVal,
    total_focus_time: newFocusTime
  }).eq('id', user.id);

  revalidatePath('/');
  return { success: true };
}

export async function buyShopItem(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: item } = await supabase.from('shop_items').select('*').eq('id', itemId).single();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
  if (!item || !profile || profile.gold < item.cost) return { error: 'Insufficient funds' };

  await supabase.from('profiles').update({ gold: profile.gold - item.cost }).eq('id', user.id);
  await supabase.from('inventory').insert({ user_id: user.id, item_id: itemId });

  revalidatePath('/');
  return { success: true };
}

export async function activateConsumable(itemId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    let hours = 1;
    if (itemId === 'xp_potion') hours = 4;
    else if (itemId === 'power_rush') hours = 1;
    else if (itemId === 'lucky_coin') hours = 2;
    else if (itemId === 'streak_freeze') hours = 24;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);

    // Delete item from inventory safely using explicit .eq constraints
    const { error: delErr } = await supabase
      .from('inventory')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', itemId);

    if (delErr) throw new Error(delErr.message);

    // Set the active buff on the profile
    const { error: upErr } = await supabase
      .from('profiles')
      .update({
        active_buff: itemId,
        buff_expires_at: expiresAt.toISOString()
      })
      .eq('id', user.id);

    if (upErr) throw new Error(upErr.message);

    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to activate. Please try again.' };
  }
}

export async function updateGenre(genreId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({ genre: genreId }).eq('id', user.id);
  revalidatePath('/');
}