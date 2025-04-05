/**
 * Parses CSV content string into an array of guest objects.
 * Assumes the CSV has columns "List" and "Party".
 *
 * @param {string} csvContent The raw CSV data as a string.
 * @returns {Array<object>} An array of objects, each with 'Event' (string) and 'Party' (array of strings) properties.
 */
function parseRsvpCsv(csvContent) {
    const lines = csvContent.trim().split('\n'); // Split into lines
    const guests = [];

    if (lines.length < 2) {
        console.error("CSV content is too short. Needs at least a header and one data row.");
        return guests; // Return empty array if no data
    }

    // --- Find column indices from header ---
    const headerLine = lines[0].trim();
    // Basic CSV split, assuming no commas within quoted fields for simplicity
    const headers = headerLine.split(',').map(h => h.trim());

    const listIndex = headers.indexOf('List');
    const partyIndex = headers.indexOf('Party');
    // Note: "Form input" index is not needed based on requirements

    if (listIndex === -1) {
        console.error("CSV header does not contain required column: 'List'");
        return guests; // Return empty if required header is missing
    }
    if (partyIndex === -1) {
        console.error("CSV header does not contain required column: 'Party'");
        return guests; // Return empty if required header is missing
    }

    // --- Process data rows ---
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        // Basic CSV split, same assumption as header
        const values = line.split(',').map(v => v.trim());

        // Ensure the row has enough columns based on the needed indices
        if (values.length > listIndex && values.length > partyIndex) {
            const eventValue = values[listIndex];
            const partyString = values[partyIndex] || ''; // Get party string, default to empty string if undefined/null

            // Split the party string by ';', trim each resulting name, and filter out any empty strings
            const partyArray = partyString.split(';')
                                         .map(name => name.trim())
                                         .filter(name => name !== ''); // Remove empty entries potentially caused by trailing semicolons or double semicolons

            guests.push({
                Event: eventValue,
                Party: partyArray
            });
        } else {
            console.warn(`Skipping row ${i + 1}: Not enough columns.`);
        }
    }

    return guests;
}

