const debug = true

//handle response headers
function handleHeadersReceived(details) {
    const headers = details.responseHeaders || [];

    headers.push({ name: "Access-Control-Allow-Origin", value: "*" });
    headers.push({ name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' });
    headers.push({ name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' });

    if (debug) console.log("handleHeadersReceived executed")

    return { responseHeaders: headers }
}

function setupWebRequestListener(apiUrl) {
    const targetUrlPattern = `${apiUrl}`;

    // avoid duplicate by removing existing listener
    chrome.webRequest.onHeadersReceived.removeListener(handleHeadersReceived);
    if (debug) console.log("listener removed")

    // add new listener
    chrome.webRequest.onHeadersReceived.addListener(
        handleHeadersReceived,
        { urls: [targetUrlPattern] },
        ["blocking", "responseHeaders"]
    );
    if (debug) console.log("added listener")
}

// Function to initialize the listener by fetching the URL pattern from sync storage
function initializeListener() {
    if (debug) console.log("listener initialized")

    chrome.storage.sync.get(['CANVAS_API_URL'], (res) => {
      if (res.CANVAS_API_URL) {
        setupWebRequestListener(res.CANVAS_API_URL);
      } else {
        console.warn('CANVAS_API_URL is not set in storage');
      }
    });

    
  }
  
  // Initialize listener when the background script starts
  initializeListener();
  
  // Handle storage changes to update the listener if the URL pattern changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (debug) console.log("URL pattern changed")
    if (area === 'sync' && changes.CANVAS_API_URL) {
      const newUrl = changes.CANVAS_API_URL.newValue;
      if (newUrl) {
        // Reinitialize listener with the new URL
        setupWebRequestListener(newUrl);
      }
    }
});