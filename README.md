<h1 align="left">
  <img src="public/icon.svg" width="48" height="48" valign="middle" alt="Life RPG Icon">
  <span>Life RPG</span>
</h1>

**Gamify your daily tasks into epic quests.**

**Website Link:** [https://life-rpg-zern2.vercel.app/](https://life-rpg-zern2.vercel.app/)  
**Demo Video:** [Watch Walkthrough Video](https://your-video-link-here)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.0-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [Multi-Genre Universe Engine](#1-multi-genre-universe-engine)
  - [Quest Management System](#2-quest-management-system)
  - [Focus Protocols (Pomodoro Mode)](#3-focus-protocols-pomodoro-mode)
  - [The Armory (Economy & Consumables)](#4-the-armory-economy--consumables)
  - [Progress Matrices & Metrics](#5-progress-matrices--metrics)
- [Game Mechanics & Mathematics](#-game-mechanics--mathematics)
  - [Level-Up Curve](#level-up-curve)
  - [Reward Mapping](#reward-mapping)
  - [Active Status Buffs](#active-status-buffs)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation Setup and Environment Configuration](#installation--setup)
- [Tools & References](#tools-and-references)


---

## 🌟 Overview

Standard habit trackers and to-do lists frequently suffer from high user drop-off due to rigid streak systems and dry checklists. **Life RPG** solves this by borrowing psychological reward loops from classic role-playing games. 

Real-world activities yield experience points (XP), attribute points, and local currency. Users can level up, customize their aesthetic universe, track their focus hours, and spend their currency on mechanical consumables like XP boosters or streak freezes.

---

## 🚀 Key Features

### 1. Multi-Genre Universe Engine
The application adapts its entire theme, terminology, rank ladders, and stat labels according to the universe chosen during signup or changed via settings:

| Genre | Currency | Attributes Tracked (STR / INT / END / VIT) | Rank Progression |
| :--- | :--- | :--- | :--- |
| **Cyberpunk** | Credits | STR &bull; INT &bull; END &bull; VIT | Novice &rarr; Adept &rarr; Specialist &rarr; Veteran &rarr; Master &rarr; Apex |
| **Fantasy RPG** | Gold Pieces | MIGHT &bull; WISDOM &bull; STAMINA &bull; VIGOR | Villager &rarr; Adventurer &rarr; Hero &rarr; Champion &rarr; Legend &rarr; Demigod |
| **High Seas Pirate** | Doubloons | BRAWN &bull; CUNNING &bull; SEA LEGS &bull; GRIT | Swab &rarr; Deckhand &rarr; Boatswain &rarr; Quartermaster &rarr; Captain &rarr; Pirate King |
| **Cozy Minimalist** | Points | FITNESS &bull; MIND &bull; FOCUS &bull; WELLNESS | Beginner &rarr; Learner &rarr; Achiever &rarr; Professional &rarr; Expert &rarr; Master |

### 2. Quest Management System
- **Categorized Directives:** Assign quests to one of four core attributes.
- **Difficulty Tiers:** Easy, Medium, Hard, and Epic tiers scale XP and currency linearly.
- **Full CRUD Support:** Create, update, re-categorize, complete, or delete quests in real time.
- **Micro-Interactions:** Completed quests trigger synthesized sound chimes and confetti animations.

### 3. Focus Protocols (Pomodoro Mode)
- Built-in timer with presets for 15, 25, and 45-minute focus intervals.
- Integrated audio synthesis via the **Web Audio API** (procedural square/sine/triangle waves without heavy audio asset downloads).
- Automatically tracks and persists cumulative lifetime focus hours (`total_focus_time`) to the profile upon session completion.

### 4. The Armory (Economy & Consumables)
An in-game marketplace where earned currency can be spent on active buffs:
- **Streak Freeze:** Miss a day without losing streak continuity.
- **Lucky Coin:** Doubles currency rewards for a 2-hour window.
- **XP Potion:** 2× XP multiplier active for 4 hours.
- **Power Rush:** 3× XP multiplier active for 1 hour.
- **Active Buff Tracker:** Live countdown timer displayed directly in the navigation bar when a consumable is active.

### 5. Progress Matrices & Metrics
- **Attribute Dominance:** Visual progress bars displaying dynamic attribute distribution based on completed quest types.
- **Consistency Matrix:** A monthly calendar grid highlighting active and completed days.
- **Streak Tracker:** Tracks both current streaks and all-time personal best streaks.

---

## 📐 Game Mechanics & Mathematics

### Level-Up Curve
Leveling requirements scale non-linearly to simulate traditional RPG pacing:

$$\text{Required XP} = \lfloor 100 \times \text{Level}^{1.5} \rfloor$$

When a user's current XP exceeds the required threshold, the backend consumes the threshold amount, increments the level, and checks again via an internal loop to handle multi-level jumps.

### Reward Mapping

| Difficulty Tier | Base XP | Base Currency |
| :--- | :--- | :--- |
| **Easy** | 10 XP | 5 |
| **Medium** | 25 XP | 15 |
| **Hard** | 50 XP | 35 |
| **Epic** | 100 XP | 75 |

### Active Status Buffs
Status buffs alter server-side calculation of completed tasks:
- `XP Potion` &rarr; `finalXp = task.xp_reward * 2`
- `Power Rush` &rarr; `finalXp = task.xp_reward * 3`
- `Lucky Coin` &rarr; `finalGold = task.gold_reward * 2`

## 💻 Tech Stack

### Core Framework & Architecture
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| ![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=next.js&logoColor=white) | 15.x | Full-stack framework, App Router architecture, and Server Actions (`'use server'`) |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white) | 5.x | End-to-end static type safety and shared game interface contracts |
| ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white) | Latest | Managed PostgreSQL database, user authentication, and Row Level Security (RLS) |

### UI, Styling & Motion
| Technology | Purpose |
| :--- | :--- |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Utility-first responsive styling and multi-genre dynamic theme injection |
| ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white) | Spring animations, modal overlays, layout transitions, and staggered lists |
| ![Lucide Icons](https://img.shields.io/badge/Lucide_React-F56565?style=flat-square&logo=lucide&logoColor=white) | Contextual icon set adapted per genre (swords, cyber-hexagons, anchors, hearts) |
| ![Canvas Confetti](https://img.shields.io/badge/Canvas_Confetti-FFD700?style=flat-square) | Particle celebration physics on quest completions and rank milestones |

### Audio & Infrastructure
| Technology | Purpose |
| :--- | :--- |
| **Web Audio API** | Native procedural audio synthesizer (triangle, square, and sine waves for zero-latency chimes and power-ups without external audio assets) |
| ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white) | Edge network deployment, CI/CD pipeline, and automatic preview environments |

---

## 📦 Getting Started

Follow these steps to set up and run Life RPG locally on your machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.17.0 or higher)
- `npm` (v9 or higher), `pnpm`, or `yarn`
- A [Supabase](https://supabase.com/) account and project with PostgreSQL database access

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/zernspace/life-rpg.git](https://github.com/zernspace/life-rpg.git)
   cd life-rpg

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create your local `.env.local` file by copying the example template:
   ```bash
   cp .env.example .env.local
   ```

   Open `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Initialize the local dev server:**
   ```bash
   npm run dev
   ```

5. **Launch the application:**
   Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---
<a id="tools-and-references"></a>
## 🛠️ Tools & References

- **Framework & Language:** Next.js 15, React, TypeScript
- **Database & Auth:** Supabase (PostgreSQL)
- **Styling & UI:** Tailwind CSS, Framer Motion, Lucide React, Canvas Confetti
- **Audio:** Web Audio API
- **Hosting:** Vercel
- **AI Tools:** Google Gemini, ChatGpt
- **References:** MDN Web Audio API, Supabase Documentation

---

<div align="center">

Built by **[@zernspace](https://github.com/zernspace)**

</div>
