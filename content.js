// Content script for GraphQL Inspector Chrome Extension
console.log('GraphQL Inspector Content Script loaded');

// Listen for messages from popup and background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'ping') {
    // Respond to ping to confirm content script is loaded
    sendResponse({status: 'ready'});
    return true; // Indicate async response
  } else if (request.action === 'openDevtools') {
    // Method 2: Fallback approach - try to trigger DevTools via keyboard shortcut simulation
    console.log('DevTools open request received - attempting to open DevTools');
    
    // Create a temporary element to simulate F12 key press
    const event = new KeyboardEvent('keydown', {
      key: 'F12',
      code: 'F12',
      keyCode: 123,
      which: 123,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false
    });
    
    // Dispatch the event to the document
    document.dispatchEvent(event);
    
    // Alternative: Try Ctrl+Shift+I (or Cmd+Opt+I on Mac)
    setTimeout(() => {
      const altEvent = new KeyboardEvent('keydown', {
        key: 'I',
        code: 'KeyI',
        keyCode: 73,
        which: 73,
        ctrlKey: navigator.platform.indexOf('Mac') === -1,
        metaKey: navigator.platform.indexOf('Mac') !== -1,
        altKey: navigator.platform.indexOf('Mac') !== -1,
        shiftKey: true
      });
      document.dispatchEvent(altEvent);
    }, 100);
    
    sendResponse({success: true});
    return true; // Indicate async response
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
