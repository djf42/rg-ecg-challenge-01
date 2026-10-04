# ECG Rhythm Challenge: setup guide

A standalone game with its own GitHub repository and web address. It uses the same Firebase project as the CPR Misconceptions Challenge (the sign-in settings you've already set up), but stores its scores and results separately, so the two games never mix.

| Page | Who uses it | What it does |
|---|---|---|
| `index.html` | Learners | The game: a How it works screen and optional practice round, then 10 arrest rhythms in random order, 10 seconds each. Each player's first game goes on the leaderboard. |
| `leaderboard.html` | Anyone | Public, view-only leaderboard (this month and all time). |
| `dashboard.html` | You and named colleagues | Private analytics: accuracy by rhythm, what each rhythm was mistaken for, missed and inappropriate shocks. |
| `gallery.html` | You | All ten rhythm strips side by side, for clinical review. Not linked from the game. |

Supporting files:

```
js/config.js        your Firebase settings and dashboard users (already filled in)
js/rhythms.js       the ten rhythms: rates, waveforms, and the teaching text shown after each answer
js/monitor.js       the ECG monitor display
js/algorithm.js     the RECOVER CPR ECG Algorithm shown in the feedback, with path highlighting
js/store.js         saving and loading scores
js/strip.js         the rhythm animation on the start screen
css/brand.css       RECOVER colors, fonts and layout
assets/recover-logo.webp
```

---

## 1. Put it on GitHub Pages

1. On GitHub, create a new **public** repository, e.g. `ecg-rhythm-challenge`.
2. Click **Add file → Upload files** and drag in everything from this folder, including the `js`, `css` and `assets` folders. Click **Commit changes**.
3. Go to **Settings → Pages**. Set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**, and click **Save**.
4. After a minute or two your links will be:
   - Game: `https://djf42.github.io/ecg-rhythm-challenge/`
   - Public leaderboard: `https://djf42.github.io/ecg-rhythm-challenge/leaderboard.html`
   - Dashboard: `https://djf42.github.io/ecg-rhythm-challenge/dashboard.html`
   - Rhythm review: `https://djf42.github.io/ecg-rhythm-challenge/gallery.html`

No Firebase sign-in changes are needed: `djf42.github.io` is already an authorized domain, and the API key restriction (`https://djf42.github.io/*`) already covers the new repository.

## 2. Update the database rules

A Firebase project has a single set of security rules, so the rules need to cover both games.

1. In Firebase, open **Firestore** (under Project shortcuts), then the **Rules** tab.
2. Replace everything with the contents of `firestore-rules.txt` (supplied alongside this package, with your address already filled in).
3. Click **Publish**.

These rules cover both games: the misconceptions game's `misconceptions_boards` and `misconceptions_attempts` collections (500–1,000 points per correct answer) and this game's `rhythm_boards` and `rhythm_attempts` (100–1,000 points per correct answer). **If you've already published an earlier version of these rules, publish this one**: the earlier version would reject rhythm scores below 500 per correct answer.

## 3. Check that it works

1. Play one game and confirm the results screen says your score is on the leaderboard (no "Demo mode" notice).
2. Open the public leaderboard in a private/incognito window and confirm your entry appears.
3. Sign in to the dashboard and confirm your game appears (choose "All time" if "This month" is empty).
4. Play the misconceptions game once to confirm it still posts normally.

If something fails, the dashboard shows the error details on screen, and the browser console (F12) shows them for the other pages.

---

## Before the game

After entering their name and role, learners see a short **How it works** screen, then can play a coached **asystole practice round** (it never counts and isn't recorded) or skip straight to the challenge. Hints above the scene explain each stage of the round as it happens.

## How a round works

1. **Compressions (3 seconds):** the compressor animation runs and the monitor shows compression artifact.
2. **Pulse check:** compressions stop, the pulse checker says "I don't feel a pulse" ("I feel a pulse!" for ROSC), and the underlying rhythm sweeps across the monitor.
3. **Answer (10 seconds):** Asystole, PEA, VF, Pulseless VT or ROSC. Keys 1–5 also work on a keyboard.
4. **Scoring:** a correct answer earns 1,000 points if instant, falling steadily to 100 just before the buzzer (e.g. 550 at 5 seconds). A wrong answer or a timeout scores zero.
5. **Feedback:** the correct answer, whether it's shockable, the RECOVER CPR ECG Algorithm with the path to the correct diagnosis highlighted in red (and the learner's answer marked if it was wrong), and a short explanation. On phones the algorithm appears as a numbered list of the same steps. The algorithm drawing is in `js/algorithm.js`.

The monitor shows standard ECG grid lines (one big box = 0.2 s) with tick marks every second, and an **HR** box to the right of the tracing that behaves like a patient monitor: `---` during compressions; once the monitor has seen two complexes (at least a second after compressions stop, longer for slow rhythms) it shows the rhythm's rate (drifting by a beat or two), `0` for asystole, `---` for fine and intermediate VF, and a number jumping around wildly for coarse VF. Each rhythm's HR behavior is set in `js/rhythms.js` (`hr: "none"` or `hr: "wild"`) and listed on `gallery.html`.

## Leaderboard rules

Leaderboards are **first-score**: only each player's first game is posted, and the database rules prevent it from ever being changed. That keeps the boards fair if prizes are offered. Players can keep playing to beat their **personal best**, which the results screen shows alongside their leaderboard score (with a "New personal best" badge), but later games never change the leaderboard. Every game, first or not, still goes to the dashboard.

- **All time** lists every player's first game.
- **This month** lists the players whose first game was this month, so each player appears on one monthly board only.
- A player is identified by their browser. Someone who switches devices or clears their browser data could post a second "first" score under a new identity. For prizes, check winners' names, and remember that the Docebo version will tie scores to real learner accounts.

## Editing rhythms and teaching text

Everything is in `js/rhythms.js`. For each rhythm:
- `detail` is the one-line description shown after answering (e.g. "Wide complexes, about 38/min").
- `teach` is the explanation paragraph.
- The rate is set in the `fn:` line (e.g. `regular(60 / 38, ...)` for 38/min).

After editing, change the version tag `?v=2026-10-04b` in the four HTML pages (any new value, e.g. `?v=2026-10-20`) so browsers load the new file rather than a saved copy. Check the result on `gallery.html`.

## Using the dashboard

- **Time period, role, and first attempt vs every attempt** work as in the misconceptions dashboard. "First attempt per player" shows what learners could recognize before practicing.
- **Accuracy by rhythm** shows percent correct, timeouts and median time to a correct answer for each rhythm.
- **What each rhythm was mistaken for** is a grid: each row is a rhythm, each cell the share of learners who chose that answer. Dark red cells are common confusions.
- **Missed shocks / inappropriate shocks** summarize the clinically important errors: shockable rhythms called non-shockable, and the reverse.
- **Show sample data** fills the dashboard with clearly labeled demonstration data.
- **Export** gives a per-rhythm summary or every individual answer as CSV, without names.

## Managing the leaderboard

To remove an entry: Firebase → **Firestore** → **Data** tab → `rhythm_boards` → the month (e.g. `m-2026-10`) or `all` → `players` → select the entry → three-dot menu → **Delete document**.

## Known limits

Same as the misconceptions game: a player is identified by their browser, scoring happens in the browser (the rules reject impossible scores), and answers can be found in the page source by anyone who looks. Both games share the free plan's daily limits; together they comfortably support around 1,000 games a day.

## Naming for future games

Every game keeps its data in two Firestore collections named after the game: `<game>_boards` (leaderboards) and `<game>_attempts` (results for the dashboard). This game uses `rhythm_boards` and `rhythm_attempts`; the misconceptions game uses `misconceptions_boards` and `misconceptions_attempts`. Each game's pages set these names near the top (`window.GAME = { ... }`), and each game needs a matching pair of blocks in the shared Firestore rules (the comment at the top of `firestore-rules.txt` explains how to add one).

## Moving to Docebo later

The same approach planned for the misconceptions game applies: package the game as SCORM 2004, take learners' names from Docebo, report each answer to Docebo, and keep the public leaderboard on GitHub Pages.
