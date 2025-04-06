/**
 * Guest Utilities - Shared functions for guest management across the wedding website
 * Used by both rsvp.js and event-details.js
 */

/**
 * Parses CSV content string into an array of guest objects.
 * @param {string} csvContent The raw CSV data as a string.
 * @returns {Array<object>} An array of objects, each with 'Event' (string) and 'Party' (array of strings) properties.
 */
function parseRsvpCsv(csvContent) {
  const lines = csvContent.trim().split("\n"); // Split into lines
  const guests = [];

  if (lines.length < 2) {
    console.error(
      "CSV content is too short. Needs at least a header and one data row."
    );
    return guests; // Return empty array if no data
  }

  // Find column indices from header
  const headerLine = lines[0].trim();
  const headers = headerLine.split(",").map((h) => h.trim());

  const listIndex = headers.indexOf("List");
  const partyIndex = headers.indexOf("Party");

  if (listIndex === -1) {
    console.error("CSV header does not contain required column: 'List'");
    return guests;
  }
  if (partyIndex === -1) {
    console.error("CSV header does not contain required column: 'Party'");
    return guests;
  }

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(",").map((v) => v.trim());

    if (values.length > listIndex && values.length > partyIndex) {
      const eventValue = values[listIndex];
      const partyString = values[partyIndex] || "";

      const partyArray = partyString
        .split(";")
        .map((name) => name.trim())
        .filter((name) => name !== "");

      guests.push({
        Event: eventValue,
        Party: partyArray,
      });
    } else {
      console.warn(`Skipping row ${i + 1}: Not enough columns.`);
    }
  }

  return guests;
}

/**
 * Loads and parses guest data from the CSV file
 */
async function loadAndParseGuests() {
  window.parsedGuests = [];
  try {
    // Fetch the CSV file. Adjust the path if 'rsvp.csv' is located elsewhere.
    const response = await fetch("rsvp.csv");

    if (!response.ok) {
      throw new Error(
        `HTTP error! Status: ${response.status} - Could not fetch rsvp.csv`
      );
    }

    const csvData = await response.text(); // Get CSV content as text
    window.parsedGuests = parseRsvpCsv(csvData); // Parse the data and assign to the global scope
  } catch (error) {
    console.error("Error loading or parsing guest data:", error);
    window.parsedGuests = []; // Assign an empty array in case of an error
  }
}

/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} s1 First string
 * @param {string} s2 Second string
 * @returns {number} The Levenshtein distance
 */
function levenshteinDistance(s1, s2) {
  const str1 = String(s1 || "");
  const str2 = String(s2 || "");
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  let prevRow = Array(len2 + 1)
    .fill(0)
    .map((_, i) => i);
  let currentRow = Array(len2 + 1).fill(0);

  for (let i = 1; i <= len1; i++) {
    currentRow[0] = i;
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1, // Insertion
        prevRow[j] + 1, // Deletion
        prevRow[j - 1] + cost // Substitution
      );
    }
    prevRow = [...currentRow];
  }

  return currentRow[len2];
}

/**
 * Helper to normalize names consistently
 */
function normalize(name) {
  return String(name || "")
    .trim()
    .toLowerCase();
}

/**
 * Finds guest records based on a name search using exact and fuzzy matching.
 * @param {string} searchName The name to search for.
 * @returns {Array<object>} An array of match objects { matchedName: string, guestRecord: object },
 * sorted by relevance (exact matches first, then closest fuzzy matches).
 */
