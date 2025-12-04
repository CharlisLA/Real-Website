// ===========================================
// POPUP FUNCTIONS
// ===========================================

// Open the popup
function openPopup() {
    const popup = document.getElementById('popupOverlay');
    popup.classList.add('active');
}

// Close the popup
function closePopup() {
    const popup = document.getElementById('popupOverlay');
    popup.classList.remove('active');
}

// Close popup when clicking outside the box
function closePopupOnOverlay(event) {
    if (event.target.id === 'popupOverlay') {
        closePopup();
    }
}

// Close popup with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePopup();
        closeTestPopup();
    }
});

// ===========================================
// TEST POPUP FUNCTIONS
// ===========================================

// Open the test popup
function openTestPopup() {
    const popup = document.getElementById('testPopupOverlay');
    popup.classList.add('active');
}

// Close the test popup
function closeTestPopup() {
    const popup = document.getElementById('testPopupOverlay');
    popup.classList.remove('active');
}

// Close test popup when clicking outside the box
function closeTestPopupOnOverlay(event) {
    if (event.target.id === 'testPopupOverlay') {
        closeTestPopup();
    }
}
