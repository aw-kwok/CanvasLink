const debug = true;

import * as gcal from "./gcal.js";

/**
 * On install, get user's auth token and use it to create a g-canvas calendar if one does not already exist
 */
chrome.runtime.onInstalled.addListener((details) => {
    // add functionality to make sure this only happens on original install, not every update for production
    if (details.reason === "install") {
        chrome.tabs.create({ url : `../startup.html` });
    }
    

    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }
    
        // might not actually need user info
        gcal.fetchUserInfo(token);

        gcal.getOrCreateCalendar(token);
    });
});

/**
 * Handles response headers to allow cross-origin requests
 * 
 * @param {*} details 
 * @returns headers
 */
function handleHeadersReceived(details) {
    const headers = details.responseHeaders || [];

    headers.push({ name: "Access-Control-Allow-Origin", value: "*" });
    headers.push({
        name: "Access-Control-Allow-Methods",
        value: "GET, POST, PUT, DELETE, OPTIONS",
    });
    headers.push({
        name: "Access-Control-Allow-Headers",
        value: "Content-Type, Authorization",
    });

    if (debug) console.log("handleHeadersReceived executed");

    return { responseHeaders: headers };
}

/**
 * Removes existing webRequest listener if it exists and adds a new listener
 * @param {string} apiUrl 
 */
function setupWebRequestListener(apiUrl) {
    const targetUrlPattern = `${apiUrl}/*`;

    // avoid duplicate by removing existing listener
    chrome.webRequest.onHeadersReceived.removeListener(handleHeadersReceived);
    if (debug) console.log("listener removed");

    // add new listener
    chrome.webRequest.onHeadersReceived.addListener(
        handleHeadersReceived,
        { urls: [targetUrlPattern] },
        ["responseHeaders"]
        // "blocking" was in the above, removed in manifest v2
    );
    if (debug) console.log("added listener");
}

/**
 * Initializes web request listener with the Canvas API URL pattern in sync storage
 */
function initializeListener() {
    if (debug) console.log("listener initialized");

    chrome.storage.sync.get(["CANVAS_API_URL"], (res) => {
        if (res.CANVAS_API_URL) {
          setupWebRequestListener(res.CANVAS_API_URL);
        }
        else {
        console.warn("CANVAS_API_URL is not set in storage");
        }
    });
}


// handles requests from the other js files
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchICS') {
    fetchICS(request.url)
      .then(icsData => {
        const events = parseICS(icsData);
        sendResponse({ events });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true;  // Indicates we want to send a response asynchronously
  }
});




// Initialize listener when the background script starts
initializeListener();

// Handle storage changes to update the listener if the URL pattern changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (debug) console.log("URL pattern changed");
  if (area === "sync" && changes.CANVAS_API_URL) {
    const newUrl = changes.CANVAS_API_URL.newValue;
    if (newUrl) {
      // Reinitialize listener with the new URL
      setupWebRequestListener(newUrl);
    }
  }
});
