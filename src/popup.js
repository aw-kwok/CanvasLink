import ICAL from "ical.js";

import * as gcal from "./gcal.js";

const debug = true;

if (debug) console.log("popup.js commenced")

document.addEventListener("DOMContentLoaded", () => {
    if (debug) console.log("DOM content loaded");

    const apiUrlInput = document.getElementById("canvasApiUrl");
    const apiKeyInput = document.getElementById("canvasApiKey");
    const semesterInput = document.getElementById("semester");
    const saveSettingsButton = document.getElementById("saveSettings");
    const getCoursesButton = document.getElementById("getCourses");
    const buildCoursesButton = document.getElementById("buildCourses");
    const loadCourseInputsButton = document.getElementById("loadCourseInputs");
    const loadCanvasEventsButton = document.getElementById("loadCanvasEvents");
    const syncEventsButton = document.getElementById("syncEvents");
    // const getCanvasCalendarsButton = document.getElementById("getCanvasCalendars");

    // google calendar event colors - 1-indexed
    // this has to be a parallel array because i don't want to break the rest of my code lol
    const colorMap = [null, "#7986CB", "#33B679", "#8E24AA", "#E67C73", "#F6BF26", "#F4511E", "#039BE5", "#616161", "#3F51B5", "#0B8043", "#D50000"];
    const colorHoverTexts = ["Calendar", "Lavendar", "Sage", "Grape", "Flamingo", "Banana", "Tangerine", "Peacock", "Graphite", "Blueberry", "Basil", "Tomato"]


    //load saved settings
    chrome.storage.sync.get(["CANVAS_API_URL", "CANVAS_API_KEY", "SEMESTER"])
    .then((res) => {
        if (debug) console.log(res);
        if (res.CANVAS_API_URL) {
            apiUrlInput.value = res.CANVAS_API_URL;
        }
        if (res.CANVAS_API_KEY) {
            apiKeyInput.value = res.CANVAS_API_KEY;
        }
        if (res.SEMESTER) {
            semesterInput.value = res.SEMESTER;
        }

    })
    .catch((err) => {
        console.log(err)
    });


    // button handlers
    saveSettingsButton.addEventListener("click", () => {
        saveSettings();
    })

    getCoursesButton.addEventListener("click", () => {
        saveSettings();
        getCourses();
    })

    buildCoursesButton.addEventListener("click", async () => {
        const courses = await buildCourses();
        chrome.storage.sync.set({ COURSES: courses });
    })
    loadCourseInputsButton.addEventListener("click", () => {
        loadCourseBoxes();
    })
    loadCanvasEventsButton.addEventListener("click", async () => {
        const events = await loadCanvasEvents();
        console.log(events);
    })
    syncEventsButton.addEventListener("click", async () => {
        syncEvents();
    })


    async function syncEvents() {
        try {
            if (debug) console.log("in syncEvents");
            const events = await loadCanvasEvents();
            chrome.identity.getAuthToken({ interactive: true }, async function(token) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    return;
                }
                const calendar = await gcal.getOrCreateCalendar(token);
                const calendarId = calendar.id;

                // concurrent for efficiency
                const eventPromises = events.map(async (event) => {
                    const eventId = event.iCalUID;

                    let url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?iCalUID=${eventId}`
                    // need to use events.list in gcal api because passing iCal id
                    const res = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    })

                    if (debug) console.log(res.status);

                    if (res.status === 404) {
                        // if doesn't exist, POST
                        url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
                        await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + token
                            },
                            body: JSON.stringify(event)
                        })
                    }
                    else {
                        // if exists, PUT
                        const existingEvent = await res.json();
                        url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${existingEvent.items[0].id}`
                        await fetch(url, {
                            method: 'PUT',
                            headers: {
                                'Authorization': 'Bearer ' + token
                            },
                            body: JSON.stringify(event)
                        })
                    }

                })
                await Promise.all(eventPromises);
            });
        }
        catch (error) {
            console.error("Unable to sync events:", error); 
        }
    }


    // might have to move this to background.js so that content.js can refresh calendars on calendar.google.com
    /**
     * Loads Canvas events saved in chrome.storage.sync
     * 
     * @async
     * @returns {Array.<Object>} eventObjects - Array of parsed event objects
     */
    async function loadCanvasEvents() {
        try {
            const { COURSES } = await chrome.storage.sync.get(["COURSES"]);
            const courses = COURSES;
            if (debug) console.log(courses);

            const coursePromises = courses.map(async(course) => {
                const url = course.calendar;

                if (debug) console.log(`${course.name}`);
                if (debug) console.log(`url: ${url}`);

                try {
                    const res = await fetch(url,
                        {
                            method: 'GET'
                        }
                    );
                    if (!res.ok) throw new Error(`Failed to fetch ICS`);
                    console.log(res);
                    const icsText = await res.text();
                    console.log(`ICS text: ${icsText}`);
                    const jcalData = ICAL.parse(icsText); //jcal object
                    const comp = new ICAL.Component(jcalData); //component
                    console.log(comp.toJSON());
                    const events = comp.getAllSubcomponents("vevent");
                    if (debug) console.log(events);

                    const createdEvents = events.map(event => {
                        const eventObject = {
                            "summary": event.getFirstPropertyValue("summary"),
                            "colorId": course.color,
                            "start": {},
                            "end": {},
                            "transparency": "transparent",
                            "iCalUID": event.getFirstPropertyValue("uid"),
                            "source": {
                                "title": course.name,
                                "url": event.getFirstPropertyValue("url")
                            }
                        }
                        if (debug) console.log(eventObject.summary);

                        // if date, event.getFirstPropertyValue("dtstart")
                        // dtstart is in UTC
                        const dtstart = event.getFirstPropertyValue("dtstart");
                        const dtend = event.getFirstPropertyValue("dtend");

                        if (debug) console.log(`dtstart: ${dtstart}, dtend: ${dtend}`);

                        const startTime = dtstart._time;
                        const endTime = (dtend == null) ? startTime: dtend._time; // if no end time, set end to start

                        // if isDate, then event is all-day
                        // months in Date constructor are 0-indexed
                        if (startTime.isDate) {
                            const start = new Date(startTime.year, startTime.month - 1, startTime.day);
                            const end = new Date(endTime.year, endTime.month - 1, endTime.day);

                            // dates must be in yyyy-mm-dd, so truncate the ISO string
                            eventObject.start = { "date": start.toISOString().substring(0, 10) };
                            eventObject.end = { "date": end.toISOString().substring(0, 10) }
                        }
                        else {
                            const start = new Date(startTime.year, startTime.month - 1, startTime.day, startTime.hour, startTime.minute, startTime.second);
                            const end = new Date(endTime.year, endTime.month - 1, endTime.day, endTime.hour, endTime.minute, endTime.second);

                            eventObject.start = { "dateTime": start.toISOString() };
                            eventObject.end = { "dateTime": end.toISOString() }
                        }
                        if (debug) console.log(eventObject);
                        return eventObject;
                    })

                    if (debug) console.log(`Events in calendar ${course.name}: ${createdEvents}`);
                    return createdEvents;
                }
                catch (err) {
                    console.error("Error", err);
                    return [];
                }
            })

            const allCreatedEvents = await Promise.all(coursePromises);
            const eventArray = allCreatedEvents.flat();
            if (debug) console.log(`Event array: ${eventArray}`);
            return eventArray;
        }
        catch (err) {
            console.error("Error loading courses from storage:", err);
        }
        
    }

    /**
     * Builds objects with a course's name, color, and calendar
     * 
     * @returns {Array.<Object>} courseObjects - Array of course objects with name, color, and calendar
     */
    async function buildCourses() {
        if (debug) console.log("building courses");

        try {
            const courses = await getCourses();
            if (debug) console.log(courses);

            const coursePromises = courses.map(async (course, index) => {

                const { name, calendar, id } = course;
                // add color customizer
                // colors are 1-indexed
                const color = index + 1;
                const courseObject = {
                    "name": name,
                    "color": color,
                    "calendar": calendar.ics,
                    "id": id
                }
                if (debug) console.log(courseObject);
                return courseObject;
            })
            const courseObjects = await Promise.all(coursePromises);
            if (debug) console.log(courseObjects);
            return courseObjects;
        }
        catch (err) {
            console.error("Error building courses:", err)
        }
        
    }

    /**
     * Saves current user inputs provided by the input fields in the extension popup to chrome.storage.sync
     * 
     * @returns {Object} settings - Saved settings
     */
    async function saveSettings() {
        try {
            const url = `${apiUrlInput.value}/api/v1/users/self`;
            const res = await fetch(url, { 
                method: "GET",
                headers: { "Authorization": `Bearer ${apiKeyInput.value}` }
            })

            const user = await res.json();
            const userId = user.id;

            const settings = {
                CANVAS_API_URL: apiUrlInput.value,
                CANVAS_API_KEY: apiKeyInput.value,
                USER_ID: userId,
                SEMESTER: semesterInput.value
            }

            chrome.storage.sync.set(settings);
            if (debug) console.log("Settings saved");
            return settings;
        }
        catch (err) {
            console.error("Unable to save user settings:", err)
        }
        
        
    }


    // https://developer.chrome.com/docs/extensions/develop/concepts/network-requests - CORS information
    // also handles parsing the courses 
    // returns an array of course objects

    /**
     * Sends GET request to Canvas API to fetch user courses based on API_URL, API_KEY, USER_ID, and SEMESTER in chrome.storage.sync
     * 
     * @returns {Array.<Object>} courseList - Array of course objects
     */
    async function getCourses() {
        try {

            const settings = await saveSettings();

            if (debug) console.log(settings);

            const apiUrl = settings.CANVAS_API_URL;
            const apiKey = settings.CANVAS_API_KEY;
            const userId = settings.USER_ID;
            const semester = settings.SEMESTER;

            if (debug) console.log(`Api URL: ${apiUrl}`);
            if (debug) console.log(`Api Key: ${apiKey}`);
            if (debug) console.log(`User ID: ${userId}`);
            if (debug) console.log(`Semester: ${semester}`);


            let page = 1;
            let moreData = true;
            let courseList = [];

            while (moreData == true) {
                const params = new URLSearchParams({
                    "include[]": ["term"],
                    "page": page
                }).toString();

                const url = `${apiUrl}/api/v1/users/${userId}/courses?${params}`
                if (debug) console.log(url);

                const res = await fetch(url, { 
                    method: "GET",
                    headers: { "Authorization": `Bearer ${apiKey}` }
                })

                if (res.ok) {
                    if (debug) console.log("Courses fetched");
                    const courses = await res.json();
                    if (courses.length === 0) {
                        moreData = false;
                    }
                    else {
                        for (let i = 0; i < courses.length; i++) {
                            // if (debug) console.log(courses[i]);
                            if (courses[i].term && courses[i].term.name == `${semester}`) {
                                courseList.push(courses[i]);
                            }
                        }
                        page++;
                    }
                }
                else {
                    console.error("Failed to fetch courses:", res.status, res.statusText);
                    break;
                } 
            }
            if (debug) {
                for (let i = 0; i < courseList.length; i++) {
                    console.log(courseList[i].name);
                }
            }
            
            return courseList;
        }
        catch (err) {
            console.error("Error getting courses:", err);
        }
        
    }

    /**
     * Updates COURSES in chrome.storage.sync with a new color for the specified course
     * 
     * @param {string} courseName 
     * @param {string} newColor 
     */
    async function updateCourseColor(courseName, newColor) {
        try {
            const res = await chrome.storage.sync.get("COURSES");
            const courses = await res.COURSES;
    
            const courseIndex = courses.findIndex(course => course.name === courseName);
            const colorIndex = colorMap.findIndex(color => color === newColor);
            
            if (courseIndex !== -1) {
                // Update the color for the found course
                courses[courseIndex].color = colorIndex;
    
                // Save the updated courses array back to chrome.storage.sync
                await chrome.storage.sync.set({ COURSES: courses });
                if (debug) console.log(`Updated color for ${courseName} to ${colorIndex} in chrome.storage.sync`);
    
                // this will be a PUT request
                try {
                    const storageRes = await chrome.storage.sync.get(["CANVAS_API_URL", "CANVAS_API_KEY", "USER_ID"]);
                    const apiUrl = storageRes.CANVAS_API_URL;
                    const apiKey = storageRes.CANVAS_API_KEY;
                    const userId = storageRes.USER_ID;
                    const courseId = courses[courseIndex].id;
                    const hexCode = colorMap[colorIndex].substring(1); //remove the hash symbol
                    console.log(hexCode);

                    const params = new FormData();
                    params.append('hexcode', hexCode);
                    
                    console.log(params);

                    const url = `${apiUrl}/api/v1/users/${userId}/colors/courses_${courseId}`
                    const res = await fetch(url,
                        {
                            method: 'PUT',
                            headers: {
                                "Authorization": `Bearer ${apiKey}`
                            },
                            body: params
            
                        }
                    );
                    if (debug) console.log(await res.json());
                }
                catch (err) {
                    console.error(`Failed to update color for ${courseName} to ${hexCode} in Canvas`);
                }
                
    
            } else {
                console.error(`Course ${courseName} not found.`);
            }
        }
        catch (err) {
            console.error(`Failed to get courses from chrome.storage.sync: `, err);
        } 
    }

    /**
     * Loads course boxes on the popup from the courses saved in chrome.storage.sync
     */
    async function loadCourseBoxes() {
        if (debug) console.log("Loading course boxes")
        const res = await chrome.storage.sync.get(["COURSES"]);
        if (debug) console.log(res.COURSES);
        const courses = res.COURSES;

        const calendarColorRes = await chrome.storage.sync.get("CALENDAR_COLOR");
        const calendarColor = calendarColorRes.CALENDAR_COLOR;

        const courseContainer = document.getElementById("course-container");
        if (debug) console.log(courses);
        if (debug) console.log(typeof courses);

        courses.forEach(item => {
            const courseBox = document.createElement("div");
            courseBox.className = "course-box";

            const courseName = document.createElement("p");
            courseName.textContent = item.name;
            courseName.className = "course-name";
            courseName.id = `course-${item.name}`

            const colorDisplay = document.createElement("div");
            colorDisplay.className = "color-display";

            // handle custom colors
            colorDisplay.style.backgroundColor = colorMap[item.color];

            const colorPickerPopup = document.createElement("div");
            colorPickerPopup.className = "color-picker-popup";

            const colorPickerContainer = document.createElement("div");
            colorPickerContainer.className = "color-picker-container";

            colorMap.forEach((color, index) => {
                const colorOption = document.createElement("div");
                colorOption.className = "color-option";
                colorOption.style.backgroundColor = (color == null) ? calendarColor : color;

                // Set the title attribute for hover text based on the 1-indexed color
                colorOption.title = colorHoverTexts[index]; // Access hover text directly

                colorOption.addEventListener("click", () => {
                    colorPickerPopup.querySelectorAll(".color-option").forEach(option => {
                        // remove all selected
                        option.classList.remove("selected");
                    })
                    // add selected class
                    colorOption.classList.add("selected");

                    // update display with color
                    colorDisplay.style.backgroundColor = color;

                    // close popup
                    colorPickerPopup.style.display = "none";

                    // add handling of selected color
                    console.log(`Selected color for ${item.name}: ${index}: ${color}`);
                    updateCourseColor(item.name, color);
                })
                colorPickerContainer.appendChild(colorOption);
            });

            
            colorPickerPopup.appendChild(colorPickerContainer);
            courseBox.appendChild(colorDisplay);
            courseBox.appendChild(colorPickerPopup);
            courseBox.appendChild(courseName);
            courseContainer.appendChild(courseBox);

            // Show the popup when clicking on the color display
            colorDisplay.addEventListener('click', () => {
                colorPickerPopup.style.display = 'block';
            });
            // Hide the popup when clicking outside of it
            document.addEventListener('click', (event) => {
                if (!courseContainer.contains(event.target)) {
                    colorPickerPopup.style.display = 'none';
                }
            });
        })
    }

    //initial fetch courses
    chrome.storage.sync.get(["CANVAS_API_URL", "CANVAS_API_KEY", "USER_ID", "SEMESTER"])
    .then((res) => {
        if (res.CANVAS_API_URL && res.CANVAS_API_KEY && res.USER_ID && res.SEMESTER) {
            getCourses();
        }
    })
    .catch((err) => console.log(err))
});