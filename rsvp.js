// RSVP Form Handler
class RSVPHandler {
    constructor() {
        // Initialize DOM elements
        this.elements = {
            nameLookup: document.getElementById('name-lookup'),
            lookupButton: document.getElementById('lookup-button'),
            guestNameInput: document.getElementById('guest-name-lookup'),
            form: document.getElementById('rsvpForm'),
            nameInput: document.getElementById('name'),
            nameDisplay: document.getElementById('guest-name-display'),
            nameWrapper: document.getElementById('name-display-wrapper'),
            message: document.getElementById('rsvp-message'),
            attendingOptions: document.getElementById('attending-options'),
            idahoQuestion: document.getElementById('idaho-question'),
            fridayQuestion: document.getElementById('friday-question')
        };

        this.state = {
            submissionSuccessful: false,
            currentGuest: null
        };

        // Bind event handlers
        this.handleLookup = this.handleLookup.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        // Initialize
        this.init();
    }

    init() {
        // Add event listeners
        this.elements.lookupButton.addEventListener('click', this.handleLookup);
        this.elements.form.addEventListener('submit', this.handleSubmit);

        // Check for previous submission
        if (this.state.submissionSuccessful) {
            this.updateUIForSubmission();
        }

        // Add listeners for attendance radio buttons
        const rsvpOptions = document.querySelectorAll('input[name="entry.1045781291"]');
        rsvpOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                if (this.elements.attendingOptions) {
                    this.elements.attendingOptions.style.display = 
                        e.target.value === 'Yes' ? 'block' : 'none';
                }
            });
        });
    }

    findGuest(name) {
        if (!window.parsedGuests) {
            throw new Error('Guest list not loaded');
        }

        return parsedGuests.find(guest => 
            guest.Name.toLowerCase() === name.toLowerCase()
        );
    }

    updateUIForGuestFound(guest) {
        // Update name display
        this.elements.nameInput.value = guest.Name;
        this.elements.nameDisplay.textContent = guest.Name;
        
        // Update visibility
        this.elements.nameInput.style.display = 'none';
        this.elements.nameDisplay.style.display = 'block';
        this.elements.nameLookup.style.display = 'none';
        this.elements.form.style.display = 'block';
        this.elements.message.style.display = 'none';

        // Store current guest
        this.state.currentGuest = guest;

        // Reset special event questions
        if (this.elements.idahoQuestion) this.elements.idahoQuestion.style.display = 'none';
        if (this.elements.fridayQuestion) this.elements.fridayQuestion.style.display = 'none';

        // Show specific event questions
        if (guest.Event === 'Idaho' && this.elements.idahoQuestion) {
            this.elements.idahoQuestion.style.display = 'block';
        } else if (guest.Event === 'Friday' && this.elements.fridayQuestion) {
            this.elements.fridayQuestion.style.display = 'block';
        }
    }

    updateUIForSubmission() {
        this.elements.form.style.display = 'none';
        this.elements.nameLookup.style.display = 'none';
        this.elements.message.style.display = 'block';
    }

    showError(message) {
        alert(message);
    }

    async handleLookup() {
        if (this.state.submissionSuccessful) return;

        const enteredName = this.elements.guestNameInput.value.trim();
        
        try {
            const guest = this.findGuest(enteredName);
            
            if (guest) {
                this.updateUIForGuestFound(guest);
            } else {
                this.showError('Name not found on the guest list. Please try again.');
            }
        } catch (error) {
            console.error('Error during guest lookup:', error);
            this.showError('Error loading guest list. Please contact the host.');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (this.state.submissionSuccessful) return;

        try {
            const formData = new FormData(this.elements.form);
            const formAction = this.elements.form.action;

            await fetch(formAction, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });

            this.state.submissionSuccessful = true;
            this.updateUIForSubmission();
        } catch (error) {
            console.error('Error submitting form:', error);
            this.elements.message.textContent = 
                'Oops! Something went wrong submitting your RSVP. Please try again.';
            this.elements.message.style.display = 'block';
            this.elements.form.style.display = 'block';
        }
    }
}

// Initialize RSVP handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RSVPHandler();
    console.log('Number of parsed guests:', window.parsedGuests.length);
}); 