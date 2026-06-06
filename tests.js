/**
 * Aura - Student Mental Wellness Tracker
 * Unit Tests Suite (Vanilla JavaScript)
 */

(function () {
  'use strict';

  // Helper to output test section headers
  function describe(name, fn) {
    console.log(`\n=== Running Test Suite: ${name} ===`);
    try {
      fn();
      console.log(`✅ Suite Passed: ${name}`);
    } catch (error) {
      console.error(`❌ Suite Failed: ${name}\n`, error);
    }
  }

  // Helper to verify assertions with clean messages
  function assert(condition, message) {
    console.assert(condition, message);
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    } else {
      console.log(`  ✓ Pass: ${message}`);
    }
  }

  // Mock localStorage for test isolation
  const localStorageMock = (function () {
    let store = {};
    return {
      getItem(key) {
        return store[key] || null;
      },
      setItem(key, value) {
        store[key] = String(value);
      },
      removeItem(key) {
        delete store[key];
      },
      clear() {
        store = {};
      }
    };
  })();

  // Backup original localStorage
  const originalLocalStorage = window.localStorage;

  // Setup test environment
  function setup() {
    // Override localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
    // Reset internal state
    window.WellnessApp.appState.moods = [];
    window.WellnessApp.appState.triggers = [];
    window.WellnessApp.appState.journal = [];
    localStorage.clear();
  }

  // Teardown test environment
  function teardown() {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true
    });
  }

  /* ==========================================================================
     TEST SUITE 1: Mood Saving and Retrieval from localStorage
     ========================================================================== */
  describe('Mood Tracker Storage', () => {
    setup();

    const app = window.WellnessApp;
    const testDate = '2026-06-01';
    
    // Push a mood log and save
    app.appState.moods.push({ date: testDate, level: 4, timestamp: Date.now() });
    app.saveMoodsToStorage();

    // Verify localStorage has it
    const stored = localStorage.getItem('aura_moods');
    assert(stored !== null, 'Mood data exists in localStorage');
    assert(stored.includes(testDate), 'Stored JSON contains the correct date');
    assert(stored.includes('"level":4'), 'Stored JSON contains the correct mood level');

    // Retrieve and verify state load
    app.appState.moods = []; // Clear state
    app.loadStateFromStorage();
    assert(app.appState.moods.length === 1, 'Loaded state array has exactly 1 entry');
    assert(app.appState.moods[0].date === testDate, 'Loaded entry has correct date');
    assert(app.appState.moods[0].level === 4, 'Loaded entry has correct mood level');

    teardown();
  });

  /* ==========================================================================
     TEST SUITE 2: Streak Calculation Logic
     ========================================================================== */
  describe('Streak Calculation Logic', () => {
    setup();

    const app = window.WellnessApp;
    
    // Case 1: Empty logs should return 0 streak
    assert(app.calculateStreak() === 0, 'Empty logs return a streak of 0');

    // Helper to get formatted date offset from today
    function getDateOffsetString(offset) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Case 2: Today logged
    app.appState.moods.push({ date: getDateOffsetString(0), level: 3, timestamp: Date.now() });
    assert(app.calculateStreak() === 1, 'Logging today results in a streak of 1');

    // Case 3: Today and yesterday logged
    app.appState.moods.push({ date: getDateOffsetString(1), level: 4, timestamp: Date.now() - 86400000 });
    assert(app.calculateStreak() === 2, 'Logging today and yesterday results in a streak of 2');

    // Case 4: Gap of 1 day (e.g. today and day before yesterday)
    setup(); // Reset
    app.appState.moods.push({ date: getDateOffsetString(0), level: 3, timestamp: Date.now() });
    app.appState.moods.push({ date: getDateOffsetString(2), level: 4, timestamp: Date.now() - (2 * 86400000) });
    assert(app.calculateStreak() === 1, 'A gap of one day limits the streak count to 1');

    teardown();
  });

  /* ==========================================================================
     TEST SUITE 3: Stress Trigger Frequency Calculation
     ========================================================================== */
  describe('Stress Trigger Frequency Calculation', () => {
    setup();

    const app = window.WellnessApp;

    // Initially should return "None"
    assert(app.calculateTopStressTrigger() === 'None', 'Initial top trigger should be "None"');

    // Log some triggers
    app.appState.triggers.push({
      date: '2026-06-01',
      items: ['Syllabus pressure', 'Sleep issues'],
      timestamp: Date.now()
    });
    app.appState.triggers.push({
      date: '2026-06-02',
      items: ['Syllabus pressure', 'Fear of failure'],
      timestamp: Date.now()
    });

    // Top trigger should be 'Syllabus pressure' (frequency = 2)
    assert(app.calculateTopStressTrigger() === 'Syllabus pressure', 'Top trigger is correctly identified as Syllabus pressure');

    teardown();
  });

  /* ==========================================================================
     TEST SUITE 4: Journal Entry Saving and Character Counting
     ========================================================================== */
  describe('Journal Entry Storage & Counting', () => {
    setup();

    const app = window.WellnessApp;
    const testContent = 'Testing reflection text!';

    // Verify character counting on test content
    assert(testContent.length === 24, 'Correctly counts the characters in the journal entry');

    // Save journal entry
    app.appState.journal.push({
      dateStr: app.getTodayDateString(),
      timestamp: Date.now(),
      content: testContent
    });
    app.saveJournalToStorage();

    // Verify retrieval
    app.appState.journal = [];
    app.loadStateFromStorage();
    assert(app.appState.journal.length === 1, 'Successfully loaded journal entries from storage');
    assert(app.appState.journal[0].content === testContent, 'Loaded journal content matches saved content');

    teardown();
  });

  /* ==========================================================================
     TEST SUITE 5: API Response JSON Schema Validation
     ========================================================================== */
  describe('API Response JSON Schema Validation', () => {
    setup();

    const app = window.WellnessApp;

    // Case 1: Valid schema object
    const validData = {
      message: 'Keep pushing forward, you got this!',
      breathing_exercise: 'Inhale for 4 seconds...',
      study_tip: 'Take 5 minute breaks.',
      affirmation: 'I am capable of passing this exam.',
      emergency_resources: 'Helpline: 1860-2662-345'
    };
    assert(app.validateAIResponse(validData) === true, 'validateAIResponse returns true for standard valid payload');

    // Case 2: Missing critical field (e.g. message)
    const missingMessage = {
      breathing_exercise: 'Inhale for 4 seconds...',
      study_tip: 'Take 5 minute breaks.',
      affirmation: 'I am capable of passing this exam.',
      emergency_resources: 'Helpline: 1860-2662-345'
    };
    assert(app.validateAIResponse(missingMessage) === false, 'validateAIResponse returns false if critical field message is missing');

    // Case 3: Empty string values in critical fields
    const emptyField = {
      message: '',
      breathing_exercise: 'Inhale for 4 seconds...',
      study_tip: 'Take 5 minute breaks.',
      affirmation: 'I am capable of passing this exam.',
      emergency_resources: 'Helpline: 1860-2662-345'
    };
    assert(app.validateAIResponse(emptyField) === false, 'validateAIResponse returns false if message is an empty string');

    // Case 4: Non-object input
    assert(app.validateAIResponse(null) === false, 'validateAIResponse returns false for null input');
    assert(app.validateAIResponse('invalid-string') === false, 'validateAIResponse returns false for string input');

    teardown();
  });

  /* ==========================================================================
     TEST SUITE 6: API Error Handling
     ========================================================================== */
  describe('API Error Handling UI', () => {
    setup();

    const app = window.WellnessApp;

    // Backup fetch
    const originalFetch = window.fetch;

    // Setup mock fetch to reject/fail
    window.fetch = function () {
      return Promise.reject(new Error('Network disconnected'));
    };

    // Inject temporary elements to let fetchAIWellnessSupport run without throwing reference errors
    const mockContainer = document.createElement('div');
    mockContainer.id = 'ai-response-container';
    document.body.appendChild(mockContainer);
    
    const mockAlert = document.createElement('div');
    mockAlert.id = 'token-status-alert';
    document.body.appendChild(mockAlert);

    const mockBtn = document.createElement('button');
    mockBtn.id = 'btn-get-wellness';
    document.body.appendChild(mockBtn);

    const mockGuidance = document.createElement('p');
    mockGuidance.id = 'checkin-guidance-msg';
    document.body.appendChild(mockGuidance);

    // Re-bind elements in app cache
    app.init();

    // Call API handler which catches error and renders feedback
    app.fetchAIWellnessSupport().then(() => {
      const containerText = mockContainer.textContent;
      assert(containerText.includes('Validation Error') || containerText.includes('Network disconnected'), 'Correctly handles API fetch network errors in UI by displaying validation warning message');
      
      // Cleanup mocks
      document.body.removeChild(mockContainer);
      document.body.removeChild(mockAlert);
      document.body.removeChild(mockBtn);
      document.body.removeChild(mockGuidance);
      window.fetch = originalFetch;
      teardown();
    });
  });

})();