function findGuest(searchName) {
  const MAX_DISTANCE = 3; // Maximum allowed Levenshtein distance for fuzzy matches

  // Input Validation & Normalization
  const guestList = window.parsedGuests;
  if (!Array.isArray(guestList) || guestList.length === 0) {
    console.error("Guest list not loaded or empty.");
    return [];
  }

  const normalizedSearchName = normalize(searchName);
  if (!normalizedSearchName) {
    console.warn("Search name is empty.");
    return [];
  }

  // Flatten guest list and calculate distances for all names
  const allPotentialMatches = guestList.flatMap((guestRecord) => {
    if (!guestRecord || !Array.isArray(guestRecord.Party)) {
      console.warn("Skipping invalid guest record:", guestRecord);
      return [];
    }
    return guestRecord.Party.map((nameInParty) =>
      String(nameInParty || "").trim()
    )
      .filter((name) => name)
      .map((originalName) => {
        const normalizedName = originalName.toLowerCase();
        return {
          originalName: originalName,
          distance: levenshteinDistance(normalizedSearchName, normalizedName),
          record: guestRecord,
        };
      });
  });

  // Filter for relevant matches
  const relevantMatches = allPotentialMatches.filter(
    (match) => match.distance <= MAX_DISTANCE
  );

  // Sort matches: Exact matches first, then by distance, then alphabetically
  relevantMatches.sort((a, b) => {
    if (a.distance === 0 && b.distance !== 0) return -1;
    if (a.distance !== 0 && b.distance === 0) return 1;
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.originalName.localeCompare(b.originalName);
  });

  // Determine final result set
  const hasExactMatch = relevantMatches.some((match) => match.distance === 0);
  let finalMatches;

  if (hasExactMatch) {
    finalMatches = relevantMatches.filter((match) => match.distance === 0);
  } else if (relevantMatches.length > 0) {
    finalMatches = relevantMatches.slice(0, 5); // Return up to 5 fuzzy matches
  } else {
    finalMatches = [];
  }

  return finalMatches.map(({ originalName, record }) => ({
    matchedName: originalName,
    guestRecord: record,
  }));
}

/**
 * Creates and displays a selection dialog for choosing between multiple guest records
 *
 * @param {Object} options - Configuration options for the dialog
 * @param {Array} options.matchRecords - Array of match records to display
 * @param {string} options.searchValue - The original search value entered by the user
 * @param {Function} options.onSelect - Callback function called when a record is selected, receives the selected record
 * @param {boolean} [options.foundExactMatch=false] - Whether an exact match was found
 */
