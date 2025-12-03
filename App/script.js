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
    }
});
