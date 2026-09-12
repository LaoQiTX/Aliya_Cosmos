# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Overview

Aliya Cosmos — an Electron desktop narrative game, fan derivative of《彼方的她》. The player communicates with "Aliya" through a chat interface while managing life-support resources (O₂, H₂O, ENG) via toggle switches. Dialogue is time-gated: each story stage has a cooldown before the next unlocks (skippable with Shift key).

## Commands

```bash
# Dev (Vite dev server + Electron)
npm start                  # Runs vite server and opens Electron window loading localhost:3000

# Production build
npm run build              # electron-builder for Windows x64 NSIS installer → dist_electron/
npm run ele_pack           # electron-packager alternative → dist/
npm run vite_build         # Vite bundle only (with obfuscation) → election/page/
```

## Architecture

### Dual-process Electron app

**Main process** (`main.js`):
- Creates `BrowserWindow` (1024×900, min 900×800)
- Dev: loads `http://localhost:3000`; Prod: loads `dist/obfuscated/index.html`
- IPC handlers: `quit-app-on-condition` (sync), `get-window-focus` (async via `ipcMain.handle`)
- Computes MD5 of `app.asar` at startup when packaged

**Preload** (`preload.js`):
- Exposes `window.electronAPI` via `contextBridge`:
  - `sendQuitRequest()` — sends quit IPC
  - `log` — client-side logger instance (`js/utils/clientUtils/logger.js`)
  - `isFocus()` — returns `BrowserWindow.isFocused()`

### Renderer (game logic)

Entry: `index.html` → `js/index.js` (ES module, loaded via Vite in dev or bundled in prod).

**Core game loop** (`js/index.js`):
- `DialogueStateDto` singleton tracks: `timeStage`, `currentMessageIndex`, `isLoad`, `cacheOptionIndex`, `isEnd`, `readyForNextStage`
- `loadMessages()` iterates `data.dialogue[]` (from `res/data/data.json`):
  1. Each stage prints a timestamp, then iterates `messages[]`
  2. Message types: `"aliya"` (narrative text), `"player_options"` (choice buttons), `"player_input"` (username modal)
  3. `params.need_action` can block for EOG/EH switch toggles before proceeding
  4. `params.nessecery_op` enforces a specific option — wrong choice triggers `app.quit()`
  5. Between stages: shows timer GIF, waits until `Date.now() >= nextStageTime` (timestamp value from data + stored start time)
  6. Player can press **Shift** to skip the wait (sets `nextStageTime` to now, dispatches `wakeUp` event)
- `handlerParmas(params)` — applies music changes and heart rate range updates from message params

**Save/Load** (`js/load.js`):
- All save data in `localStorage.saveData` (JSON)
- First-run bootstrap via `firstLoad()`: initializes `everyStartTimeList`, `nextStageTime` (+5 minutes), `optionIndex`, `timeStage`, `optionsChoiceList`, default resource values (O₂:55, H₂O:40, ENG:15), default music
- `loadCacheData()` replays saved choices during load to catch up to the last-known state
- Resource decay (`startResourceDecay`) only starts after load replay completes

**Resource system** (`js/index.js`, 1-second interval):
- EOG active + water > 0: O₂ += 35/30 per sec, H₂O -= 40/20 per sec
- EOG inactive + O₂ < 30: O₂ decays slowly (halving rate); O₂ ≥ 30: fixed -0.1/sec
- EH active: ENG -= 1/sec

**Switches**: HRM (heart rate display toggle), EOG (electrolysis oxygen generator), EH (engine heat/energy consumption). EOG/EH are initially disabled and become clickable only when `need_action` triggers them in the dialogue.

### Logger system

Two loggers, both writing to dated `logs/YYYY-MM-DD/app.log`:
- **Client** (`js/utils/clientUtils/logger.js`): Node.js `fs.appendFileSync`, used by main/preload
- **Web** (`js/utils/webUtils/logger.js`): Bridges to client logger via `window.electronAPI.log`
- Dev: logs go to project-relative `logs/`; Prod: logs go to exe-directory-relative `logs/`

### Data format (`res/data/data.json`)

```json
{
  "dialogue": [
    {
      "timestamp": 900000,        // ms wait before next stage unlocks
      "messages": [
        {
          "type": "aliya" | "player_options" | "player_input",
          "content": ["text..."],  // player_options: array of choices
          "params": {
            "music": "./res/music/...mp3",
            "heart_rate": [min, max],
            "need_action": "eoh" | "eh"
          },
          "image_url": "./res/img/..."  // optional
        }
      ]
    }
  ]
}
```

### Build pipeline

Vite (`vite.config.js`) bundles ES modules with `vite-plugin-obfuscator` (control flow flattening, dead code injection, string array obfuscation). Output to `election/page/`. The `election/` directory contains a parallel copy of the renderer for packaging — `election/page/index.html` is the Vite output target, and `election/preload.js` / `election/logger.js` mirror the root versions.

### Key dependencies

- `howler` (v2) — audio playback (`Howl` class for music and SFX)
- `jquery` (v3) — DOM manipulation and AJAX
- `vite-plugin-obfuscator` — JS obfuscation for production builds
- `original-fs` — bypasses Electron's asar-patched fs to read the real filesystem
- `electron-builder` — Windows NSIS installer packaging

### External API integration (`js/post.js`)

Sends POST requests to a Dify-like chatbot API endpoint configured via `Cosmos_userURL` / `Cosmos_userKEY` in localStorage. Returns `answer` (plain text or `|`-delimited multi-message).