function createSelectionDialog(options) {
  const {
    matchRecords,
    searchValue,
    onSelect,
    foundExactMatch = false,
  } = options;

  const modalBackdrop = document.createElement("div");
  modalBackdrop.className = "modal-backdrop";
  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  const title = document.createElement("p");
  const prefix = foundExactMatch ? "Multiple matches" : "No exact match";
  title.textContent = `${prefix} found for input: ${searchValue}`;
  title.className = "modal-title";
  modalContent.appendChild(title);
  const instructions = document.createElement("p");
  instructions.textContent = "Please select your name from the list below:";
  instructions.className = "modal-instructions";
  modalContent.appendChild(instructions);

  // Add list of options
  const optionsList = document.createElement("div");
  optionsList.className = "modal-options-list";
  matchRecords.forEach((record) => {
    const optionButton = document.createElement("button");
    optionButton.className = "option-button";

    // Display name with party information
    const recordInfo = document.createElement("div");
    recordInfo.className = "option-info";
    const nameText = document.createElement("strong");
    nameText.textContent = record.matchedName;
    nameText.className = "option-name";
    const partyText = document.createElement("span");

    // Get party members without the matched name
    const otherPartyMembers = record.guestRecord.Party.filter(
      (member) => member !== record.matchedName
    ).join(", ");

    if (otherPartyMembers) {
      partyText.textContent = `Party with: ${otherPartyMembers}`;
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

      // Call the provided callback with the selected record
      if (typeof onSelect === "function") {
        onSelect(record);
      }
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

  // Add click handler to the backdrop to close when clicked outside the content
  modalBackdrop.addEventListener("click", (e) => {
    // Check if the click was directly on the backdrop (not on any of its children)
    if (e.target === modalBackdrop) {
      document.body.removeChild(modalBackdrop);
    }
  });

  document.body.appendChild(modalBackdrop);
}

/**
 * Wrapper for user validation that handles cookie management
 *
 * @param {Object} options - Configuration options for user validation
 * @param {string} options.enteredName - The name entered by the user
 * @param {Function} options.onUserValidated - Callback called when a user is validated, receives the match record
 * @param {string} [options.cookieName='validatedWeddingGuest'] - Name of the cookie to store the validated user
 * @param {number} [options.cookieExpiryDays=100] - Number of days until the cookie expires
 */
function userValidate(options) {
  const {
    enteredName,
    onUserValidated,
    cookieName = "validatedWeddingGuest",
    cookieExpiryDays = 100,
  } = options;

  // Check if a valid cookie exists
  const savedUserJSON = getCookie(cookieName);

  if (savedUserJSON) {
    try {
      const savedUser = JSON.parse(savedUserJSON);
      // Verify the saved user record matches what's in our current guest list
      const currentRecord = validateSavedUser(savedUser);

      if (currentRecord) {
        console.log("Using saved user validation from cookie");
        onUserValidated(currentRecord);
        return;
      } else {
        // Invalid or outdated cookie - clear it
        deleteCookie(cookieName);
      }
    } catch (error) {
      console.error("Error parsing saved user cookie:", error);
      deleteCookie(cookieName);
    }
  }

  // If we didn't find a valid cookie, proceed with normal validation
  try {
    const matchRecords = findGuest(enteredName);

    if (
      matchRecords.length === 1 &&
      normalize(matchRecords[0].matchedName) === normalize(enteredName)
    ) {
      // Single match found - save cookie and call handler
      saveUserCookie(matchRecords[0], cookieName, cookieExpiryDays);
      onUserValidated(matchRecords[0]);
    } else if (matchRecords.length >= 1) {
      // Multiple matches found - show selection dialog
      createSelectionDialog({
        matchRecords: matchRecords,
        searchValue: enteredName,
        onSelect: (selectedRecord) => {
          // Save cookie and call handler when a user is selected
          saveUserCookie(selectedRecord, cookieName, cookieExpiryDays);
          onUserValidated(selectedRecord);
        },
        foundExactMatch: matchRecords.some(
          (record) => normalize(record.matchedName) === normalize(enteredName)
        ),
      });
    } else {
      // No matches found
      throw new Error("Name not found on the guest list");
    }
  } catch (error) {
    console.error("Error during user validation:", error);
    throw error;
  }
}

/**
 * Save user record in a cookie
 *
 * @param {Object} matchRecord - The user record to save
 * @param {string} cookieName - Name of the cookie
 * @param {number} expiryDays - Number of days until the cookie expires
 */
function saveUserCookie(matchRecord, cookieName, expiryDays) {
  try {
    // Create a simplified version of the match record to store in the cookie
    const cookieData = {
      matchedName: matchRecord.matchedName,
      guestRecord: {
        Event: matchRecord.guestRecord.Event,
        Party: matchRecord.guestRecord.Party,
      },
    };

    // Use Base64 encoding to avoid special character issues
    const jsonStr = JSON.stringify(cookieData);
    const encodedData = btoa(encodeURIComponent(jsonStr));

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    document.cookie = `${cookieName}=${encodedData};expires=${expiryDate.toUTCString()};path=/;SameSite=Strict`;
  } catch (error) {
    console.error("Error saving user cookie:", error);
  }
}

/**
 * Retrieve a cookie by name
 *
 * @param {string} cookieName - Name of the cookie to retrieve
 * @returns {string|null} Cookie value or null if not found
 */
function getCookie(cookieName) {
  try {
    const name = cookieName + "=";
    const cookieArray = document.cookie.split(";");

    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        // Get the encoded value and decode it from Base64
        const encodedValue = cookie.substring(name.length, cookie.length);
        return decodeURIComponent(atob(encodedValue));
      }
    }
  } catch (error) {
    console.error("Error retrieving cookie:", error);
  }
  return null;
}

/**
 * Delete a cookie by name
 *
 * @param {string} cookieName - Name of the cookie to delete
 */
function deleteCookie(cookieName) {
  document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
}

/**
 * Validate if a saved user record matches current guest data
 *
 * @param {Object} savedUser - The user record from the cookie
 * @returns {Object|null} Valid match record or null if invalid
 */
function validateSavedUser(savedUser) {
  if (!savedUser || !savedUser.matchedName || !savedUser.guestRecord) {
    return null;
  }

  try {
    // Check if the saved user is in the current guest list
    const currentRecords = findGuest(savedUser.matchedName);

    // Find the exact match by name
    const matchedRecord = currentRecords.find(
      (record) =>
        normalize(record.matchedName) === normalize(savedUser.matchedName)
    );

    if (matchedRecord) {
      return matchedRecord;
    }

    return null;
  } catch (error) {
    console.error("Error validating saved user:", error);
    return null;
  }
}
