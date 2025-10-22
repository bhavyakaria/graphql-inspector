// Panel script for GraphQL Inspector DevTools panel
console.log('GraphQL Inspector Panel Script loaded');

let currentRequests = [];
let selectedRequest = null;
let filteredRequests = [];

// DOM elements
// const requestsContainer = document.getElementById('requestsContainer');
// const emptyState = document.getElementById('emptyState');
const urlFilter = document.getElementById('urlFilter');
const statusFilter = document.getElementById('statusFilter');
const requestCount = document.getElementById('requestCount');
const detailsPanel = document.getElementById('detailsPanel');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const detailsContent = document.getElementById('detailsContent');
const networkLogs = document.getElementById('networkLogs');
const clearLogsBtn = document.getElementById('clearLogsBtn');

let networkLogEntries = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('GraphQL Inspector panel loaded and ready');
  
  // Event listeners
  urlFilter.addEventListener('input', filterRequests);
  statusFilter.addEventListener('change', filterRequests);
  closeDetailsBtn.addEventListener('click', closeDetails);
  clearLogsBtn.addEventListener('click', clearNetworkLogs);
  
  // Initialize network logs
  updateNetworkLogs();
  
  // Initialize display
  updateDisplay();
  
  // Try to load existing requests from devtools global function
  if (window.getGraphQLRequests) {
    currentRequests = window.getGraphQLRequests();
    filterRequests();
  }
});

// Function to update requests (called from devtools.js)
window.updateRequests = function(requests) {
  currentRequests = requests;
  filterRequests();
};

// Filter requests based on current filter settings
function filterRequests() {
  const urlFilterValue = urlFilter.value.toLowerCase();
  const statusFilterValue = statusFilter.value;
  
  filteredRequests = currentRequests.filter(request => {
    // URL filter
    if (urlFilterValue && !request.url.toLowerCase().includes(urlFilterValue)) {
      return false;
    }
    
    // Status filter
    if (statusFilterValue) {
      const statusGroup = Math.floor(request.status / 100);
      if (statusGroup.toString() !== statusFilterValue) {
        return false;
      }
    }
    
    return true;
  });
  
  updateDisplay();
}

// Update the display
function updateDisplay() {
  requestCount.textContent = filteredRequests.length;
  
  // Always hide the empty state in the main container and use network logs instead
  // emptyState.style.display = 'none';
  // requestsContainer.innerHTML = '';
  
  // Update network logs with all requests (both from currentRequests and networkLogEntries)
  updateNetworkLogs();
}

// Render requests list
function renderRequests() {
  // requestsContainer.innerHTML = '';
  
  // filteredRequests.forEach(request => {
  //     const requestElement = createRequestElement(request);
  //     requestsContainer.appendChild(requestElement);
  // });
}

// Create a request element
function createRequestElement(request) {
  const div = document.createElement('div');
  div.className = 'request-item';
  div.onclick = () => selectRequest(request);
  
  const statusClass = request.status >= 200 && request.status < 300 ? 'status-success' : 'status-error';
  
  // Extract endpoint and functionKey for requests (same logic as network logs)
  const endpoint = extractEndpointFromPayload(request.requestBody);
  const functionKey = extractFunctionKeyFromPayload(request.requestBody);
  const displayUrl = endpoint ? endpoint : request.url;
  const urlWithFunctionKey = functionKey ? `${displayUrl} [${functionKey}]` : displayUrl;
  
  div.innerHTML = `
      <div class="request-header">
          <span class="request-method">${request.method}</span>
          <span class="request-url">${urlWithFunctionKey}</span>
          <span class="request-status ${statusClass}">${request.status} ${request.statusText}</span>
      </div>
      <div class="request-details">
          <span>Time: ${new Date(request.time).toLocaleTimeString()}</span>
          <span>Duration: ${Math.round(request.duration)}ms</span>
          <span>Type: ${getRequestType(request)}</span>
      </div>
  `;
  
  return div;
}

// Determine request type based on content
function getRequestType(request) {
  // Use the operationType if available from devtools
  if (request.operationType) {
    return request.operationType;
  }
  
  // Fallback to checking request body
  if (request.requestBody) {
    try {
      const parsed = JSON.parse(request.requestBody);
      if (parsed.operationName) {
          return parsed.operationName;
      }
      
      const body = request.requestBody.toLowerCase();
      if (body.includes('mutation')) return 'Mutation';
      if (body.includes('subscription')) return 'Subscription';
      if (body.includes('query')) return 'Query';
    } catch (e) {
      const body = request.requestBody.toLowerCase();
      if (body.includes('mutation')) return 'Mutation';
      if (body.includes('subscription')) return 'Subscription';
      if (body.includes('query')) return 'Query';
    }
  }
  return 'GraphQL';
}

