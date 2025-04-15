/**
 * RSVP Form Handler
 * This file uses shared utility functions from guest-utils.js to handle guest lookups and RSVP form submission.
 */

// RSVP Form Handler
class RSVPHandler {
  constructor() {
    // Initialize DOM elements
    this.elements = {
      nameLookup: document.getElementById("name-lookup"),
      lookupButton: document.getElementById("lookup-button"),
      guestNameInput: document.getElementById("guest-name-lookup"),
      form: document.getElementById("rsvpForm"),
      nameInput: document.getElementById("name"),
      originalPartyList: document.getElementById("original-party-list"),
      // guestNameDisplay: document.getElementById("guest-name-display"),
      welcomeNameDisplay: document.getElementById("welcome-name-display"),
      nameWrapper: document.getElementById("name-display-wrapper"),
      message: document.getElementById("rsvp-message"),
      attendingOptions: document.getElementById("attending-options"),
      idahoQuestion: document.getElementById("idaho-question"),
      fridayQuestion: document.getElementById("friday-question"),
      familyQuestion: document.getElementById("family-question"),
      sealingQuestion: document.getElementById("sealing-question"),
      partyMembersInput: document.getElementById("party-members"),
      logoutButton: document.getElementById("logout-button"),
    };

    this.state = {
      submissionSuccessful: false,
      currentGuest: null,
    };

    // Bind event handlers
    this.handleLookup = this.handleLookup.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateUIForGuestFound = this.updateUIForGuestFound.bind(this);
    this.checkForSavedUser = this.checkForSavedUser.bind(this);
    this.handleLogout = this.handleLogout.bind(this);

    // Initialize
    this.init();
  }

