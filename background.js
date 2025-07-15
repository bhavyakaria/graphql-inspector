// Background script for GraphQL Inspector Chrome Extension
console.log('GraphQL Inspector Background Script loaded');

let searchKeys = [];

// Initialize extension
chrome.runtime.onInstalled.addListener(function() {
  console.log('GraphQL Inspector installed');
  
  // Load saved settings
  chrome.storage.sync.get(['searchKeys'], function(result) {
    if (result.searchKeys) {
      searchKeys = result.searchKeys;
      console.log('Loaded search keys:', searchKeys);
    }
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateSettings') {
    searchKeys = request.searchKeys;
    console.log('Updated search keys:', searchKeys);
    sendResponse({success: true});
  }
});

// Listen for tab updates to inject content script
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    // Inject content script into the page
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(err => {
      // Ignore errors for pages where we can't inject scripts
      console.log('Could not inject content script:', err);
    });
  }
});

// Handle web request monitoring (for future GraphQL detection)
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    // This will be used later to detect GraphQL requests
    console.log('Request detected:', details.url);
    
    // Check if this might be a GraphQL request
    if (details.requestBody && details.requestBody.raw) {
      try {
        const decoder = new TextDecoder();
        const bodyText = decoder.decode(details.requestBody.raw[0].bytes);
        
        // Basic check for GraphQL-like content
        if (bodyText.includes('query') || bodyText.includes('mutation') || bodyText.includes('subscription')) {
            console.log('Potential GraphQL request detected:', details.url);
            console.log('Request body:', bodyText);
        }
      } catch (e) {
          // Ignore decoding errors
      }
    }
      
    return {};
  },
  {
      urls: ["<all_urls>"]
  },
  ["requestBody"]
);
