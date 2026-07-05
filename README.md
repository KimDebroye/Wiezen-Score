# Wiezen Score

A high-performance, polished, and fully offline-first companion application designed to track and calculate scores for the traditional Belgian card game **Whist (Wiezen)**.

---

## 📌 Public Link | Online | Web Version (_Installable_)
🔗 **[Latest Version](https://ais-pre-2islevhmt3dp3q5rjor5y7-460629003467.europe-west3.run.app)**
(_hosted on Google servers_)

---

## 📱 Install & Auto-Save

Installing this website as an app is recommended for persistance (scores/settings/...).<br />
The application contains zero third-party telemetry, tracking libraries, or heavy external web dependencies, loading instantaneously with optimal layouts for smartphones, tablets, and desktops.

- **How to Install (PWA)**:
    - **Android (Chrome / Samsung Browser / ...)**: Tap the three dots in your browser and choose **Install App** or **Add to Home Screen**.
    - **iPhone (Safari)**: Tap the share button (square with an arrow pointing up) and choose **Add to Home Screen**.
    - **Fullscreen Standalone Experience**: Once installed, the app opens in a standalone window. This removes all browser menus and navigation bars, allowing the scoreboard to fit the entire screen of your phone perfectly.

- **Your Data is Completely Safe (Local Storage)**:
    - **Automatic Saving**: Every score, player name, and setting option is saved automatically on your own device as you type.
    - **No Account Needed**: There is no login, signup, or password. All game history remains private and secure on your own device.
    - **Offline-Ready**: No internet connection is needed to use the scoreboard. Even if you close the app or turn off your phone, everything will remain exactly where you left it.

---

## 🌟 Capabilities & Features

The Wiezen Score app makes tracking Whist card game sessions effortless.
Here is what you can do with this app:

*   **Intuitive Score Tracking**:
    *   **Quickly input rounds**: Rapidly log rounds by selecting who asked, who joined, what they played, and how many tricks they won.
    *   **Simply select specific contracts & players involved** (_Vraag & Antwoord, Troel, Miserie, Open Miserie, Solo Abondance, Solo Slim, Manual Score_).
*   **Custom Name Editing**: Tap any player header inline to modify names instantly. Player names are limited to 3 characters in uppercase for a neat arcade-scoreboard feel.
*   **Sequential Reordering (Move/Shift Mode)**: Made a mistake or wrote a round out of order? Tap the reorder arrows to swap rounds up and down. The scoreboard instantly recalculates cumulative totals sequentially.
*   **Direct Round Deletion**: Made an error or want to erase a round completely? Click the "Delete Round" button directly inside the edit modal (or the reorder toolbar), and a dual-confirmation modal will safeguard against accidental clicks. All cumulative scores are instantly recalculated.
*   **Full Game History & Sessions Manager**:
    *   Save and resume multiple sessions.
    *   Review past games with dates, final standings, and decorated badges for the session winner.
    *   Activate older games to review them or resume play.
*   **Customizable Target Tricks (Doelslagen)**: 
    *   **Dedicated Configuration Section**: Adjust the tricks required to win for Vraag & Antwoord Together (default 8), Vraag & Antwoord Alone (default 5), and Troel (default 8) to match your local pub's house rules.
    *   **Dynamic UI Scaling**: The scoring sliders, win/loss color codes, basis labels, and help widgets automatically recalibrate to reflect your custom target thresholds.
    *   **Independent Settings Restoration**: Revert your target tricks or points scoring settings back to official rules independently with specialized "Restore Defaults" (Herstel Standaard) buttons.
*   **Robust Backup & CSV Import/Export**:
    *   Download your entire played history or single sessions as CSV backups or copy a single session result to the clipboard for easy score sharing.
    *   Import backups with intelligent conflict resolution (choose to completely overwrite, append new games, or resolve duplicated games by choosing to overwrite or keep existing ones).
*   **Dynamic Visual Themes (Café Skins)**: Personalize the scoreboard with specialized game room palettes, ranging from the default nostalgic cardroom felt green to classic dark, deep blue velvet, and minimal slate themes. Selected skins are stored persistently via `localStorage`.
*   **Offline-First & Auto-Save**: All data is automatically persisted to the browser's local storage. Close the tab or reboot your device—your scoreboard will remain exactly as you left it.

---

## 📊 Rigorous Scoring Rules & Calculations

Whist is a **zero-sum game**: all points gained by winners are paid directly by losers, ensuring the net sum of all round score deltas is always precisely **zero**. The scoreboard follows official **International World Whist Association (IWWA)** guidelines.

### Vraag & Antwoord (_Ask & Answer_)
*   **Partnership**: Partners must win 8 or more tricks. Success awards base points + overtricks. Failure triggers a penalty base + undertricks.
*   **Solo**: Asker must win 5 or more tricks alone. Score is multiplied by 3 (distributed among opponents).

### Troel
A forced contract when a player holds 3 or more Aces. The player with the 4th Ace becomes the partner. Partners must win 8 or more tricks. High base value reflects the rarity and strength of the hands.

### Miserie & Open Miserie (_Op Tafel_)
One or more players commit to winning exactly **zero** tricks. Success or failure is settled independently for each miserie player against their opponents. Open Miserie doubles the stakes as cards are played face-up.

### Solo (_Abondance_)
A single player commits to winning a specific high target (9 or more tricks) alone. Points scale aggressively with the target bid (10, 11, or 12 tricks).

### Solo Slim (_Grand Chelem_)
The ultimate challenge: a single player commits to winning **all 13 tricks** alone. This awards the highest possible point value in the game.

### Manual Score (_Penalty_ / _Custom Entry_)
A specialized entry mode for penalties (e.g., misdeals) or custom house rules.
*   **Zero-Sum Toggle**: Choose whether to balance the points across all players (default) or apply a non-balanced penalty.
*   **Contextual Logging**: Optionally add a short reason (e.g., "Penalty for misdeal") to explain the entry in history.

### All Pass
If no contracts are bid, players can choose to simply pass. The round is recorded with 0 points for everyone, tracking the progression without affecting totals.

### More Info & Official Rules
🔗 [Official (Belgian) Whiss Rules](https://www.whistiwwa.com/reglementen-tornooien)

---

## 🛠️ Technical Architecture

This application is built with a decoupled, modular React 18 frontend leveraging TypeScript, Vite, Tailwind CSS, and Framer Motion (`motion/react`) for fluid transitions and state overlays.

```
/
├── src/
│   ├── components/
│   │   ├── HistoryPanel.tsx       # Saved games sidebar, single/batch backups & conflict merge wizard
│   │   ├── QuickInput.tsx         # Fast touch-friendly buttons for contract entry
│   │   ├── ScoreCalculator.tsx    # Precise form-based parameters for specialized contracts
│   │   ├── SettingsPanel.tsx      # Multiplier editing & persistent configuration (with theme skins)
│   │   └── RulesPanel.tsx         # Rules, definitions, and card-game terminology
│   ├── lib/
│   │   └── scoring.ts             # Zero-sum game theory scoring library (IWWA conform)
│   ├── locales/
│   │   ├── en.ts                  # English translation dictionary
│   │   ├── nl.ts                  # Dutch translation dictionary
│   │   └── index.ts               # Core localization entry point and language configuration
│   ├── themes/                    # Dedicated visual theme skins folder
│   │   ├── types.ts               # Theme types and properties interface definition
│   │   ├── index.ts               # Core dynamic theme registration & DOM styles injection logic
│   │   ├── standard.ts            # Nostalgic cardroom felt green theme skin
│   │   ├── dark.ts                # Sleek dark chalkboard slate theme skin
│   │   ├── peach.ts               # Soft pastel peach theme skin
│   │   ├── glass.ts               # Translucent glassmorphism theme skin
│   │   ├── paper.ts               # Minimal white sheet/paper theme skin
│   │   └── cards.ts               # Classic playing card pattern theme skin
│   ├── types.ts                   # Strongly typed interfaces (Player, Round, Session, Settings)
│   ├── App.tsx                    # Main state machine, routing, and table renderer
│   ├── main.tsx                   # Main React mount point and Service Worker subscription
│   └── index.css                  # Tailwind entry and custom fonts (Inter & JetBrains Mono)
├── metadata.json                  # Application capabilities metadata
└── README.md                      # Documentation
```

### State Management & React Dataflow

The application features a single-source-of-truth state container at `App.tsx`. 
*   **Data Models**:
    *   `Player`: Uniquely identified by `id` (e.g. `p1`, `p2`) and stores uppercase initials.
    *   `Round`: Records round metadata, individual `scores` delta for that round, and the active contract details. It stores cumulative `totals` representing the player standings at that specific point in time.
    *   `Session`: Captures game timestamp, active status flag, player metadata, and an ordered array of `Round` objects.
*   **Automatic Cumulative Cascades**:
    When a round is added, updated, deleted, or shifted, the function `recalculateSessionRounds` executes. It loops through all rounds sequentially, maintaining a running total of scores starting from zero to guarantee mathematical consistency and prevent rounding drift.

---

## 💾 CSV File Import/Export Specs (RFC 4180)

The backup system generates and parses standard RFC 4180-compliant CSV files with character escaping support to manage games and restore scores perfectly.

### File Format Structure
The exported backup file contains the following structure:
*   **Headers**: `id,date,isActive,players,rounds`
*   **Values**:
    *   `id`: String representation of the unique session identifier.
    *   `date`: ISO 8601 UTC string.
    *   `isActive`: Boolean (`true` or `false`).
    *   `players`: RFC-escaped string containing JSON array of player structures.
    *   `rounds`: RFC-escaped string containing JSON array of played round objects (including individual score deltas, running totals, and active contract details).

### Interactive Import Wizard
When importing a `.csv` file, the scoreboard parses the headers and extracts the sessions. Rather than blindly overwriting the current session logs, it computes the intersection of unique identifiers:

```
Conflicts = Imported IDs in common with Current IDs
```

If one or more conflicts exist (meaning imported session IDs match existing ones in local storage), the app shows an elegant Overlay Dialog presenting three options:
1.  **Overwrite All**: Resets local storage completely and writes only the imported backup.
2.  **Append & Update**: Merges the current local sessions with the imported backup. If a session exists in both places, the imported version replaces the current one.
3.  **Append & Skip Duplicates**: Merges the current local sessions with the imported backup, keeping existing sessions exactly as they are in local storage and skipping matching imported items.

---

## 🚀 Local Development

### Installation

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run the local development server:
    ```bash
    npm run dev
    ```
3.  Build the production applet bundle:
    ```bash
    npm run build
    ```
4.  Launch the standalone production server:
    ```bash
    npm run start
    ```

### Production Bundling Flow

In production mode, the application compiles through Vite for high-performance client-side execution.
