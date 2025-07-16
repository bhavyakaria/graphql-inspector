

let panelWindow = null;
let graphqlRequests = [];

function isGraphQLRequest(request) {
  const url = request.request.url.toLowerCase();
  const method = request.request.method;
  if (url.includes('graphql') || url.includes('/gql')) return true;
  if (method === 'POST') {
    const contentType = request.request.headers.find(h => h.name.toLowerCase() === 'content-type');
    if (contentType && contentType.value.includes('application/json')) return true;
  }
  return false;
}

function isGraphQLRequestBody(content) {
  if (!content) return false;
  try {
    const parsed = JSON.parse(content);
    if (parsed.query || parsed.mutation || parsed.subscription) return true;
  } catch (e) {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('query') || contentLower.includes('mutation') || contentLower.includes('subscription')) return true;
  }
  return false;
}

function getOperationType(content) {
  if (!content) return 'Unknown';
  try {
    const parsed = JSON.parse(content);
    if (parsed.query) {
      const query = parsed.query.trim().toLowerCase();
      if (query.startsWith('mutation')) return 'Mutation';
      if (query.startsWith('subscription')) return 'Subscription';
      return 'Query';
    }
  } catch (e) {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('mutation')) return 'Mutation';
    if (contentLower.includes('subscription')) return 'Subscription';
    return 'Query';
  }
  return 'GraphQL';
}

function addGraphQLRequest(request, requestBody) {
  const graphqlRequest = {
    id: Date.now() + Math.random(),
    url: request.request.url,
    method: request.request.method,
    status: request.response.status,
    statusText: request.response.statusText || 'Unknown',
    time: new Date().toISOString(),
    duration: request.time || 0,
    requestBody: requestBody,
    requestHeaders: request.request.headers || [],
    responseHeaders: request.response.headers || [],
    responseBody: '',
    operationType: getOperationType(requestBody)
  };
  
  // Get response content using getContent (this is correct for response)
  if (request.getContent) {
    request.getContent(function(responseContent) {
      graphqlRequest.responseBody = responseContent || '';
      if (panelWindow && panelWindow.updateRequests) {
        panelWindow.updateRequests(graphqlRequests);
      }
    });
  }
  
  graphqlRequests.push(graphqlRequest);
  if (graphqlRequests.length > 100) graphqlRequests.shift();
  if (panelWindow && panelWindow.updateRequests) {
    panelWindow.updateRequests(graphqlRequests);
  }
}

function setupNetworkMonitoring() {
  console.log('📡 Setting up network monitoring...');
  
  chrome.devtools.network.onNavigated.addListener(function(url) {
    console.log('🌐 Navigated to URL:', url);
    console.log('🗑️ Clearing previous GraphQL requests');
    graphqlRequests = [];
    
    // Send navigation event to panel
    if (panelWindow && panelWindow.addNavigationEntry) {
      panelWindow.addNavigationEntry(url);
    }
    
    if (panelWindow && panelWindow.updateRequests) {
      panelWindow.updateRequests(graphqlRequests);
    }
  });
  
  chrome.devtools.network.onRequestFinished.addListener(function(request) {
    console.log('🔍 Network request finished:', request.request.url);
    
    // Send all network requests to panel as network entries
    const networkData = {
      url: request.request.url,
      method: request.request.method,
      status: request.response.status,
      statusText: request.response.statusText || 'Unknown',
      time: new Date().toISOString(),
      duration: request.time || 0,
      requestBody: '',
      requestHeaders: request.request.headers || [],
      responseHeaders: request.response.headers || [],
      responseBody: '',
      type: 'Network',
      operationType: 'Network Request'
    };
    
    // Get request body from request.request.postData
    if (request.request.postData) {
      networkData.requestBody = request.request.postData.text || '';
    }
    
    // Check if it's a GraphQL request
    if (isGraphQLRequest(request)) {
      console.log('✅ GraphQL request detected:', request.request.url);
      networkData.type = 'GraphQL';
      networkData.operationType = getOperationType(networkData.requestBody);
      
      if (isGraphQLRequestBody(networkData.requestBody)) {
        console.log('📝 GraphQL request body confirmed, adding to list');
        addGraphQLRequest(request, networkData.requestBody);
      }
    }
    
    // Get response content
    if (request.getContent) {
      request.getContent(function(responseContent) {
        networkData.responseBody = responseContent || '';
        
        // Send to panel
        if (panelWindow && panelWindow.addNetworkEntry) {
          panelWindow.addNetworkEntry(networkData);
        }
      });
    } else {
      // Send to panel without response content
      if (panelWindow && panelWindow.addNetworkEntry) {
        panelWindow.addNetworkEntry(networkData);
      }
    }
  });
  
  console.log('✅ Network monitoring setup complete');
}

function logToPanel(message, type = 'info') {
  // This function is no longer needed as we're sending network details
  // Keeping it for backwards compatibility
  console.log(message);
}

function createPanel() {
  chrome.devtools.panels.create(
    'GraphQL Inspector',
    null,
    'panel.html',
    function(panel) {
      panel.onShown.addListener(function(window) {
        panelWindow = window;
        if (panelWindow) {
          panelWindow.clearGraphQLRequests = function() {
            graphqlRequests = [];
            if (panelWindow.updateRequests) panelWindow.updateRequests(graphqlRequests);
          };
          panelWindow.refreshGraphQLRequests = function() {
            if (panelWindow.updateRequests) panelWindow.updateRequests(graphqlRequests);
          };
          panelWindow.getGraphQLRequests = function() {
            return graphqlRequests;
          };
          panelWindow.injectTestData = function() {
            const testRequest = {
              id: Date.now() + Math.random(),
              url: 'https://api.example.com/graphql',
              method: 'POST',
              status: 200,
              statusText: 'OK',
              time: new Date().toISOString(),
              duration: 125,
              requestBody: '{"query":"query GetUser($id: ID!) { user(id: $id) { id name email } }","variables":{"id":"123"}}',
              requestHeaders: [
                { name: 'Content-Type', value: 'application/json' },
                { name: 'Authorization', value: 'Bearer sample-token' }
              ],
              responseHeaders: [
                { name: 'Content-Type', value: 'application/json' },
                { name: 'Server', value: 'nginx/1.18.0' }
              ],
              responseBody: '{"data":{"user":{"id":"123","name":"John Doe","email":"john@example.com"}}}',
              operationType: 'Query'
            };
            
            graphqlRequests.push(testRequest);
            if (graphqlRequests.length > 100) graphqlRequests.shift();
            if (panelWindow && panelWindow.updateRequests) {
              panelWindow.updateRequests(graphqlRequests);
            }
          };
        }
        if (panelWindow && panelWindow.updateRequests) {
          panelWindow.updateRequests(graphqlRequests);
        }
      });
      panel.onHidden.addListener(function() {
        panelWindow = null;
      });
    }
  );
}

if (chrome.devtools && chrome.devtools.network) {
  const initMessage = '🚀 GraphQL Inspector DevTools script loaded';
  console.log(initMessage);
  console.log('📊 Chrome DevTools APIs available');
  setupNetworkMonitoring();
  createPanel();
} else {
  console.error('❌ Chrome DevTools APIs not available');
}