async function loadAndParseGuests() {
    window.parsedGuests = []
    try {
        // Fetch the CSV file. Adjust the path if 'rsvp.csv' is located elsewhere.
        const response = await fetch('rsvp.csv');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - Could not fetch rsvp.csv`);
        }

        const csvData = await response.text(); // Get CSV content as text
        window.parsedGuests = parseRsvpCsv(csvData); // Parse the data and assign to the global scope

        // console.log('Guests successfully parsed and stored in window.parsedGuests:');
        // console.log(window.parsedGuests);

    } catch (error) {
        console.error('Error loading or parsing guest data:', error);
        window.parsedGuests = []; // Assign an empty array in case of an error
    }
}

/**
 * Calculates the Levenshtein distance between two strings.
 * (Minimum number of single-character edits: insertions, deletions, substitutions).
 * @param {string} s1 The first string.
 * @param {string} s2 The second string.
 * @returns {number} The Levenshtein distance.
 */
function levenshteinDistance(s1, s2) {
    // Ensure strings are strings and handle potential null/undefined inputs
    const str1 = String(s1 || '');
    const str2 = String(s2 || '');
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    // Use a single array to optimize space slightly (optional, matrix is often clearer)
    let prevRow = Array(len2 + 1).fill(0).map((_, i) => i);
    let currentRow = Array(len2 + 1).fill(0);

    for (let i = 1; i <= len1; i++) {
        currentRow[0] = i;
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            currentRow[j] = Math.min(
                currentRow[j - 1] + 1,      // Insertion
                prevRow[j] + 1,          // Deletion
                prevRow[j - 1] + cost     // Substitution
            );
        }
        prevRow = [...currentRow]; // Update prevRow for the next iteration
    }

    return currentRow[len2];
}

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
      nameDisplay: document.getElementById("guest-name-display"),
      nameWrapper: document.getElementById("name-display-wrapper"),
      message: document.getElementById("rsvp-message"),
      attendingOptions: document.getElementById("attending-options"),
      idahoQuestion: document.getElementById("idaho-question"),
      fridayQuestion: document.getElementById("friday-question"),
      partyMembersInput: document.getElementById("party-members"),
    };

    this.state = {
      submissionSuccessful: false,
      currentGuest: null,
    };

    // Bind event handlers
    this.handleLookup = this.handleLookup.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    // Initialize
    this.init();
  }

  init() {
    // Add event listeners
    this.elements.lookupButton.addEventListener("click", this.handleLookup);
    this.elements.form.addEventListener("submit", this.handleSubmit);

    // Check for previous submission
    if (this.state.submissionSuccessful) {
      this.updateUIForSubmission();
    }

    // Add listener for Idaho event question to show/hide Idaho guests section
    const idahoOptions = document.querySelectorAll(
      'input[name="entry.1284767391"]'
    );
    idahoOptions.forEach((option) => {
      option.addEventListener("change", (e) => {
        const idahoGuestsSection = document.getElementById("idaho-guests");
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
  }

  /**
   * Finds guest records based on a name search using exact and fuzzy matching.
   * Searches within the 'Party' array of each guest record.
   *
   * @param {string} searchName The name to search for.
   * @returns {Array<object>} An array of match objects { matchedName: string, guestRecord: object },
   * sorted by relevance (exact matches first, then closest fuzzy matches).
   * Returns an empty array if no suitable match is found.
   */
  findGuest(searchName) {
    const MAX_DISTANCE = 3; // Maximum allowed Levenshtein distance for fuzzy matches

    // 1. Input Validation & Normalization
    const guestList = window.parsedGuests;
    if (!Array.isArray(guestList) || guestList.length === 0) {
      console.error("Guest list not loaded or empty.");
      return [];
    }
    // Helper to normalize names consistently
    const normalize = (name) =>
      String(name || "")
        .trim()
        .toLowerCase();

    const normalizedSearchName = normalize(searchName);
    if (!normalizedSearchName) {
      console.warn("Search name is empty.");
      return [];
    }

    // 2. Flatten guest list and calculate distances for all names
    const allPotentialMatches = guestList.flatMap((guestRecord) => {
      // Ensure guestRecord and Party are valid before mapping
      if (!guestRecord || !Array.isArray(guestRecord.Party)) {
        console.warn("Skipping invalid guest record:", guestRecord);
        return []; // Skip this record by returning an empty array for flatMap
      }
      return guestRecord.Party.map((nameInParty) =>
        String(nameInParty || "").trim()
      ) // Trim original name
        .filter((name) => name) // Filter out empty names after trimming
        .map((originalName) => {
          const normalizedName = originalName.toLowerCase(); // No need for normalize() again
          return {
            originalName: originalName,
            distance: levenshteinDistance(normalizedSearchName, normalizedName),
            record: guestRecord,
          };
        });
    });

    // 3. Filter for relevant matches (exact or within MAX_DISTANCE)
    const relevantMatches = allPotentialMatches.filter(
      (match) => match.distance <= MAX_DISTANCE
    );

    // 4. Sort matches: Exact matches (distance 0) first, then by distance, then alphabetically
    relevantMatches.sort((a, b) => {
      // Prioritize exact matches (distance 0)
      if (a.distance === 0 && b.distance !== 0) return -1;
      if (a.distance !== 0 && b.distance === 0) return 1;
      // If both exact or both fuzzy, sort by distance
      if (a.distance !== b.distance) return a.distance - b.distance;
      // Tie-break by name alphabetically for consistent ordering
      return a.originalName.localeCompare(b.originalName);
    });

    // 5. Determine final result set based on whether exact matches were found
    const hasExactMatch = relevantMatches.some((match) => match.distance === 0);
    let finalMatches;

    if (hasExactMatch) {
      // Return all exact matches found
      finalMatches = relevantMatches.filter((match) => match.distance === 0);
      console.log(
        `Found ${finalMatches.length} exact match(es) for "${normalizedSearchName}".`
      );
    } else if (relevantMatches.length > 0) {
      // No exact matches, return top 5 fuzzy matches (already sorted)
      finalMatches = relevantMatches.slice(0, 3);
      console.log(
        `No exact match for "${normalizedSearchName}". Found ${finalMatches.length} potential fuzzy match(es):`,
        finalMatches.map((m) => `${m.originalName} (Dist: ${m.distance})`)
      );
    } else {
      // No relevant matches at all
      finalMatches = [];
      console.log(
        `No exact or close fuzzy match found for "${normalizedSearchName}".`
      );
    }

    // 6. Format output
    return finalMatches.map(({ originalName, record }) => ({
      matchedName: originalName,
      guestRecord: record,
    }));
  }

  updateUIForGuestFound(matchRecord) {
    // Update name display
    this.elements.nameInput.value = matchRecord.matchedName;
    this.elements.nameDisplay.textContent = matchRecord.matchedName;
    let guest = matchRecord.guestRecord;

    // Get other party members (excluding the matched name)
    const otherPartyMembers = matchRecord.guestRecord.Party.filter(
      (member) => member !== matchRecord.matchedName
    ).join(", ");
    this.elements.partyMembersInput.value = otherPartyMembers;

    // Update visibility
    this.elements.nameInput.style.display = "none";
    this.elements.nameDisplay.style.display = "block";
    this.elements.nameLookup.style.display = "none";
    this.elements.form.style.display = "block";
    this.elements.message.style.display = "none";

    // Store current guest
    this.state.currentGuest = matchRecord;

    // Reset special event questions
    if (this.elements.idahoQuestion)
      this.elements.idahoQuestion.style.display = "none";
    if (this.elements.fridayQuestion)
      this.elements.fridayQuestion.style.display = "none";

    // Show specific event questions
    if (
      ["Idaho", "Everything"].includes(guest.Event) &&
      this.elements.idahoQuestion
    ) {
      this.elements.idahoQuestion.style.display = "block";
    }
    if (
      ["Friday", "Everything"].includes(guest.Event) &&
      this.elements.fridayQuestion
    ) {
      this.elements.fridayQuestion.style.display = "block";
    }
    if (
      ["Family", "Everything"].includes(guest.Event) &&
      this.elements.familyQuestion
    ) {
      this.elements.familyQuestion.style.display = "block";
    }
    if (
      ["Sealing", "Everything"].includes(guest.Event) &&
      this.elements.sealingQuestion
    ) {
      this.elements.sealingQuestion.style.display = "block";
    }
  }

  updateUIForSubmission() {
    this.elements.form.style.display = "none";
    this.elements.nameLookup.style.display = "none";
    this.elements.message.style.display = "block";
  }

  showError(message) {
    alert(message);
  }

  createSelectionDialog(matchRecords) {
    // Create modal backdrop
    const modalBackdrop = document.createElement("div");
    modalBackdrop.className = "modal-backdrop";

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    // Add title
    const title = document.createElement("h3");
    title.textContent = "Multiple matches found";
    title.className = "modal-title";
    modalContent.appendChild(title);

    // Add instructions
    const instructions = document.createElement("p");
    instructions.textContent = "Please select your name from the list below:";
    instructions.className = "modal-instructions";
    modalContent.appendChild(instructions);

    // Add list of options
    const optionsList = document.createElement("div");
    optionsList.className = "modal-options-list";

    // Add each option as a button
    matchRecords.forEach((record) => {
      const optionButton = document.createElement("button");
      optionButton.className = "option-button";

      // Display name with party information
      const recordInfo = document.createElement("div");
      recordInfo.className = "option-info";

      // Name
      const nameText = document.createElement("strong");
      nameText.textContent = record.matchedName;
      nameText.className = "option-name";

      // Party members info
      const partyText = document.createElement("span");

      // Get party members without the matched name
      const otherPartyMembers = record.guestRecord.Party.filter(
        (member) => member !== record.matchedName
      ).join(", ");

      if (otherPartyMembers) {
        partyText.textContent = `Other Party Members: ${otherPartyMembers}`;
      } else {
        partyText.textContent = "No other party members";
      }
      partyText.className = "option-event"; // Reusing the existing CSS class

      // Add to container
      recordInfo.appendChild(nameText);
      recordInfo.appendChild(partyText);
      optionButton.appendChild(recordInfo);

      // Add click handler
      optionButton.addEventListener("click", () => {
        // Remove the modal
        document.body.removeChild(modalBackdrop);

        // Update the UI with the selected guest
        this.updateUIForGuestFound(record);
      });

      optionsList.appendChild(optionButton);
    });

    modalContent.appendChild(optionsList);

    // Add close/cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "cancel-button";

    // Add click handler for cancel button
    cancelButton.addEventListener("click", () => {
      document.body.removeChild(modalBackdrop);
    });

    modalContent.appendChild(cancelButton);
    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);
  }

  async handleLookup() {
    if (this.state.submissionSuccessful) return;

    const enteredName = this.elements.guestNameInput.value.trim();

    try {
      const matchRecords = this.findGuest(enteredName);

      if (matchRecords.length === 1) {
        // Single match found - update UI directly
        this.updateUIForGuestFound(matchRecords[0]);
      } else if (matchRecords.length > 1) {
        // Multiple matches found - show selection dialog
        this.createSelectionDialog(matchRecords);
      } else {
        // No matches found
        this.showError(
          "Name not found on the guest list. Please try again or contact the host."
        );
      }
    } catch (error) {
      console.error("Error during guest lookup:", error);
      this.showError("Error loading guest list. Please contact the host.");
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
}

// Initialize RSVP handler when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadAndParseGuests();
    console.log('Number of parsed guests:', window.parsedGuests.length);
    new RSVPHandler();
}); 