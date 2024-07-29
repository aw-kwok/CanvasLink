const debug = true;

if (debug) console.log("popup.js commenced")

document.addEventListener("DOMContentLoaded", () => {
    if (debug) console.log("DOM content loaded");

    const apiUrlInput = document.getElementById("canvasApiUrl");
    const apiKeyInput = document.getElementById("canvasApiKey");
    const userIdInput = document.getElementById("userId");
    const saveSettingsButton = document.getElementById("saveSettings");
    const getCoursesButton = document.getElementById("getCourses");

    //load saved settings
    chrome.storage.sync.get(["CANVAS_API_URL", "CANVAS_API_KEY", "USER_ID"])
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
    })
    .catch((err) => {
        console.log(err)
    });


    //save settings button handler
    saveSettingsButton.addEventListener("click", () => {
        saveSettings()
    })

    //save settings
    getCoursesButton.addEventListener("click", () => {
        saveSettings();
        getCourses();
    })

    function saveSettings() {
        chrome.storage.sync.set({ CANVAS_API_URL: apiUrlInput.value, CANVAS_API_KEY: apiKeyInput.value, USER_ID: userIdInput.value });
        if (debug) console.log("Settings saved");
    }


    // https://developer.chrome.com/docs/extensions/develop/concepts/network-requests - CORS information
    function getCourses() {
        // add error handling
        console.log(`${apiUrlInput.value}`);
        console.log(`${apiKeyInput.value}`);
        console.log(`${userIdInput.value}`);
    

        fetch(`${apiUrlInput.value}/api/v1/users/${userIdInput.value}/courses`, { 
            method: "GET",
            headers: { "Authorization": `Bearer ${apiKeyInput.value}` }
        })
        .then(res => {
            if (debug) console.log("Courses fetched");
            console.log(res.json())
        })
        .catch(err => {
            console.log(err)
        })
    }

    //initial fetch courses
    chrome.storage.sync.get(["CANVAS_API_URL", "CANVAS_API_KEY", "USER_ID"])
    .then((res) => {
        if (res.CANVAS_API_URL && res.CANVAS_API_KEY && res.USER_ID) {
            getCourses();
        }
    })
    .catch((err) => console.log(err))
});