// Responsive navigation menu for mobile
const navLinks = document.querySelector('.nav-links');
document.addEventListener('click', (event) => {
    if (event.target.closest('nav') && window.innerWidth <= 768) {
        if (event.target.tagName === 'A') {
            navLinks.classList.remove('open');
            return;
        }
        if (!navLinks.classList.contains('open')) {
            navLinks.classList.add('open');
        } else {
            navLinks.classList.remove('open');
        }
    } else if (navLinks.classList.contains('open') && window.innerWidth <= 768) {
        navLinks.classList.remove('open');
    }
});

const nameLookupDiv = document.getElementById('name-lookup');
const lookupButton = document.getElementById('lookup-button');
const guestNameLookupInput = document.getElementById('guest-name-lookup');
const rsvpForm = document.getElementById('rsvpForm');
const nameInput = document.getElementById('name');
const nameDisplay = document.getElementById('name-display'); // Get the span
const nameDisplayWrapper = document.getElementById('name-display-wrapper');
const idahoQuestionDiv = document.getElementById('idaho-question');
const fridayQuestionDiv = document.getElementById('friday-question');
const idahoRadioButtons = idahoQuestionDiv ? idahoQuestionDiv.querySelectorAll('input[type="radio"]') : new Array();
const fridayRadioButtons = fridayQuestionDiv ? fridayQuestionDiv.querySelectorAll('input[type="radio"]') : new Array();
const rsvpMessage = document.getElementById('rsvp-message');
let submissionSuccessful = false; // Flag to track submission

document.addEventListener('DOMContentLoaded', () => {
    if (submissionSuccessful) {
        nameLookupDiv.style.display = 'none';
        rsvpForm.style.display = 'none';
        rsvpMessage.style.display = 'block';
    }
});

lookupButton.addEventListener('click', function() {
    if (submissionSuccessful) return; // Don't allow lookup after successful submission

    const enteredName = guestNameLookupInput.value.trim();
    let foundGuest = null;
    let guestEvent = '';

    if (typeof parsedGuests !== 'undefined') {
        for (const guest of parsedGuests) {
            if (guest.Name.toLowerCase() === enteredName.toLowerCase()) {
                foundGuest = guest;
                guestEvent = guest.Event;
                break;
            }
        }

        if (foundGuest) {
            nameInput.value = foundGuest.Name; // Keep value in input for submission
            nameDisplay.textContent = foundGuest.Name; // Display in span
            nameInput.style.display = 'none'; // Hide input
            nameDisplay.style.display = 'block'; // Show span
            nameLookupDiv.style.display = 'none';
            rsvpForm.style.display = 'block';
            rsvpMessage.style.display = 'none';

            // Reset special event questions
            if (idahoQuestionDiv) idahoQuestionDiv.style.display = 'none';
            if (fridayQuestionDiv) fridayQuestionDiv.style.display = 'none';
            idahoRadioButtons.forEach(rb => { if (rb) rb.required = false; if (rb) rb.checked = false; });
            fridayRadioButtons.forEach(rb => { if (rb) rb.required = false; if (rb) rb.checked = false; });


            if (guestEvent === 'Idaho' && idahoQuestionDiv) {
                idahoQuestionDiv.style.display = 'block';
                idahoRadioButtons.forEach(rb => { if (rb) rb.required = true; });
            } else if (guestEvent === 'Friday' && fridayQuestionDiv) {
                fridayQuestionDiv.style.display = 'block';
                fridayRadioButtons.forEach(rb => { if (rb) rb.required = true; });
            }

        } else {
            alert('Name not found on the guest list. Please try again.');
        }
    } else {
        console.error('Error: parsedGuests is not defined. Make sure guests.js is loaded before script.js.');
        alert('Error loading guest list. Please contact the host.');
    }
});

rsvpForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent default form submission
    if (submissionSuccessful) return; // Don't allow multiple submissions

    const formData = new FormData(rsvpForm);
    const formAction = rsvpForm.action;

    fetch(formAction, {
        method: 'POST',
        body: formData,
        mode: 'no-cors' // Important for Google Forms
    })
    .then(() => {
        // Hide the form and lookup
        rsvpForm.style.display = 'none';
        nameLookupDiv.style.display = 'none';
        // Show a success message
        rsvpMessage.style.display = 'block';
        submissionSuccessful = true; // Set the flag
    })
    .catch(error => {
        console.error('Error submitting form:', error);
        // Display an error message to the user
        rsvpMessage.textContent = 'Oops! Something went wrong submitting your RSVP. Please try again.';
        rsvpMessage.style.display = 'block';
        rsvpForm.style.display = 'block'; // Re-show the form
    });
});

// Countdown Timer
const countdownDisplay = document.getElementById('countdown');
const eventDate = new Date("June 28, 2025 13:45:00").getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = eventDate - now;

    if (distance < 0) {
        countdownDisplay.textContent = "Event has passed!";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdownDisplay.textContent = `${days} DAYS, ${hours} HRS, ${minutes} MIN, ${seconds} SEC TO GO!`;
}

// Initial call to avoid delay
updateCountdown();
// Update every second
setInterval(updateCountdown, 1000);