  init() {
    // Add event listeners
    this.elements.lookupButton.addEventListener("click", this.handleLookup);
    this.elements.form.addEventListener("submit", this.handleSubmit);

    // Add logout button handler
    if (this.elements.logoutButton) {
      this.elements.logoutButton.addEventListener("click", this.handleLogout);
    }

    // Add event listener for Enter key in the name lookup input
    this.elements.guestNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent default form submission
        this.handleLookup();
      }
    });

    // Add event listeners to all radio buttons to highlight selected option
    document.querySelectorAll('input[type="radio"]').forEach((radio) => {
      // Check initial state
      if (radio.checked) {
        radio.closest(".radio-label").classList.add("selected");
      }

      // Add change event listener
      radio.addEventListener("change", function () {
        // Remove 'selected' class from all radio labels in the same group
        document.querySelectorAll(`input[name="${this.name}"]`).forEach((r) => {
          r.closest(".radio-label").classList.remove("selected");
        });

        // Add 'selected' class to the selected radio label
        if (this.checked) {
          this.closest(".radio-label").classList.add("selected");
        }
      });
    });

    // Check for previous submission
    if (this.state.submissionSuccessful) {
      this.updateUIForSubmission();
    } else {
      // Check for a saved user session
      this.checkForSavedUser();
    }

    // Add listener for Idaho event question to show/hide Idaho guests section
    const idahoOptions = document.querySelectorAll(
      'input[name="entry.1284767391"]'
    );
    idahoOptions.forEach((option) => {
      option.addEventListener("change", (e) => {
        const idahoGuestsSection = document.getElementById("idaho-guests");
        this.elements.fridayQuestion.style.display = e.target.value === "Yes" ? "none" : "block";
        if (idahoGuestsSection) {
          idahoGuestsSection.style.display =
            e.target.value === "Yes" ? "block" : "none";

          // If showing the section and party members exist, copy them to Idaho guests
          if (e.target.value === "Yes" && this.elements.partyMembersInput) {
            const idahoGuestsInput =
              document.getElementById("idaho-guests-input");
            if (idahoGuestsInput && !idahoGuestsInput.value) {
              idahoGuestsInput.value = this.elements.partyMembersInput.value;
            }
          }
        }
      });
    });

    // Add event listener for Sealing event question to show/hide Sealing guests section
    const sealingOptions = document.querySelectorAll(
      'input[name="entry.885675918"]'
    );
    sealingOptions.forEach((option) => {
      option.addEventListener("change", (e) => {
        const sealingGuestsSection = document.getElementById("sealing-guests");
        if (sealingGuestsSection) {
          sealingGuestsSection.style.display =
            e.target.value === "Yes" ? "block" : "none";
        }
      });
    });
  }

  // Check for a saved user in cookie
  checkForSavedUser() {
    try {
      const savedUserJSON = getCookie("validatedWeddingGuest");
      if (savedUserJSON) {
        try {
          const savedUser = JSON.parse(savedUserJSON);
          const currentRecord = validateSavedUser(savedUser);

          if (currentRecord) {
            this.updateUIForGuestFound(currentRecord);
            return true;
          }
        } catch (parseError) {
          console.error("Error parsing saved user data:", parseError);
          deleteCookie("validatedWeddingGuest");
        }
      }
    } catch (error) {
      console.error("Error checking for saved user:", error);
      deleteCookie("validatedWeddingGuest");
    }
    return false;
  }

  updateUIForGuestFound(matchRecord) {
    // Update name display
    this.elements.nameInput.value = matchRecord.matchedName;
    // this.elements.guestNameDisplay.textContent = matchRecord.matchedName;
    this.elements.welcomeNameDisplay.textContent =
      matchRecord.matchedName.split(" ")[0];
    this.elements.originalPartyList.value =
      matchRecord.guestRecord.Party.join(", ");

    // Get other party members (excluding the matched name)
    const otherPartyMembers = matchRecord.guestRecord.Party.filter(
      (member) => member !== matchRecord.matchedName
    ).join(", ");
    this.elements.partyMembersInput.value = otherPartyMembers;

    // Update visibility
    this.elements.nameInput.style.display = "block";
    // this.elements.guestNameDisplay.style.display = "block";
    this.elements.nameLookup.style.display = "none";
    this.elements.form.style.display = "block";
    this.elements.message.style.display = "none";

    // Store current guest
    this.state.currentGuest = matchRecord;

    // Show specific event questions depending on the guest's list
    const eventList = [
      { question: this.elements.idahoQuestion, list: "Idaho" },
      { question: this.elements.fridayQuestion, list: "Friday" },
      { question: this.elements.familyQuestion, list: "Family" },
      { question: this.elements.sealingQuestion, list: "Sealing" },
    ];
    eventList.forEach((event) => {
      if (matchRecord.guestRecord.Event.includes(event.list)) {
        event.question.style.display = "block";
        // Make radio buttons required when the question is displayed
        const radioButtons = event.question.querySelectorAll(
          'input[type="radio"]'
        );
        radioButtons.forEach((radio) => {
          radio.required = true;
        });
      } else {
        event.question.style.display = "none";
      }
    });
  }

  updateUIForSubmission() {
    this.elements.form.style.display = "none";
    this.elements.nameLookup.style.display = "none";
    this.elements.message.style.display = "block";
  }

  showError(message) {
    alert(message);
  }

  async handleLookup() {
    if (this.state.submissionSuccessful) return;

    const enteredName = this.elements.guestNameInput.value.trim();

    try {
      // Use the shared userValidate function
      userValidate({
        enteredName: enteredName,
        onUserValidated: this.updateUIForGuestFound,
      });
    } catch (error) {
      console.error("Error during guest lookup:", error);
      this.showError(
        "Name not found on the guest list. Please try a different spelling or contact the host."
      );
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.state.submissionSuccessful) return;

    try {
      const formData = new FormData(this.elements.form);
      const formAction = this.elements.form.action;

      await fetch(formAction, {
        method: "POST",
        body: formData,
        mode: "no-cors",
      });

      this.state.submissionSuccessful = true;
      this.updateUIForSubmission();
    } catch (error) {
      console.error("Error submitting form:", error);
      this.elements.message.textContent =
        "Oops! Something went wrong submitting your RSVP. Please try again.";
      this.elements.message.style.display = "block";
      this.elements.form.style.display = "block";
    }
  }

  // Handle logout - delete cookie and reset the form
  handleLogout() {
    deleteCookie("validatedWeddingGuest");
    this.elements.form.style.display = "none";
    this.elements.nameLookup.style.display = "block";
    this.elements.guestNameInput.value = ""; // Clear input field
    this.elements.guestNameInput.focus(); // Focus on input field
  }
}

// Initialize RSVP handler when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  await loadAndParseGuests();
  console.log("Number of parsed guests:", window.parsedGuests.length);
  new RSVPHandler();
}); 