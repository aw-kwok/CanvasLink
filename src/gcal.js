const debug = true;

/**
 * Fetches user info with a Google auth token
 * 
 * @param {string} token 
 */
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
 * @async
 * @param {string} token - Google auth token
 * @param {string} name - Name of the calendar 
 * @param {string} colorHex - Hex code of the desired calendar color
 * @returns {Object} calendar - Calendar object
 */
async function createCalendar(token, name, colorHex) {
    try {
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
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
    
        const calendar = await res.json();
    
        if (debug) console.log('Calendar Created:', calendar);
    
        const calendarListRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?colorRgbFormat=true', {
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
    
        const calendarListObject = await calendarListRes.json();
        
        if (debug) console.log('Calendar list object:', calendarListObject);
    
        return calendar;
    }
    catch (error) {
         console.error('Error creating calendar:', error)
    }
}

/**
 * Gets calendar given auth token and calendar ID
 * 
 * @async
 * @param {string} token - Google auth token
 */
async function getOrCreateCalendar(token) {
    try {
        if (debug) console.log("In getOrCreateCalendar");

        const defaultName = "g-canvas";
        const defaultColor = "#40E0D0"
    
        const res = await chrome.storage.sync.get(["CALENDAR_ID"]);
    
        if (debug) console.log(res.CALENDAR_ID);
    
        if (res.CALENDAR_ID == null) {
            const newCalendar = await createCalendar(token, defaultName, defaultColor);
            if (debug) console.log(newCalendar);
            await chrome.storage.sync.set({ CALENDAR_ID: newCalendar.id });
        }
        else {
            const getResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${res.CALENDAR_ID}`, {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
    
            const calendar = await getResponse.json();
            if (calendar.error) {
                if (debug) console.log("Calendar not found");
                const newCalendar = await createCalendar(token, defaultName, defaultColor);
                if (debug) console.log(newCalendar);
                await chrome.storage.sync.set({ CALENDAR_ID: newCalendar.id });
            }
            else {
                if (debug) console.log('Calendar Info:', calendar);
            }
        }
    }
    catch (err) {
        console.error("Error handling calendar", err);    
    }
}

export { fetchUserInfo, createCalendar, getOrCreateCalendar };