// Select a request and show details
function selectRequest(request) {
  selectedRequest = request;
  
  // Update UI
  document.querySelectorAll('.request-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  // Find and select the clicked item
  const requestItems = Array.from(document.querySelectorAll('.request-item'));
  const selectedIndex = filteredRequests.indexOf(request);
  if (selectedIndex >= 0 && requestItems[selectedIndex]) {
    requestItems[selectedIndex].classList.add('selected');
  }
  
  showRequestDetails(request);
}

// Show request details panel
function showRequestDetails(request) {
  detailsContent.innerHTML = generateRequestDetailsHTML(request);
  detailsPanel.style.display = 'block';
  // requestsContainer.style.width = '50%';
}

// Generate HTML for request details
function generateRequestDetailsHTML(request) {
  const requestBody = formatJSON(request.requestBody);
  const requestPayload = formatPayloadOnly(request.requestBody);
  const responseBody = formatJSON(request.responseBody);
  
  return `
    <div class="section-title">Request Information</div>
    <div class="code-block">
      <strong>URL:</strong> ${request.url}<br>
      <strong>Method:</strong> ${request.method}<br>
      <strong>Status:</strong> ${request.status} ${request.statusText}<br>
      <strong>Time:</strong> ${new Date(request.time).toLocaleString()}<br>
      <strong>Duration:</strong> ${Math.round(request.duration)}ms
    </div>
    
    <div class="section-title">Request Headers</div>
    <div class="code-block">
      ${formatHeaders(request.requestHeaders)}
    </div>
    
    <div class="section-title">Request Payload</div>
    <div class="code-block">
      ${requestPayload}
    </div>
    
    <div class="section-title">Full Request Body</div>
    <div class="code-block">
      ${requestBody}
    </div>
    
    <div class="section-title">Response Headers</div>
    <div class="code-block">
      ${formatHeaders(request.responseHeaders)}
    </div>
    
    <div class="section-title">Response Body</div>
    <div class="code-block">
      ${responseBody}
    </div>
  `;
}

// Format JSON for display
function formatJSON(jsonString) {
  if (!jsonString) return 'No content';
  
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return jsonString;
  }
}

