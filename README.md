# GraphQL Inspector Chrome Extension

A Chrome extension to identify and highlight GraphQL requests in the browser's network tab based on user-defined keys.

## Features

- **Basic Chrome Extension Structure**: Complete manifest v3 setup
- **Popup Interface**: User-friendly popup to configure search keys
- **Settings Storage**: Persistent storage of user preferences
- **DevTools Integration**: Custom DevTools panel for GraphQL analysis
- **Network Request Monitoring**: Background script to detect potential GraphQL requests

## Installation (Development Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select this extension directory
4. The GraphQL Inspector extension should now appear in your extensions list

## Current Status

This is a basic "Hello World" implementation with the following working components:

### ✅ Completed
- Extension manifest configuration
- Popup UI with settings management
- Background script for request monitoring
- Content script injection
- DevTools panel setup
- Basic file structure

### 🚧 Next Steps (Future Implementation)
- GraphQL request detection logic
- Network tab request highlighting
- Custom key-based filtering
- Request payload analysis
- Performance metrics
- Visual indicators in DevTools

## Files Structure

```
graphql-inspector/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script for web pages
├── devtools.html         # DevTools integration
├── devtools.js           # DevTools panel setup
├── panel.html            # Custom DevTools panel
├── panel.js              # DevTools panel functionality
├── icons/                # Extension icons (placeholder)
└── README.md            # This file
```

## Usage

1. Click the GraphQL Inspector extension icon in Chrome
2. Configure your search keys (e.g., "query", "mutation", "subscription")
3. Click "Save Settings" to store your preferences
4. Open DevTools to access the GraphQL Inspector panel
5. Navigate to websites that make GraphQL requests

## Development

This extension is built using:
- **Manifest Version**: 3 (latest Chrome extension format)
- **Language**: JavaScript
- **Permissions**: activeTab, storage, webRequest, debugger
- **Architecture**: Service Worker background script

## Notes

- The extension currently logs potential GraphQL requests to the console
- Icons are referenced but not yet created (placeholder)
- Full GraphQL detection and highlighting functionality will be implemented in future iterations
- This is a development-ready foundation for building the complete GraphQL inspection tool
