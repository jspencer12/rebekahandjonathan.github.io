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
            console.error('Guest list not loaded or empty.');
            return [];
        }

        const trimmedSearchName = String(searchName || '').trim();
        if (!trimmedSearchName) {
            console.warn('Search name is empty.');
            return [];
        }
        const lowerCaseSearchName = trimmedSearchName.toLowerCase();

        // Helper to normalize names consistently
        const normalize = (name) => String(name || '').trim().toLowerCase();

        // 2. Flatten guest list and calculate distances for all names
        const allPotentialMatches = guestList.flatMap(guestRecord => {
            // Ensure guestRecord and Party are valid before mapping
            if (!guestRecord || !Array.isArray(guestRecord.Party)) {
                console.warn('Skipping invalid guest record:', guestRecord);
                return []; // Skip this record by returning an empty array for flatMap
            }
            return guestRecord.Party
                .map(nameInParty => String(nameInParty || '').trim()) // Trim original name
                .filter(name => name) // Filter out empty names after trimming
                .map(originalName => {
                    const normalizedName = originalName.toLowerCase(); // No need for normalize() again
                    return {
                        originalName: originalName,
                        distance: levenshteinDistance(lowerCaseSearchName, normalizedName),
                        record: guestRecord
                    };
                });
        });

        // 3. Filter for relevant matches (exact or within MAX_DISTANCE)
        const relevantMatches = allPotentialMatches.filter(match => match.distance <= MAX_DISTANCE);

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
        const hasExactMatch = relevantMatches.some(match => match.distance === 0);
        let finalMatches;

        if (hasExactMatch) {
            // Return all exact matches found
            finalMatches = relevantMatches.filter(match => match.distance === 0);
            console.log(`Found ${finalMatches.length} exact match(es) for "${trimmedSearchName}".`);
        } else if (relevantMatches.length > 0) {
            // No exact matches, return top 2 fuzzy matches (already sorted)
            finalMatches = relevantMatches.slice(0, 2);
            console.log(`No exact match for "${trimmedSearchName}". Found ${finalMatches.length} potential fuzzy match(es):`, finalMatches.map(m => `${m.originalName} (Dist: ${m.distance})`));
        } else {
            // No relevant matches at all
            finalMatches = [];
            console.log(`No exact or close fuzzy match found for "${trimmedSearchName}".`);
        }

        // 6. Format output
        return finalMatches.map(({ originalName, record }) => ({
            matchedName: originalName,
            guestRecord: record
        }));
    }

    updateUIForGuestFound(matchRecord) {
        // Update name display
        this.elements.nameInput.value = matchRecord.matchedName;
        this.elements.nameDisplay.textContent = matchRecord.matchedName;
        let guest = matchRecord.guestRecord;
        // let party = findGuestResult.guestRecord.Party; // make a copy rather than reference existing object
        // remove matchedName from party array
        
        // this.elements.partyInput.value = party;
        // this.elements.partyDisplay.textContent = party;
        
        // Update visibility
        this.elements.nameInput.style.display = 'none';
        this.elements.nameDisplay.style.display = 'block';
        this.elements.nameLookup.style.display = 'none';
        this.elements.form.style.display = 'block';
        this.elements.message.style.display = 'none';

        // Store current guest
        this.state.currentGuest = matchRecord;

        // Reset special event questions
        if (this.elements.idahoQuestion) this.elements.idahoQuestion.style.display = 'none';
        if (this.elements.fridayQuestion) this.elements.fridayQuestion.style.display = 'none';

        // Show specific event questions
        if (['Idaho', 'Everything'].includes(guest.Event) && this.elements.idahoQuestion) {
            this.elements.idahoQuestion.style.display = 'block';
        }
        if (['Friday', 'Everything'].includes(guest.Event) && this.elements.fridayQuestion) {
            this.elements.fridayQuestion.style.display = 'block';
        }
        if (['Family', 'Everything'].includes(guest.Event) && this.elements.familyQuestion) {
            this.elements.familyQuestion.style.display = 'block';
        }
        if (['Sealing', 'Everything'].includes(guest.Event) && this.elements.sealingQuestion) {
            this.elements.sealingQuestion.style.display = 'block';
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
            const findGuestResult = this.findGuest(enteredName);
            
            if (findGuestResult.length == 1) {
                this.updateUIForGuestFound(findGuestResult[0]);
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
document.addEventListener('DOMContentLoaded', async () => {
    await loadAndParseGuests();
    console.log('Number of parsed guests:', window.parsedGuests.length);
    new RSVPHandler();
}); 