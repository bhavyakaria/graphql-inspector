document.addEventListener('DOMContentLoaded', function() {
  const searchKeysInput = document.getElementById('searchKeys');
  const saveBtn = document.getElementById('saveBtn');
  const clearBtn = document.getElementById('clearBtn');
  const openDevtoolsBtn = document.getElementById('openDevtools');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  loadSettings();

  // Event listeners
  saveBtn.addEventListener('click', saveSettings);
  clearBtn.addEventListener('click', clearSettings);
  openDevtoolsBtn.addEventListener('click', openDevtools);

  function loadSettings() {
    chrome.storage.sync.get(['searchKeys'], function(result) {
      if (result.searchKeys) {
        searchKeysInput.value = result.searchKeys.join(', ');
      }
    });
  }

  function saveSettings() {
    const keys = searchKeysInput.value
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0);

    chrome.storage.sync.set({
        searchKeys: keys
    }, function() {
      showStatus('Settings saved successfully!', 'success');
      
      // Send message to background script
      chrome.runtime.sendMessage({
          action: 'updateSettings',
          searchKeys: keys
      });
    });
  }

  function clearSettings() {
    searchKeysInput.value = '';
    chrome.storage.sync.clear(function() {
        showStatus('Settings cleared!', 'success');
    });
  }

  function openDevtools() {
    // Show instruction message to user
    showStatus('Open DevTools (F12) and navigate to the "GraphQL Inspector" tab', 'success');
    
    // Close the popup after showing the message
    setTimeout(() => {
      window.close();
    }, 2000);
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
  }
});
