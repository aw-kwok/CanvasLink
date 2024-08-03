import ICAL from "ical.js";

import * as gcal from "./gcal.js";

const debug = true;

if (debug) console.log("popup.js commenced")

document.addEventListener("DOMContentLoaded", () => {
    if (debug) console.log("DOM content loaded");

    const apiUrlInput = document.getElementById("canvasApiUrl");
    const apiKeyInput = document.getElementById("canvasApiKey");
    const userIdInput = document.getElementById("userId");
    const semesterInput = document.getElementById("semester");
    const saveSettingsButton = document.getElementById("saveSettings");
    const getCoursesButton = document.getElementById("getCourses");
    const buildCoursesButton = document.getElementById("buildCourses");
    const loadCourseInputsButton = document.getElementById("loadCourseInputs");
    const loadCanvasEventsButton = document.getElementById("loadCanvasEvents");
    const syncEventsButton = document.getElementById("syncEvents");
    // const getCanvasCalendarsButton = document.getElementById("getCanvasCalendars");

    // google calendar event colors - 1-indexed
    const colorMap = [null, "#7986CB", "#33B679", "#8E24AA", "#E67C73", "#F6BF26", "#F4511E", "#039BE5", "#616161", "#3F51B5", "#0B8043", "#D50000"]

    //load saved settings
    chrome.storage.sync.get(["CANVAS_API_URL", "CANVAS_API_KEY", "USER_ID", "SEMESTER"])
    .then((res) => {
        if (res.CANVAS_API_URL) {
            apiUrlInput.value = res.CANVAS_API_URL;
        }
        if (res.CANVAS_API_KEY) {
            apiKeyInput.value = res.CANVAS_API_KEY;
        }
        if (res.USER_ID) {
            userIdInput.value = res.USER_ID;
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

                const { name, calendar } = course;
                // add color customizer
                // colors are 1-indexed
                const color = index + 1;
                const courseObject = {
                    "name": name,
                    "color": color,
                    "calendar": calendar.ics
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
     */
    function saveSettings() {
        chrome.storage.sync.set({ CANVAS_API_URL: apiUrlInput.value, CANVAS_API_KEY: apiKeyInput.value, USER_ID: userIdInput.value, SEMESTER: semesterInput.value });
        if (debug) console.log("Settings saved");
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
            if (debug) console.log(`${apiUrlInput.value}`);
            if (debug) console.log(`${apiKeyInput.value}`);
            if (debug) console.log(`${userIdInput.value}`);
            if (debug) console.log(`${semesterInput.value}`);

            let page = 1;
            let moreData = true;
            let courseList = [];

            while (moreData == true) {
                const params = new URLSearchParams({
                    "include[]": ["term"],
                    "page": page
                }).toString();

                const url = `${apiUrlInput.value}/api/v1/users/${userIdInput.value}/courses?${params}`
                if (debug) console.log(url);

                const res = await fetch(url, { 
                    method: "GET",
                    headers: { "Authorization": `Bearer ${apiKeyInput.value}` }
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
                            if (courses[i].term && courses[i].term.name == `${semesterInput.value}`) {
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
     * Loads course boxes on the popup from the courses saved in chrome.storage.sync
     */
    async function loadCourseBoxes() {
        if (debug) console.log("Loading course boxes")
        const res = await chrome.storage.sync.get(["COURSES"]);
        if (debug) console.log(res.COURSES);
        const courses = res.COURSES;
        const container = document.getElementById("course-container");
        if (debug) console.log(courses);
        if (debug) console.log(typeof courses);
        courses.forEach(item => {
            const inputBox = document.createElement("input");
            inputBox.type = "text";
            inputBox.value = item.name;
            inputBox.id = `input-${item.name}`;
            container.appendChild(inputBox);
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