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
        loadCanvasEvents();
    })

    async function loadCanvasEvents() {
        const res = await fetch(url)
        const icsText = await res.text();
        const jcalData = ICAL.parse(icsText);
        const comp = new ICAL.Component(jcalData);
        const events = comp.getAllSubcomponents("vevent");
        const eventObject = events.map(event => new ICAL.Event(event));
        console.log(eventObject);
    }

    async function buildCourses() {
        /*
        Builds objects with a course's name, color, and calendar

        Parameters
        ------
        
        Returns
        ------
        Object[]
            Array of course objects as described above

        */
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
    function saveSettings() {
        /*
        Saves current user inputs in the popup input fields to Chrome sync storage

        Parameters
        ------
        
        Returns
        ------

        */
        chrome.storage.sync.set({ CANVAS_API_URL: apiUrlInput.value, CANVAS_API_KEY: apiKeyInput.value, USER_ID: userIdInput.value, SEMESTER: semesterInput.value });
        if (debug) console.log("Settings saved");
    }


    // https://developer.chrome.com/docs/extensions/develop/concepts/network-requests - CORS information
    // also handles parsing the courses 
    // returns an array of course objects

    async function getCourses() {
        /*
        Sends GET request to Canvas API to fetch user courses based on values saved by the user in apiUrl, apiKey, userId, and semester

        Parameters
        ------
        
        Returns
        ------
        Object[]
            Array of course objects that fit the criteria denoted above

        */
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
                })
                const url = `${apiUrlInput.value}/api/v1/users/${userIdInput.value}/courses${params.toString()}`
                if (debug) console.log(url);

                const res = await fetch(`${apiUrlInput.value}/api/v1/users/${userIdInput.value}/courses?${params.toString()}`, { 
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
            console.error("Error:", err);
        }
        
    }
    async function loadCourseBoxes() {
        /*
        Loads course boxes on the popup from the courses saved in storage

        Parameters
        ------
        
        Returns
        ------
        Object[]
            Array of course objects that fit the criteria denoted above

        */
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