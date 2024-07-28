const debug = false;
console.log("test script");

document.addEventListener("DOMContentLoaded", () => {
    if (debug) console.log("DOM content loaded");

    const apiUrlInput = document.getElementById("canvasApiUrl");
    const apiKeyInput = document.getElementById("canvasApiKey");
    const userIdInput = document.getElementById("userId");
    const saveSettingsButton = document.getElementById("saveSettings");

    //load saved settings
    chrome.storage.sync.get(["CANVAS_API_URL", "CANVAS_API_KEY", "USER_ID"], (result) => {
        if (result.CANVAS_API_URL) {
            apiUrlInput.value = result.CANVAS_API_URL;
        }
        if (result.CANVAS_API_KEY) {
            apiKeyInput.value = result.CANVAS_API_KEY;
        }
        if (result.USER_ID) {
            userIdInput.value = result.USER_ID;
        }
    });

    //save settings
    saveSettingsButton.addEventListener("click", () => {
        const canvasApiUrl = apiUrlInput.value;
        const canvasApiKey = apiKeyInput.value;
        const userId = userIdInput.value;

        chrome.storage.sync.set({ CANVAS_API_URL: canvasApiUrl, CANVAS_API_KEY: canvasApiKey, USER_ID: userId });
        if (debug) console.log("Settings saved");
    })

    function getCourses() {
        
    }

    //fetch courses
    chrome.storage.sync.get(["CANVAS_API_URL", "CANVAS_API_KEY", "USER_ID"], () => {
        if (result.CANVAS_API_URL && result.CANVAS_API_KEY && result.USER_ID) {
            getCourses();
        }
    })

});