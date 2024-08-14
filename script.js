const debug = true;

// DOM element references for dropdowns
const termDropdown = document.getElementById('term-dropdown');
const schoolsDropdown = document.getElementById("schools-dropdown");


// password visibility handler
// this needs updating

const apiKeyInput = document.getElementById('api-key');

apiKeyInput.addEventListener('focus', function() {
    this.type = 'text'; // Change type to text on focus
});

apiKeyInput.addEventListener('blur', function() {
    this.type = 'password'; // Change type back to password on blur
});


// button handlers

document.getElementById("get-started-btn").addEventListener("click", () => {
    const modal = document.getElementById("popup");
    modal.style.display = "flex";
})

document.getElementById("close-popup-btn").addEventListener("click", () => {
    const modal = document.getElementById("popup");
    modal.style.display = "none";
})

document.getElementById("submit-btn").addEventListener("click", () => {
    const school = document.getElementById("schools-dropdown").value;
    if (debug) console.log(`School: ${school}`);
    const apiKey = document.getElementById("api-key").value;
    if (debug) console.log(`apiKey: ${apiKey}`);
    const term = document.getElementById("term-dropdown").value;
    if (debug) console.log(`Term: ${term}`);
})

// handle schools dropdown
const jsonUrl = chrome.runtime.getURL('universities.json');

fetch(jsonUrl)
    .then(response => response.json())
    .then(schoolsData => {
        // Extract entries and sort by name alphabetically
        const schoolsEntries = Object.entries(schoolsData).sort((a, b) => {
        return a[1].name.localeCompare(b[1].name);
        });

        // Populate dropdown
        schoolsEntries.forEach(([id, school]) => {
        const option = document.createElement("option");
        option.value = id; // Set the value to the numeric ID
        option.textContent = school.name;
        schoolsDropdown.appendChild(option);
        });
    })
    .catch(err => {
        console.error(err);
    });

// term dropdown population
const termsOffset = 2;
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth(); // 0-indexed months

const currentSemester = getSemester(currentMonth);


/**
 * Gets current semester based on the current month
 * 
 * @param {*} month - current month
 * @returns {string} - semester
 */
function getSemester(month) {
    if (month <= 5){
        return "Spring";
    }
    else {
        return "Fall";
    }
}

function generateTerms() {
    const terms = [];
    
    let startYear = currentYear - (termsOffset / 2);
    let endYear = currentYear + (termsOffset / 2);

    // Generate terms from start to end
    for (let year = startYear; year <= endYear; year++) {
        // Handle the start year
        if (year === startYear) {
            if (currentSemester === 'Spring') {
                terms.push({ semester: 'Spring', year });
            }
            terms.push({ semester: 'Fall', year });
        }
        // Handle the end year
        else if (year === endYear) {
            terms.push({ semester: 'Spring', year });
            if (currentSemester === 'Fall') {
                terms.push({ semester: 'Fall', year });
            }
        }
        // Handle all other years
        else {
            terms.push({ semester: 'Spring', year });
            terms.push({ semester: 'Fall', year });
        }
    }
    return terms;
}

// Populate the term dropdown
const terms = generateTerms();

terms.forEach(term => {
    const option = document.createElement('option');
    option.value = `${term.semester}_${term.year}`;
    option.textContent = `${term.semester} ${term.year}`;
    termDropdown.appendChild(option);
});

const defaultValue = `${currentSemester}_${currentYear}`;
termDropdown.value = defaultValue;

// Function to parse selected value
function parseSelectedTerm(value) {
    const [semester, year] = value.split('_');
    return { semester, year };
}


// handle manual information toggle

document.getElementById("no-school").addEventListener("click", () => {
    const schoolsInput = document.createElement("input");
    schoolsInput.type = "text";
    schoolsInput.id = "schools-input";
    schoolsInput.placeholder = "Enter your school's Canvas link";

    const termInput = document.createElement("input");
    termInput.type = "text";
    termInput.id = "term-input";
    termInput.placeholder = "Enter term code"

    schoolsDropdown.parentNode.replaceChild(schoolsInput, schoolsDropdown);
    document.getElementById("schools-label").setAttribute("for", "schools-input");
    document.getElementById("schools-note").style.display = "none";
    document.getElementById("manual-note").style.display = "block";

    termDropdown.parentNode.replaceChild(termInput, termDropdown);
    document.getElementById("term-label").setAttribute("for", "term-input");
    document.getElementById("term-note-placeholder").style.display = "none";
    document.getElementById("term-note").style.display = "block";
})

document.getElementById("use-list").addEventListener("click", () => {
    const schoolsInput = document.getElementById("schools-input");
    const termInput = document.getElementById("term-input")

    schoolsInput.parentNode.replaceChild(schoolsDropdown, schoolsInput);
    document.getElementById("schools-label").setAttribute("for", "schools-dropdown");
    document.getElementById("schools-note").style.display = "block";
    document.getElementById("manual-note").style.display = "none";

    termInput.parentNode.replaceChild(termDropdown, termInput);
    document.getElementById("term-note-placeholder").style.display = "block";
    document.getElementById("term-note").style.display = "none";
})