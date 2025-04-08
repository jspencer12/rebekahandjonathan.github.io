/**
 * Event Details Page
 * This file uses shared utility functions from guest-utils.js to handle guest lookups and displaying event details.
 */

// Event Details Handler Class
class EventDetailsHandler {
  constructor() {
    // Initialize DOM elements
    this.elements = {
      nameLookup: document.getElementById("name-lookup"),
      lookupButton: document.getElementById("lookup-button"),
      guestNameInput: document.getElementById("guest-name-lookup"),
      nameDisplay: document.getElementById("guest-name-display"),
      eventDetailsContent: document.getElementById("event-details-content"),
      eventList: document.getElementById("event-list"),
      partyList: document.getElementById("party-list"),
      logoutButton: document.getElementById("logout-button"),
    };

    // Bind event handlers
    this.handleLookup = this.handleLookup.bind(this);
    this.displayGuestDetails = this.displayGuestDetails.bind(this);
    this.checkForSavedUser = this.checkForSavedUser.bind(this);
    this.handleLogout = this.handleLogout.bind(this);

    // Initialize
    this.init();
  }

  init() {
    // Add event listeners
    this.elements.lookupButton.addEventListener("click", this.handleLookup);

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

    // Check for a saved user session
    this.checkForSavedUser();
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
            this.displayGuestDetails(currentRecord);
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

  displayGuestDetails(matchRecord) {
    if (!matchRecord || !matchRecord.guestRecord) {
      return;
    }

    // Update name display with first name only
    this.elements.nameDisplay.textContent =
      matchRecord.matchedName.split(" ")[0];
    this.elements.nameLookup.style.display = "none";
    this.elements.eventDetailsContent.style.display = "block";

    // Clear previous content
    this.elements.eventList.innerHTML = "";

    // Display events this guest is invited to
    const eventContainerDiv = document.createElement("div");
    eventContainerDiv.className = "event-info-container";

    const eventDetails = {
      Idaho: {
        name: "Jonekah's Ranch Rodeo",
        date: "June 25-27, 2024",
        location: "Victor, ID",
        descriptionShort: "Western-themed activities in Idaho.",
        descriptionLong: "TEST LONG"
      },
      Friday: {
        name: "Picnic",
        date: "Friday, June 27, 2024, 6:00 PM",
        location: "Provo, UT",
        descriptionShort: "Join us for a casual evening picnic.",
        descriptionLong: ""
      },
      Family: {
        name: "Family Luncheon",
        date: "Saturday, June 28, 2024, 11:00 AM",
        location: "Payson, UT",
        descriptionShort: "Family gathering before the sealing.",
        descriptionLong: ""
      },
      Sealing: {
        name: "Sealing Ceremony",
        date: "Saturday, June 28, 2024, 1:45 PM (arrive by 1:15 PM)",
        location: "Payson Utah Temple",
        descriptionShort: "Sacred marriage ceremony for the couple.",
        descriptionLong: ""
      },
      Reception: {
        name: "Wedding Reception",
        date: "Saturday, June 28, 2024, 6:00 PM",
        location: "Springville, UT",
        descriptionShort: "Celebrate the newlyweds and enjoy refreshments.",
        descriptionLong: ""
      },
      California: {
        name: "5k & Picnic Open House",
        date: "Saturday, July 19, 2024, 10:00 AM",
        location: "Atherton, CA",
        descriptionShort: "California celebration with optional 5k run and picnic.",
        descriptionLong: ""
      },
    };

    // Process the event value(s)
    const events = matchRecord.guestRecord.Event.split(";");
    events.push("Reception", "California");
    events.forEach((event) => {
      const trimmedEvent = event.trim();

      // Check if we have details for this event
      const eventInfo = eventDetails[trimmedEvent] || {
        name: trimmedEvent,
        date: "See invitation for details",
        location: "See invitation for details",
        descriptionShort: "",
        descriptionLong: "",
      };

      const eventItem = document.createElement("div");
      eventItem.className = "event-item";

      const eventTitle = document.createElement("h3");
      eventTitle.textContent = eventInfo.name;
      eventTitle.classList.add("center");
      eventItem.appendChild(eventTitle);

      const eventDate = document.createElement("p");
      eventDate.innerHTML = `<strong>Date:</strong> ${eventInfo.date}`;
      eventItem.appendChild(eventDate);

      const eventLocation = document.createElement("p");
      eventLocation.innerHTML = `<strong>Location:</strong> ${eventInfo.location}`;
      eventItem.appendChild(eventLocation);

      const eventDescription = document.createElement("p");
      eventDescription.textContent = eventInfo.descriptionShort;
      eventItem.appendChild(eventDescription);

      const eventDescriptionLong = document.createElement("p");
      eventDescriptionLong.textContent = eventInfo.descriptionLong;
      eventDescriptionLong.classList.add("hidden");
      eventItem.appendChild(eventDescriptionLong);

      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("center");
      const toggleButton = document.createElement("button");
      toggleButton.textContent = "Show More Details";
      toggleButton.classList.add("btn","btn-small");
      buttonContainer.appendChild(toggleButton);
      eventItem.appendChild(buttonContainer);

      toggleButton.addEventListener("click", () => {
        eventDescriptionLong.classList.toggle("hidden");
        if (eventDescriptionLong.classList.contains("hidden")) {
          toggleButton.textContent = "Show More Details";
        } else {
          toggleButton.textContent = "Hide More Details";
        }
      });

      this.elements.eventList.appendChild(eventItem);

    });
  }

  async handleLookup() {
    const enteredName = this.elements.guestNameInput.value.trim();

    if (!enteredName) {
      alert("Please enter a name to search.");
      return;
    }

    try {
      // Use the shared userValidate function
      userValidate({
        enteredName: enteredName,
        onUserValidated: this.displayGuestDetails,
      });
    } catch (error) {
      console.error("Error during guest lookup:", error);
      alert(
        "Name not found on the guest list. Please try a different spelling or contact the host."
      );
    }
  }

  // Handle logout - delete cookie and reset the form
  handleLogout() {
    deleteCookie("validatedWeddingGuest");
    this.elements.nameLookup.style.display = "block";
    this.elements.eventDetailsContent.style.display = "none";
    this.elements.guestNameInput.value = ""; // Clear input field
    this.elements.guestNameInput.focus(); // Focus on input field
  }
}

// Initialize Event Details handler when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  await loadAndParseGuests();
  console.log("Number of parsed guests:", window.parsedGuests.length);
  new EventDetailsHandler();
});
