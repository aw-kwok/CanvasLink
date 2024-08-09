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


const schoolsDropdown = document.getElementById("schools-dropdown");
const termDropdown = document.getElementById("term-dropdown");

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