# Google Meet Recorder

A Chrome extension that allows you to record Google Meet meetings with ease.

## Features

- 🎥 Record video and audio from Google Meet meetings
- ⏱️ Real-time recording duration display
- 💾 Automatic download of recordings in WebM format
- 🎨 Clean and intuitive user interface
- 🔴 Visual recording indicator

## Installation

### From Source

1. Clone or download this repository to your local machine
2. Open Google Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" button
5. Select the `meet-recorder` folder
6. The extension is now installed!

## Usage

1. **Join a Google Meet**: Navigate to any Google Meet meeting (https://meet.google.com/xxx-xxxx-xxx)

2. **Start Recording**:

   - Click on the extension icon in your Chrome toolbar
   - Click the "Start Recording" button
   - You'll be prompted to choose what to share:
     - Select the **"Chrome Tab"** option (not "Entire Screen" or "Window")
     - Choose the tab with your Google Meet meeting
     - **IMPORTANT**: Check the box "Also share tab audio" at the bottom
   - Click "Share" to begin recording
   - A red "Recording..." badge will appear on the Meet page

3. **Stop Recording**:

   - Click on the extension icon again
   - Click the "Stop Recording" button
   - The recording will automatically download to your default downloads folder

4. **Access Your Recording**:
   - Recordings are saved as `.webm` files with timestamps
   - Find them in your Downloads folder
   - File naming format: `google-meet-recording-YYYY-MM-DDTHH-MM-SS.webm`

## Important Notes

### ⚠️ Permissions and Privacy

- This extension requires permission to capture your screen and audio
- It only works on Google Meet pages (meet.google.com)
- **Always inform meeting participants that you are recording** - this is required by law in many jurisdictions
- Recordings are saved locally on your computer only

### 🎵 Audio Capture

**CRITICAL**: To record the meeting audio (what others are saying), you MUST:

- Select the **"Chrome Tab"** option in the sharing dialog (NOT your entire screen or window)
- Check the box **"Also share tab audio"** at the bottom of the sharing dialog
- This captures the audio playing IN the tab (other participants' voices)

Without tab audio sharing, you'll only record video with no meeting audio!

For best results:

- Use headphones to prevent echo/feedback
- Make sure the Meet tab is not muted
- Test your recording before important meetings

### 📹 Video Quality

- Recordings capture exactly what you see on the Meet tab at up to 1080p
- Video codec: VP9 (falls back to VP8 if unavailable)
- Audio codec: Opus
- Bitrate: 2.5 Mbps

### 🔧 Troubleshooting

**Extension not working?**

- Make sure you're on a Google Meet tab (URL contains `meet.google.com`)
- Refresh the Google Meet page and try again
- Check that you have the latest version of Chrome

**No audio in recording?**

- Did you select the **"Chrome Tab"** option (not screen/window)?
- Did you check **"Also share tab audio"**?
- Make sure the Meet tab's audio is not muted
- Chrome may not allow tab audio capture for some system configurations

**Recording won't start?**

- Check that you granted screen capture permissions
- Try reloading the extension from `chrome://extensions/`
- Make sure you selected the correct tab to share

## File Structure

```
meet-recorder/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Popup styling
├── popup.js              # Popup logic
├── content.js            # Content script for recording
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## Technical Details

### Permissions Used

- `activeTab`: Access the current tab's URL and title
- `scripting`: Inject content scripts into Google Meet pages
- `storage`: Store recording state between popup opens
- `tabCapture`: Capture video and audio from tabs
- `host_permissions`: Access Google Meet pages

### APIs Used

- **MediaRecorder API**: Record video and audio streams
- **getDisplayMedia API**: Capture screen/tab content
- **Chrome Extension APIs**: Tabs, Storage, Runtime messaging

## Browser Compatibility

- Google Chrome version 88 or higher
- Chromium-based browsers (Edge, Brave, Opera) may work but are not officially supported

## Privacy

This extension:

- ✅ Does NOT upload recordings anywhere
- ✅ Does NOT collect any user data
- ✅ Does NOT track your activity
- ✅ Stores recordings only on your local device
- ✅ Only activates on Google Meet pages

## Legal Notice

**Recording Consent**: You are responsible for complying with all applicable laws regarding recording conversations. In many jurisdictions, you must:

- Inform all participants that the meeting is being recorded
- Obtain consent from all participants before recording
- Use recordings only for lawful purposes

The developers of this extension are not responsible for any misuse.

## License

MIT License - feel free to modify and distribute as needed.

## Credits

Created for personal and educational use. Not affiliated with Google.

## Support

For issues or feature requests, please create an issue in the repository.

---

**Remember**: Always get consent before recording meetings! 🎙️