// Extract endpoint from fetchAPI payload
function extractEndpointFromPayload(jsonString) {
  if (!jsonString) return null;
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // Try to extract payload from various possible paths
    let payload = null;
    
    // Check for payload in variables.input.payload (common pattern)
    if (parsed.variables && parsed.variables.input && parsed.variables.input.payload) {
      payload = parsed.variables.input.payload;
    }
    // Check for payload directly in variables.payload
    else if (parsed.variables && parsed.variables.payload) {
      payload = parsed.variables.payload;
    }
    // Check for payload in root level
    else if (parsed.payload) {
      payload = parsed.payload;
    }
    
    if (payload && payload.call && payload.call.functionKey === 'fetchAPI') {
      // Extract endpoint from payload.call.payload.endpoint
      if (payload.call.payload && payload.call.payload.endpoint) {
        return payload.call.payload.endpoint;
      }
    }
    // Also check if functionKey is directly in payload
    else if (payload && payload.functionKey === 'fetchAPI') {
      if (payload.payload && payload.payload.endpoint) {
        return payload.payload.endpoint;
      }
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Extract functionKey from payload
function extractFunctionKeyFromPayload(jsonString) {
  if (!jsonString) return null;
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // Try to extract payload from various possible paths
    let payload = null;
    
    // Check for payload in variables.input.payload (common pattern)
    if (parsed.variables && parsed.variables.input && parsed.variables.input.payload) {
      payload = parsed.variables.input.payload;
    }
    // Check for payload directly in variables.payload
    else if (parsed.variables && parsed.variables.payload) {
      payload = parsed.variables.payload;
    }
    // Check for payload in root level
    else if (parsed.payload) {
      payload = parsed.payload;
    }
    
    if (payload && payload.call && payload.call.functionKey) {
      return payload.call.functionKey;
    }
    // Also check if functionKey is directly in payload
    else if (payload && payload.functionKey) {
      return payload.functionKey;
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Extract and format only the payload from GraphQL request body
function formatPayloadOnly(jsonString) {
  if (!jsonString) return 'No payload found';
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // Try to extract payload from various possible paths
    let payload = null;
    
    // Check for payload in variables.input.payload (common pattern)
    if (parsed.variables && parsed.variables.input && parsed.variables.input.payload) {
      payload = parsed.variables.input.payload;
    }
    // Check for payload directly in variables.payload
    else if (parsed.variables && parsed.variables.payload) {
      payload = parsed.variables.payload;
    }
    // Check for payload in root level
    else if (parsed.payload) {
      payload = parsed.payload;
    }
    
    if (payload) {
      // Extract only functionKey and payload from the call object
      if (payload.call && payload.call.functionKey) {
        const simplifiedPayload = {
          functionKey: payload.call.functionKey,
          payload: payload.call.payload || {}
        };
        return JSON.stringify(simplifiedPayload, null, 2);
      }
      // If no call object, try to extract functionKey directly
      else if (payload.functionKey) {
        const simplifiedPayload = {
          functionKey: payload.functionKey,
          payload: payload.payload || {}
        };
        return JSON.stringify(simplifiedPayload, null, 2);
      }
      // If no functionKey found, return the full payload
      else {
        return JSON.stringify(payload, null, 2);
      }
    } else {
      return 'No payload found in request body';
    }
  } catch (e) {
    return jsonString;
  }
}

// Format headers for display
function formatHeaders(headers) {
  if (!headers || !Array.isArray(headers)) return 'No headers';
  
  return headers.map(header => `${header.name}: ${header.value}`).join('<br>');
}

// Close details panel
function closeDetails() {
  detailsPanel.style.display = 'none';
  // requestsContainer.style.width = '100%';
  selectedRequest = null;
  
  // Remove selection from both request items and network entries
  document.querySelectorAll('.request-item').forEach(item => {
    item.classList.remove('selected');
  });
  document.querySelectorAll('.network-entry').forEach(item => {
    item.classList.remove('selected');
  });
}

// Clear all requests
function clearRequests() {
  // Clear local requests immediately
  currentRequests = [];
  filteredRequests = [];
  updateDisplay();
  closeDetails();
  
  // Call the global function provided by devtools
  if (window.clearGraphQLRequests) {
    window.clearGraphQLRequests();
  }
}

// Refresh requests
function refreshRequests() {
  // Call the global function provided by devtools
  if (window.refreshGraphQLRequests) {
    window.refreshGraphQLRequests();
  }
}

// Inject test data
function injectTestData() {
  console.log('Injecting test data from panel...');
  
  // Call the global function provided by devtools, but avoid recursion
  if (window.injectTestData && window.injectTestData !== injectTestData) {
    window.injectTestData();
  } else {
    // Fallback: create test data directly
    const testRequest = {
      id: Date.now() + Math.random(),
      url: 'https://example.com/graphql',
      method: 'POST',
      status: 200,
      statusText: 'OK',
      time: new Date().toISOString(),
      duration: 150,
      requestBody: '{"query":"query { user { id name } }","variables":{}}',
      requestHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Authorization', value: 'Bearer token123' }
      ],
      responseHeaders: [
        { name: 'Content-Type', value: 'application/json' }
      ],
      responseBody: '{"data":{"user":{"id":"1","name":"Test User"}}}',
      encoding: 'utf8',
      operationType: 'Query'
    };
    
    currentRequests.push(testRequest);
    filterRequests();
  }
}

// Network logging functions
function addNetworkEntry(networkData) {
  const networkEntry = {
    id: Date.now() + Math.random(),
    url: networkData.url || 'Unknown URL',
    method: networkData.method || 'GET',
    status: networkData.status || 200,
    statusText: networkData.statusText || 'OK',
    time: networkData.time || new Date().toISOString(),
    duration: networkData.duration || 0,
    requestBody: networkData.requestBody || '',
    requestHeaders: networkData.requestHeaders || [],
    responseHeaders: networkData.responseHeaders || [],
    responseBody: networkData.responseBody || '',
    type: networkData.type || 'Network',
    operationType: networkData.operationType || ''
  };
    
  networkLogEntries.push(networkEntry);
  
  // Keep only last 50 network entries
  if (networkLogEntries.length > 50) {
    networkLogEntries.shift();
  }
    
  updateNetworkLogs();
}

function updateNetworkLogs() {
  if (!networkLogs) return;
  networkLogs.innerHTML = '';

  // Combine filtered requests and network entries, remove duplicates
  const allEntries = [...filteredRequests, ...networkLogEntries.filter(entry => entry.type === 'GraphQL')];
  
  // Remove duplicates based on URL and time
  const uniqueEntries = allEntries.filter((entry, index, self) => 
    index === self.findIndex(e => e.url === entry.url && e.time === entry.time)
  );

  if (uniqueEntries.length === 0) {
    networkLogs.innerHTML = `
      <div class="network-entry">
        <div class="network-header">
          <span class="network-method">POST</span>
          <span class="network-url">Waiting for GraphQL requests...</span>
          <span class="network-status status-success">--</span>
        </div>
        <div class="network-details">
          <span>Time: --</span>
          <span>Duration: --</span>
          <span>Type: --</span>
        </div>
      </div>
    `;
    return;
  }

  // Sort by time (newest first)
  uniqueEntries.sort((a, b) => new Date(b.time) - new Date(a.time));

  // Only add the updated URL network logs
  uniqueEntries.forEach(entry => {
    const networkDiv = document.createElement('div');
    networkDiv.className = 'network-entry';
    networkDiv.onclick = () => toggleNetworkDetails(entry.id, networkDiv);

    const statusClass = entry.status >= 200 && entry.status < 300 ? 'status-success' : 'status-error';
    const displayType = entry.operationType || entry.type || getRequestType(entry);

    // Extract endpoint and functionKey for requests
    const endpoint = extractEndpointFromPayload(entry.requestBody);
    const functionKey = extractFunctionKeyFromPayload(entry.requestBody);
    const displayUrl = endpoint ? endpoint : entry.url;
    const urlWithFunctionKey = functionKey ? `${displayUrl} [${functionKey}]` : displayUrl;

    networkDiv.innerHTML = `
      <div class="network-header">
        <span class="network-method">${entry.method}</span>
        <span class="network-url">${urlWithFunctionKey}</span>
        <span class="network-status ${statusClass}">${entry.status} ${entry.statusText}</span>
      </div>
      <div class="network-details">
        <span>Time: ${new Date(entry.time).toLocaleTimeString()}</span>
        <span>Duration: ${Math.round(entry.duration)}ms</span>
        <span>Type: ${displayType}</span>
      </div>
    `;

    networkLogs.appendChild(networkDiv);
  });

  // Auto-scroll to bottom
  networkLogs.scrollTop = networkLogs.scrollHeight;
}

function toggleNetworkDetails(entryId, networkDiv) {
  const entry = networkLogEntries.find(e => e.id === entryId);
  if (!entry) return;
  
  // Only show GraphQL requests in the details panel
  if (entry.type === 'GraphQL') {
    // Convert network entry to GraphQL request format for details panel
    const graphqlRequest = {
      id: entry.id,
      url: entry.url,
      method: entry.method,
      status: entry.status,
      statusText: entry.statusText,
      time: entry.time,
      duration: entry.duration,
      requestBody: entry.requestBody,
      requestHeaders: entry.requestHeaders,
      responseHeaders: entry.responseHeaders,
      responseBody: entry.responseBody,
      operationType: entry.operationType
    };
    
    showRequestDetails(graphqlRequest);
    
    // Update selection state for network entries
    document.querySelectorAll('.network-entry').forEach(item => {
      item.classList.remove('selected');
    });
    networkDiv.classList.add('selected');
  }
}

function formatNetworkHeaders(headers) {
  if (!headers || !Array.isArray(headers)) return 'No headers';
  
  return headers.map(header => `${header.name}: ${header.value}`).join('\n');
}

function formatNetworkJSON(jsonString) {
  if (!jsonString) return 'No content';
  
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return jsonString;
  }
}

function clearNetworkLogs() {
  // Clear both network entries and current requests since we're using one component
  networkLogEntries = [];
  currentRequests = [];
  filteredRequests = [];
  updateDisplay();
  closeDetails();
}

// Function to be called from devtools.js to add network entries
window.addNetworkEntry = addNetworkEntry;

// Function to add navigation events
function addNavigationEntry(url) {
  const navigationEntry = {
    id: Date.now() + Math.random(),
    url: url,
    method: 'NAVIGATE',
    status: 200,
    statusText: 'Navigated',
    time: new Date().toISOString(),
    duration: 0,
    requestBody: '',
    requestHeaders: [],
    responseHeaders: [],
    responseBody: '',
    type: 'Navigation',
    operationType: 'Navigation'
  };
  
  addNetworkEntry(navigationEntry);
}

window.addNavigationEntry = addNavigationEntry;
