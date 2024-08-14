import * as settings from "./settings.js";

const debug = true;

if (debug) console.log("popup.js commenced");

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

    const settingsParams = {
        apiUrlInput,
        apiKeyInput,
        semesterInput
    }

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
    saveSettingsButton.addEventListener("click", async () => {
        await settings.saveSettings(settingsParams);
    })


    getCoursesButton.addEventListener("click", async () => {
        await settings.getCourses(settingsParams);
    })

    buildCoursesButton.addEventListener("click", async () => {
        const courses = await settings.buildCourses(settingsParams);
        chrome.storage.sync.set({ COURSES: courses });
    })
    loadCourseInputsButton.addEventListener("click", async () => {
        await settings.loadCourseBoxes();
    })
    loadCanvasEventsButton.addEventListener("click", async () => {
        const events = await settings.loadCanvasEvents();
        if (debug) console.log(events);
    })
    syncEventsButton.addEventListener("click", async () => {
        await settings.syncEvents();
    })



    //initial fetch courses
    chrome.storage.sync.get(["CANVAS_API_URL", "CANVAS_API_KEY", "USER_ID", "SEMESTER"])
    .then((res) => {
        if (res.CANVAS_API_URL && res.CANVAS_API_KEY && res.USER_ID && res.SEMESTER) {
            settings.getCourses(settingsParams);
        }
    })
    .catch((err) => console.log(err))
});