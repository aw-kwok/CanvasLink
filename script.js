// password visibility handler
// this needs updating


const apiKeyInput = document.getElementById('api-key');

apiKeyInput.addEventListener('focus', function() {
    this.type = 'text'; // Change type to text on focus
});

apiKeyInput.addEventListener('blur', function() {
    this.type = 'password'; // Change type back to password on blur
});