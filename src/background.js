const debug = true;

//handle response headers
function handleHeadersReceived(details) {
  /*
    Handles response headers to allow cross-origin requests

    Parameters
    ------
    
    Returns
    ------

  */
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
    } else {
      console.warn("CANVAS_API_URL is not set in storage");
    }
  });
}

// /**
//  * Fetches ICS calendar data from an ICS link
//  * 
//  * @param {string} url - .ics url
//  * @returns {string} icsData - 
//  */
// async function fetchICS(url) {
//     /*
//         Fetches ICS calendar data from an ICS link

//         Parameters
//         ------
        
//         Returns
//         ------
//         String
//         ICS calendar data
//     */
//     try {
//         const response = await fetch(url);
//         if (!response.ok) throw new Error('Network response was not ok.');
//         const icsData = await response.text();
//         return icsData;
//     } catch (error) {
//         console.error('Fetching ICS file failed:', error);
//     }
// }

// /**
//  * Parses ICS data from text, creating an array of event objects
//  * 
//  * @param {string} icsData - ICS calendar data
//  * @returns {Array.<Object>} events - Event object array
//  */
// function parseICS(icsData) {
//     const events = [];
//     // Basic parsing logic for ICS file
//     const regex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
//     const eventBlocks = icsData.match(regex);

//     eventBlocks.forEach(eventBlock => {
//         const event = {};
//         event.summary = eventBlock.match(/SUMMARY:(.*)/)?.[1];
//         event.dtstart = eventBlock.match(/DTSTART.*:(.*)/)?.[1];
//         event.dtend = eventBlock.match(/DTEND.*:(.*)/)?.[1];
//         events.push(event);
//     });

//     return events;
// }


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
