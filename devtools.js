// DevTools script for GraphQL Inspector Chrome Extension
console.log('GraphQL Inspector DevTools Script loaded');

// This script will be enhanced later to:
// 1. Access the Network tab
// 2. Monitor network requests
// 3. Highlight GraphQL requests based on user-defined keys
// 4. Provide filtering capabilities

// Create a panel for the GraphQL Inspector
chrome.devtools.panels.create(
  'GraphQL Inspector',
  'icons/icon16.png',
  'panel.html',
  function(panel) {
    console.log('GraphQL Inspector panel created');
  }
);
