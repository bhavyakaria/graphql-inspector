// Content script for GraphQL Inspector Chrome Extension
console.log('GraphQL Inspector Content Script loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'openDevtools') {
    // This will be enhanced later to programmatically open DevTools
    console.log('DevTools open request received');
    sendResponse({success: true});
  }
});

// Function to detect GraphQL requests (basic implementation)
function detectGraphQLRequests() {
  // This is a placeholder for future GraphQL detection logic
  console.log('GraphQL detection initialized');
  
  // We'll enhance this later to actually monitor network requests
  // and highlight them in the DevTools network tab
}

// Initialize detection
detectGraphQLRequests();
