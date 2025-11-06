# Quick Start Guide

## Step 1: Generate Icons

You need to create three PNG icon files before loading the extension.

**Option A - Using the HTML Generator (Easiest)**

1. Open `icons/generate-icons.html` in your browser
2. It will automatically download 3 PNG files
3. Move them to the `icons/` folder

**Option B - Use Placeholder Images**

- Find or create any 3 PNG images
- Resize them to 16x16, 48x48, and 128x128 pixels
- Name them `icon16.png`, `icon48.png`, `icon128.png`
- Place them in the `icons/` folder

## Step 2: Load Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `meet-recorder` folder
5. Done! The extension is now installed

## Step 3: Use the Extension

1. Join a Google Meet meeting
2. Click the extension icon in Chrome toolbar
3. Click "Start Recording"
4. **In the sharing dialog:**
   - Select **"Chrome Tab"** (not Entire Screen or Window)
   - Choose the tab with your Google Meet
   - Check **"Also share tab audio"** at the bottom
5. Click "Share" to start recording
6. Click "Stop Recording" when done
7. Recording will auto-download

## Important Reminders

⚠️ **Always get consent before recording meetings!**

- Inform all participants you're recording
- Follow your local laws regarding recording consent

🎵 **For audio to work:**

- MUST select "Chrome Tab" option (not screen/window)
- MUST check "Also share tab audio"
- This records what you HEAR in the tab (other participants)
- Without tab audio, you'll only get silent video!

## Troubleshooting

**Extension won't load?**

- Make sure you have all 3 icon PNG files in the icons folder
- Check that all files are in the correct locations

**No audio in recording?**

- Did you select "Chrome Tab" (not entire screen)?
- Did you check "Also share tab audio"?
- Is the Meet tab's audio unmuted?
- Try testing with a simple video in the tab first

**Can't start recording?**

- Make sure you're on a meet.google.com page
- Refresh the page and try again
- Check browser permissions

Need more help? See the full README.md
