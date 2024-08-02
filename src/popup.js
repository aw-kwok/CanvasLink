import ICAL from "ical.js";

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



    // might have to move this to background.js so that content.js can refresh calendars on calendar.google.com
    // REMEMBER that this currently only works on the test calendar, need to test when Canvas calendars come out
    /**
     * Loads Canvas events saved in chrome.storage.sync
     * 
     * @returns {Array.<Object>} eventObjects - Array of parsed event objects
     */
    async function loadCanvasEvents() {
        try {
            const { COURSES } = await chrome.storage.sync.get(["COURSES"]);
            const courses = COURSES;
            if (debug) console.log(courses);

            let eventArray = [];

            for (let i = 0; i < courses.length; i++) {
                const url = courses[i].calendar;
                if (debug) console.log(`${courses[i].name}`)

                // temp url fix while course calendars don't work
                // const url = "https://georgetown.instructure.com/feeds/calendars/user_u0r5znENyCa1LKaJkhBVC401gzBShrZ9kZcKdnhM.ics";
                // const url = "https://calendar.google.com/calendar/ical/b6c580de92a2d8be2217557d5f80d55f6566af2c141000fa4763d25648da650d%40group.calendar.google.com/private-6272ff16d3832c7dd1daecccd51e4f1c/basic.ics";
                console.log(`url: ${url}`);
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
                            "colorId": courses[i].color,
                            "start": {},
                            "end": {},
                            "transparency": "transparent",
                            "iCalUID": event.getFirstPropertyValue("uid"),
                            "source": {
                                "title": courses[i].name,
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

                            eventObject.start = { "date": start.toISOString() };
                            eventObject.end = { "date": end.toISOString() }
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

                    if (debug) console.log(`Events in calendar ${courses[i].name}: ${createdEvents}`);
                    eventArray.push(...createdEvents);
                }
                catch (err) {
                    console.error("Error", err);
                }
            }

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
        const courses = await getCourses();
        if (debug) console.log(courses);
        let courseObjects = [];
        for (let i = 0; i < courses.length; i++) {
            const name = courses[i].name;
            // add color customizer
            // colors are 1-indexed
            const color = i + 1;
            const calendar = courses[i].calendar.ics;
            const course = {
                "name": name,
                "color": color,
                "calendar": calendar
            }
            if (debug) console.log(course);
            courseObjects.push(course);
        }
        if (debug) console.log(courseObjects);
        return courseObjects;
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

                const url = `${apiUrlInput.value}/api/v1/users/${userIdInput.value}/courses${params}`
                if (debug) console.log(url);

                const res = await fetch(`${apiUrlInput.value}/api/v1/users/${userIdInput.value}/courses?${params}`, { 
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
            for (let i = 0; i < courseList.length; i++) {
                console.log(courseList[i].name);
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