# File Downloader Chrome Extension

A beautiful Chrome extension that downloads all files from web pages with a modern UI/UX interface.

## Features

- 🎨 **Modern Glassmorphism Design** - Beautiful gradient backgrounds with blur effects
- 📊 **Real-time Feedback** - Loading states, progress indicators, and completion modals
- 🔄 **Smart Download Management** - Organizes files in folders by claim number
- ⚡ **Fast Performance** - Efficient file detection and download processing
- 📱 **Responsive UI** - Clean, professional interface with smooth animations
- 🛡️ **Error Handling** - Graceful failure handling with detailed error reporting

## Files Structure

```
extension/
├── manifest.json       # Extension configuration
├── popup.html         # Main popup interface
├── popup.js          # Popup logic and UI interactions
├── background.js     # Background service worker
├── icon16.png        # Extension icon (16x16)
├── icon32.png        # Extension icon (32x32)  
├── icon48.png        # Extension icon (48x48)
├── icon128.png       # Extension icon (128x128)
└── README.md         # This file
```

## Installation

1. **Download all files** to a folder on your computer
2. **Add extension icons** (see Icons section below)
3. **Open Chrome** and go to `chrome://extensions/`
4. **Enable Developer mode** (toggle in top-right corner)
5. **Click "Load unpacked"** and select your extension folder
6. **Pin the extension** to your toolbar for easy access

## Icons Setup

You need to create 4 icon files in PNG format:
- `icon16.png` (16x16 pixels)
- `icon32.png` (32x32 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

**Quick Icon Creation:**
1. Create a simple download/folder icon using any image editor
2. Use an online tool like [favicon.io](https://favicon.io) to generate multiple sizes
3. Or use AI tools like DALL-E, Midjourney to create a professional icon
4. Save them with the exact filenames listed above

## How to Use

1. **Navigate** to any webpage with downloadable files
2. **Click** the extension icon in your toolbar
3. **Press "Download All Files"** button
4. **Wait** for the download process to complete
5. **View results** in the beautiful completion modal
6. **Find your files** in the Downloads folder, organized by claim number

## Supported Page Structure

The extension looks for:
- Files in table cells with `data-label="Photo Name"`
- Claim numbers in form labels with text "Claim No"
- Direct download links in anchor tags

## Customization

### Modify File Detection
Edit the `collectLinksAndClaim()` function in `popup.js` to change:
- CSS selectors for file links
- File naming patterns
- Claim number detection logic

### Change UI Colors/Style
Update the CSS variables in `popup.html`:
- Gradient backgrounds
- Button colors
- Modal styling
- Animation effects

### Add New Features
- Extend `background.js` for additional download options
- Modify `popup.js` for new UI interactions
- Update `manifest.json` for additional permissions

## Troubleshooting

**Extension not loading:**
- Check all files are in the same folder
- Verify manifest.json syntax
- Ensure all icon files exist

**Downloads not working:**
- Check browser download permissions
- Verify popup blockers are disabled
- Ensure target page structure matches expected format

**UI not displaying correctly:**
- Clear browser cache
- Reload the extension
- Check console for JavaScript errors

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Opera 76+
- ❌ Firefox (requires manifest v2 conversion)
- ❌ Safari (different extension format)

## License

Created by [Ankit Raj](https://ankit-raj.vercel.app/)

## Support

For issues or feature requests, please check:
1. This README file
2. Browser console for error messages
3. Chrome extension developer documentation

---

**Note:** This extension requires Manifest V3 compatibility (Chrome 88+). For older browsers, the manifest would need to be converted to V2 format.