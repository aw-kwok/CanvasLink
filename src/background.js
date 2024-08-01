const debug = true;

/**
 * On install, get user's auth token and use it to create a g-canvas calendar if one does not already exist
 */
chrome.runtime.onInstalled.addListener(() => {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }
    
        // might not actually need user info
        fetchUserInfo(token);

        // temporary calendar id, retrieve from sync storage
        // const calendarId = "b6c580de92a2d8be2217557d5f80d55f6566af2c141000fa4763d25648da650d@group.calendar.google.com";
        const calendarId = "7c4695fb27dc2d085a678989c493f0d33819a8ef24465eb00d3f4e7b5781f3b6@group.calendar.google.com";

        getOrCreateCalendar(token, calendarId);
    });
});

function fetchUserInfo(token) {
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => response.json())
    .then(userInfo => {
        console.log('User Info:', userInfo);
    })
    .catch(error => console.error('Error fetching user info:', error));
}

/**
 * Creates calendar and POSTs to GCal
 * 
 * @param {string} token - Google auth token
 * @param {string} name - Name of the calendar 
 * @param {string} colorHex - Hex code of the desired calendar color
 */
function createCalendar(token, name, colorHex) {
    fetch('https://www.googleapis.com/calendar/v3/calendars', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'summary': name,
            'description': 'imported from g-canvas'
        })
    })
    .then(response => response.json())
    .then(calendar => {
        if (debug) console.log('Calendar Created:', calendar);
        fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?colorRgbFormat=true', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'id': calendar.id,
                'backgroundColor': colorHex,
                'foregroundColor': '#000000',
                'selected': true
            })
        })
        .then(response => response.json())
        .then(calendarList => {
            if (debug) console.log('Calendar list object:', calendarList);
        })
        .catch(err => console.error('Error updating calendarList:', err));
    })
    .catch(error => console.error('Error creating calendar:', error));
}

/**
 * Gets calendar given auth token and calendar ID
 * 
 * @param {string} token - Google auth token
 * @param {string} calendarId - ID of calendar
 */
function getOrCreateCalendar(token, calendarId) {
    if (debug) console.log("In getOrCreateCalendar");
    const defaultName = "g-canvas";
    const defaultColor = "#40E0D0"

    fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}`, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => response.json())
    .then(calendar => {
        if (calendar.error) {
            if (debug) console.log("Calendar not found");
            createCalendar(token, defaultName, defaultColor);
        }
        else {
            if (debug) console.log('Calendar Info:', calendar);
        }
    })
    .catch(error => console.error('Error fetching calendar info:', error));
}

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
