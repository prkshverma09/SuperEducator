# Text Selection Reader - Chrome Extension

A Chrome extension that opens as a sidebar to display selected text from any webpage.

## Features

- 📝 Read selected text from any webpage
- 📊 Character and word count
- 📋 Copy to clipboard with one click
- 🔄 Auto-updates when you select new text
- 🎨 Beautiful dark theme UI

## Installation

### Development Setup

1. **Install dependencies:**
   ```bash
   cd chrome-extension
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

   For development with auto-rebuild:
   ```bash
   npm run dev
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder inside `chrome-extension`

4. **Add icons (optional):**
   - Add your own icons to `public/icons/`:
     - `icon16.png` (16x16)
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)

## Usage

1. Click the extension icon in Chrome toolbar
2. The sidebar will open on the right side
3. Select any text on a webpage
4. The selected text appears in the sidebar automatically
5. Click "Copy to Clipboard" to copy the text

## Project Structure

```
chrome-extension/
├── dist/                 # Built extension files
├── public/
│   └── icons/           # Extension icons
├── src/
│   ├── sidepanel/       # React sidebar UI
│   │   ├── index.tsx
│   │   ├── SidePanel.tsx
│   │   ├── SidePanel.css
│   │   └── sidepanel.html
│   ├── content/         # Content script
│   │   └── content.ts
│   └── background/      # Service worker
│       └── background.ts
├── manifest.json
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Technologies

- React 18
- TypeScript
- Chrome Extension Manifest V3
- Chrome Side Panel API
- Webpack 5

