# Slitheroo 🐍

A competitive neon Snake game built for the browser. No downloads, no installs — open the page and play. Features global leaderboards, power-ups, achievements, daily challenges, and full mobile support.

**Live at:** [slitheroo.online](https://slitheroo.online)

-----

## Features

### Game Modes

- **Ranked** — Classic Snake. Walls are deadly. Scores submit to the global leaderboard.
- **Zen** — Walls wrap around. Relaxed, obstacle-free by default.
- **Timed** — Score as much as possible in 60 seconds.
- **Daily Challenge** — Seeded board, same for everyone each day. One shot to top the table.

### Gameplay

- 3 food types: Normal (10pts), Bonus (25pts), Mega (50pts)
- 4 power-ups that spawn randomly mid-run: Shield, 2× Score Multiplier, Slow Motion, Ghost
- Combo streak system with visual popups and audio feedback
- Arena expansion when the snake fills 80% of the board
- Dynamic obstacle generation scaling with level
- Level-based speed increase and theme rotation

### Progression

- 12 unlockable achievements stored in localStorage
- Personal stats page (games played, avg score, best level, food eaten, power-ups used)
- Daily play streak tracker
- Daily Challenge best score tracking

### Polish

- Screen shake on death
- Particle bursts on food pickup
- Web Audio API sound effects — eat, level up, die, power-up, combo (no external files)
- Animated pulsing food
- Mute toggle (M key or button)
- 4 visual themes, 4 snake skins

### Social

- Share score as a branded PNG image download
- Challenge link generator — sends rivals a pre-filled URL showing your score to beat

### Technical

- Vanilla JavaScript, HTML5 Canvas, Web Audio API
- Zero external dependencies (game logic)
- localStorage for all personal data and preferences
- Service worker for offline/PWA support
- Supabase for global leaderboard (anon inserts, RLS-protected)
- Google AdSense + GPT rewarded ad integration (optional, config-gated)

-----

## File Structure

```
/
├── index.html          # Main game page
├── script.js           # All game logic
├── style.css           # All styles
├── stats.html          # Personal stats and achievements page
├── about.html
├── how-to-play.html
├── blog.html
├── faq.html
├── changelog.html
├── privacy.html
├── terms.html
├── contact.html
├── ads.txt             # AdSense publisher declaration
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline cache (v2.0.0)
├── ads/
│   └── rewarded-ad.js  # GPT rewarded ad wrapper
├── assets/
│   ├── logo-full.png
│   ├── favicon-16.png
│   ├── favicon-32.png
│   └── apple-touch-icon.png
└── supabase/
    └── schema.sql      # Leaderboard database schema
```

-----

## Configuration

Game config lives in a `window.SLITHEROO_CONFIG` block in `index.html`:

```js
window.SLITHEROO_CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  ADS_ENABLED: false,           // set true to enable rewarded ads
  AD_STACK: 'gpt_rewarded',     // or 'mock' for testing
  ADMGR_REWARDED_AD_UNIT_PATH: '/NETWORK_CODE/ad_unit',
  AD_REQUEST_TIMEOUT_MS: 8000
};
```

-----

## Leaderboard Setup (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
1. Run `supabase/schema.sql` in the SQL editor
1. Copy your project URL and anon key into `SLITHEROO_CONFIG`

The schema creates:

- `scores` table with RLS (anon can insert, cannot select raw rows)
- `daily_leaderboard` view (top score per player per day)
- `all_time_leaderboard` view (top score per player all time)

-----

## Deployment

The entire project is a static site. Deploy by pushing to GitHub and enabling GitHub Pages, or drop the files into any static host (Netlify, Vercel, Cloudflare Pages).

Make sure `ads.txt` is served from the root domain for AdSense compliance.

-----

## Controls

|Action          |Desktop           |Mobile      |
|----------------|------------------|------------|
|Change direction|Arrow keys or WASD|Swipe       |
|Pause           |P or Escape       |—           |
|Mute/unmute     |M                 |Sound button|

-----

## Keyboard Shortcuts

|Key              |Action        |
|-----------------|--------------|
|Arrow keys / WASD|Steer snake   |
|P / Escape       |Pause / resume|
|M                |Toggle sound  |

-----

## Achievement List

|Achievement    |Condition                 |
|---------------|--------------------------|
|🎮 First Run    |Complete your first game  |
|🍎 Hungry       |Eat 50 food in one run    |
|💯 Centurion    |Score 100 points          |
|🎰 High Roller  |Score 500 points          |
|👑 Legend       |Score 1000 points         |
|🏆 Survivor     |Reach level 5             |
|⚡ Power Hungry |Collect 10 power-ups total|
|💨 Speed Demon  |Reach level 8             |
|👻 Ghost Rider  |Use the Ghost power-up    |
|📅 Daily Devotee|Play 3 days in a row      |
|🔥 Week Warrior |Play 7 days in a row      |
|🔗 Combo King   |Reach a x10 streak        |

-----

## Changelog

### v2.0.0

- Added Timed and Daily Challenge game modes
- Added 4 power-ups: Shield, Score Multiplier, Slow Motion, Ghost
- Added 3 food types with weighted spawn rates
- Added 12 achievements with localStorage persistence
- Added personal stats page (stats.html)
- Added day streak tracking
- Added screen shake on death
- Added particle effects on food pickup
- Added Web Audio API sound effects (no external files)
- Added animated pulsing food
- Added combo streak popups
- Added share-as-image (canvas PNG export)
- Added challenge link generation
- Added sound toggle (M key + button)
- Updated service worker to v2.0.0

### v1.3.0

- Rewarded ad integration via GPT
- Consent banner for ad personalization
- Continue-after-death feature

### v1.2.0

- All-time leaderboard
- Customization screen (skins + themes)
- Zen mode

### v1.1.0

- Daily leaderboard via Supabase
- Nickname system

### v1.0.0

- Initial release
