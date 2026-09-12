export type AttributeType = 'Strength' | 'Intellect' | 'Endurance' | 'Vitality';
export type DifficultyType = 'Easy' | 'Medium' | 'Hard' | 'Epic';

export interface Profile {
  id: string;
  username: string;
  level: number;
  current_xp: number;
  gold: number;
  streak_count: number;
  best_streak: number;
  last_active_date: string;
  strength: number;
  intellect: number;
  endurance: number;
  vitality: number;
  active_theme: string;
  equipped_badge: string | null;
  total_focus_time: number;
  genre: string;
}

export interface Task {
  id: string; user_id: string; title: string; description?: string;
  category: AttributeType; difficulty: DifficultyType;
  xp_reward: number; gold_reward: number;
  completed: boolean; completed_at?: string; created_at: string;
}

export interface ShopItem {
  id: string; name: string; description: string; cost: number;
  type: 'theme' | 'badge' | 'equipment';
  boost_attribute?: AttributeType; boost_value?: number;
  value: string; icon: string;
}
