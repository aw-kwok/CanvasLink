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
        chrome.storage.sync.set({ CANVAS_API_URL: apiUrlInput.value, CANVAS_API_KEY: apiKeyInput.value, USER_ID: userIdInput.value, SEMESTER: semesterInput.value });
        if (debug) console.log("Settings saved");
    }


    // https://developer.chrome.com/docs/extensions/develop/concepts/network-requests - CORS information
    // also handles parsing the courses 
    // returns an array of course objects
    async function getCourses() {
        try {
            // add error handling
            if (debug) console.log(`${apiUrlInput.value}`);
            if (debug) console.log(`${apiKeyInput.value}`);
            if (debug) console.log(`${userIdInput.value}`);

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
                    courses = await res.json();
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



        }
        catch (err) {
            console.error("Error:", err);
        }
        
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