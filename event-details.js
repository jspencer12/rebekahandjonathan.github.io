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
        date: "Wednesday, June 25 @ 12pm - Friday, June 27 @ 11am, 2025",
        location: "Sky Mountain Ranch, 4391 W 9000 S, Victor, ID 83455",
        description:
          "A few days together in Teton Valley, Idaho to create new memories together before the wedding.",
        descriptionLong: `<h4>Overview</h4>
        <p>We are so excited to spend time with you at Jonekah's Ranch Rodeo! We know time is your most valuable resource and we are grateful for the chance to spend it with you.</p>
        <p>Please take some time to look through our <a href="https://docs.google.com/spreadsheets/d/16UwVw72FbFisB9dX5P6EEWCHjYJOYdcQ1weiqvKutUU/edit?usp=sharing" target="_blank" class="schedule-link">detailed schedule</a> to get a better idea of what we have planned.</p>
        
        <h4>Weather & What to Bring</h4>
        <p>Average temperatures in Victor, Idaho range from 49°F at night to 81°F in the day.</p>
        <p><strong>Dress code:</strong> Anything you want! You will likely want cool clothes for the day, layers for the evenings, and an outfit you want to dance the night away in for the barn dance.</p>
        
        <h4>Schedule & Activities</h4>
        <p>Here is the  <a href="https://docs.google.com/spreadsheets/d/16UwVw72FbFisB9dX5P6EEWCHjYJOYdcQ1weiqvKutUU/edit?usp=sharing" target="_blank" class="schedule-link">detailed schedule</a> with all the activities for the three days. While there are activities scheduled throughout each day, you are free to spend your time however you want. You can take a dip in the pond, challenge someone in a pickleball match, or start a side conversation with a new friend.</p>
        
        <h4>Food</h4>
        <p>We will have a food coordinator for all the meals during our time at Sky Mountain. To make meals for this size of group more feasible, we are going to ask everyone to pitch in on cooking and/or cleaning a meal or two. We will send out meal prep assignments closer to the event. Please let us know if you have any allergies or won't be around for any of the meals.</p>
        
        <h4>Communication</h4>
        <p>Once you have RSVP'ed "coming" to the ranch rodeo, we will add you to a Whatsapp group with all the attendees.</p>
        
        <h4>Travel Information</h4>
        <p><strong>Salt Lake City Airport (recommended option)</strong><br>
        279 miles away<br>
        Since the wedding itself and reception are in Utah, this is a good option to fly into, drive up to Idaho, drive back down for the reception, and then fly home.</p>
        <p>We recommend:</p>
        <ul>
          <li>Fly into SLC Tuesday evening or Wednesday morning</li>
          <li>Drive from SLC to Victor, Idaho on Wednesday morning</li>
          <li>Drive from Idaho back down to Utah on Friday afternoon</li>
          <li>Party all day Saturday</li>
          <li>Fly home from SLC on Sunday</li>
        </ul>
        
        <p><strong>Jackson Hole Airport</strong><br>
        38 miles away, about an hour drive<br>
        Tends to be pricey</p>
        
        <h4>Local Recommendations</h4>
        <p><strong>Favorite restaurants in the area:</strong></p>
        <ul>
          <li>Butter Cafe for brunch</li>
          <li>Knotty Pine Supper Club for barbecue</li>
          <li>Victor Emporium for shakes</li>
        </ul>
        
        <p><strong>Amazing hikes in the area:</strong></p>
        <ul>
          <li>Wind Caves (6.3 miles)</li>
          <li>Lower Palisades (8.8 miles)</li>
          <li>Green Lakes (14.9 miles)</li>
          <li>Taylor Mountain (14.2 miles)</li>
        </ul>`,
      },
      Friday: {
        name: "Midsommar Picnic in Provo",
        date: "Friday, June 27, 2025, 6:00 PM - 8:00 PM",
        location: "South Fork Park, 4988 North South Fork Rd., Provo UT 84604",
        description:
          "A Swedish Midsommar themed picnic in the gorgeous Utah mountains and a chance for relaxed chats before the wedding day.",
        descriptionLong: `
        <h4>Dress Code</h4>
        <p>Picnic chic. Think a light summer dress or linen shirt.</p>
        <p><strong>Weather: </strong>Average temperatures in Provo, Utah range from 61°F at night to 92°F on a typical June day.</p>`,
      },
      Family: {
        name: "Family Luncheon",
        date: "Saturday, June 28, 2025, 11:00 AM",
        location: "Clarion Gardens, 463 E 100 N, Payson UT 84651",
        description: "Family gathering before the sealing ceremony.",
      },
      Sealing: {
        name: "Sealing Ceremony",
        date: "Saturday, June 28, 2025, 1:45 PM (arrive by 1:15 PM)",
        location: "Payson Utah Temple, 1494 S 930 W St, Payson UT 84651",
        description: "Sacred marriage ceremony for the couple.",
      },
      Reception: {
        name: "Wedding Reception",
        date: "Saturday, June 28, 2025, 6:00 PM - 9:30 PM",
        location:
          "Hitching Post Event Venue, 1520 N Main Street, Springville UT 84663",
        description:
          "Open house style reception with food, dancing, and fun activities.",
        descriptionLong: `<h4>Overview</h4>
        <p>Open house style reception. There will be food, dancing, and fun ways to get to know us. Kids are welcome.</p>
        
        <h4>Dress Code</h4>
        <div class="dress-code-container">
          <div class="dress-code-text">
            <p>Cocktail attire.</p> <p>The wedding party will be in black. <span class="black-bold">All other guests are invited to wear something in our sunset color palette pictured to the right.</span></p>
            <p><strong>Weather: </strong>Outside temperatures in Springville, Utah range from 59°F at night to 85°F on a typical June day. However, the venue has air conditioning!</p>
          </div>
          <div class="color-palette-img">
            <img src="images/webp/WeddingGuestColorsSunset.webp" alt="Sunset color palette for wedding guests" style="max-width: 100%; border-radius: 4px;">
          </div>
        </div>
        
        <h4>Schedule</h4>
        <ul>
          <li>6:00 - 7:00 PM: Receiving line + food</li>
          <li>7:15 PM: Cake cutting</li>
          <li>7:30 PM: Toasts</li>
          <li>7:45 PM: Special presentation from the newly weds</li>
          <li>8:00 - 9:00 PM: Dance party</li>
          <li>9:15 PM: Flower petal exit</li>
        </ul>
        
        <h4>Local Recommendations</h4>
        <p><strong>Hikes:</strong></p>
        <ul>
          <li>Scout Falls (2.9 miles)</li>
          <li>Mount Timpanogos (14.2 miles, 4471 ft elevation gain)</li>
          <li>Y Mountain (6.6 miles, a BYU classic)</li>
        </ul>
        
        <p><strong>Food:</strong></p>
        <ul>
          <li>Gourmandise for great pastries</li>
          <li>Màstra in American Fork for shockingly good Italian food</li>
        </ul>`,
      },
      California: {
        name: "5k & Picnic Open House",
        date: "Saturday, July 19, 2025, 10:00 AM - 1:00 PM",
        location: "Holbrook Palmer Park, 150 Watkins Ave, Atherton, CA 94027",
        description: "California celebration with optional 5k run and picnic.",
        descriptionLong: `<h4>Overview</h4>
        <p>Come jog a 5k with us or just bring your picnic blanket and join us for bagels in the park. For the 5k we are running 4 laps around the park, so feel free to join for however many laps you'd like or walk while the runners run. Kids are welcome!</p>
        
        <h4>Dress Code</h4>
        <p>Casual/athletic. We will be in our running clothes from the 5k, so don't make us feel out of place!</p>
        
        <h4>Schedule</h4>
        <ul>
          <li>10:00 AM: 5k course overview</li>
          <li>10:15 AM: 5k starts</li>
          <li>10:45 AM: Cheer runners on at the finish line</li>
          <li>11:00 AM: "Cake cutting"</li>
          <li>11:00 AM - 12:00 PM: Mingling and picnicking</li>
          <li>12:00 PM: Special presentation from the newly wed couple</li>
          <li>1:00 PM: "Send off the newly weds"</li>
        </ul>`,
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
        description: "",
        descriptionLong: "",
      };

      const eventItem = document.createElement("div");
      eventItem.className = "event-item";

      const eventTitle = document.createElement("h3");
      eventTitle.textContent = eventInfo.name;
      eventTitle.classList.add("center");
      eventItem.appendChild(eventTitle);

      if (trimmedEvent === "Friday" && events.includes("Idaho")) {
        const eventSubtitle = document.createElement("p");
        eventSubtitle.style.marginTop = "-10px";
        eventSubtitle.innerHTML = "<center><i>(For those who can't make it to Idaho)</i></center>";
        eventItem.appendChild(eventSubtitle);
      }

      const eventDate = document.createElement("p");
      eventDate.innerHTML = `<strong>Date:</strong> ${eventInfo.date}`;
      eventItem.appendChild(eventDate);

      const eventLocation = document.createElement("p");
      eventLocation.innerHTML = `<strong>Location:</strong> ${eventInfo.location}`;
      eventItem.appendChild(eventLocation);

      const eventDescription = document.createElement("p");
      eventDescription.textContent = eventInfo.description;
      eventItem.appendChild(eventDescription);

      // Create a section for the detailed description if it exists
      if (eventInfo.descriptionLong) {
        const detailsSection = document.createElement("div");
        detailsSection.className = "event-details-section hidden";
        detailsSection.innerHTML = eventInfo.descriptionLong;
        eventItem.appendChild(detailsSection);

        // Add toggle button if there's detailed description
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("center");
        const toggleButton = document.createElement("button");
        toggleButton.textContent = "Show More Details";
        toggleButton.classList.add("btn", "btn-small");
        toggleButton.style.marginTop = "5px";
        buttonContainer.appendChild(toggleButton);
        eventItem.appendChild(buttonContainer);

        toggleButton.addEventListener("click", () => {
          detailsSection.classList.toggle("hidden");
          if (detailsSection.classList.contains("hidden")) {
            toggleButton.textContent = "Show More Details";
          } else {
            toggleButton.textContent = "Hide Details";
          }
        });
      }

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
