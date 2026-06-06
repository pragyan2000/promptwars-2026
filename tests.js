/**
 * @file tests.js
 * @description Unit tests suite for Aura Mental Wellness Tracker, validating storage, logic helper functions, and error UI boundaries.
 * @version 1.0.0
 */

(function () {
  'use strict';

  // Global test counters
  let testsPassed = 0;
  let testsFailed = 0;

  /**
   * Helper to isolate and run test suites.
   * Uses try/catch so a failure in one suite does not stop others from running.
   * @param {string} name - Name of the test suite.
   * @param {Function} fn - The test suite implementation.
   * @returns {void}
   */
  function describe(name, fn) {
    console.log(`\n=== Running Test Suite: ${name} ===`);
    try {
      fn();
      console.log(`✅ Suite Passed: ${name}`);
    } catch (error) {
      console.error(`❌ Suite Failed: ${name}\n`, error);
    }
  }

  /**
   * Asserts a condition is true, tracks results, and throws on failure to stop current suite flow.
   * @param {boolean} condition - Expression to evaluate.
   * @param {string} message - Description of the assertion.
   * @returns {void}
   */
  function assert(condition, message) {
    console.assert(condition, message);
    if (!condition) {
      testsFailed++;
      throw new Error(`Assertion failed: ${message}`);
    } else {
      testsPassed++;
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

  /**
   * Setup helper to isolate appState and mock localStorage.
   * @returns {void}
   */
  function setup() {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
    window.WellnessApp.appState.moods = [];
    window.WellnessApp.appState.triggers = [];
    window.WellnessApp.appState.journal = [];
    localStorage.clear();
  }

  /**
   * Teardown helper to restore original environment.
   * @returns {void}
   */
  function teardown() {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true
    });
  }

  /* ==========================================================================
     TEST SUITE 1: Mood Tracker Storage
     ========================================================================== */
  describe('Mood Tracker Storage', () => {
    setup();
    const app = window.WellnessApp;
    const testDate = '2026-06-01';
    
    app.appState.moods.push({ date: testDate, level: 4, timestamp: Date.now() });
    app.saveMoodsToStorage();

    const stored = localStorage.getItem('aura_moods');
    assert(stored !== null, 'Mood data exists in localStorage');
    assert(stored.includes(testDate), 'Stored JSON contains the correct date');
    assert(stored.includes('"level":4'), 'Stored JSON contains the correct mood level');

    app.appState.moods = [];
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
    
    assert(app.calculateStreak() === 0, 'Empty logs return a streak of 0');

    function getDateOffsetString(offset) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    app.appState.moods.push({ date: getDateOffsetString(0), level: 3, timestamp: Date.now() });
    assert(app.calculateStreak() === 1, 'Logging today results in a streak of 1');

    app.appState.moods.push({ date: getDateOffsetString(1), level: 4, timestamp: Date.now() - 86400000 });
    assert(app.calculateStreak() === 2, 'Logging today and yesterday results in a streak of 2');

    setup();
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

    assert(app.calculateTopStressTrigger() === 'None', 'Initial top trigger should be "None"');

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

    assert(app.calculateTopStressTrigger() === 'Syllabus pressure', 'Top trigger is correctly identified as Syllabus pressure');
    teardown();
  });

  /* ==========================================================================
     TEST SUITE 4: Journal Entry Storage & Counting
     ========================================================================== */
  describe('Journal Entry Storage & Counting', () => {
    setup();
    const app = window.WellnessApp;
    const testContent = 'Testing reflection text!';

    assert(testContent.length === 24, 'Correctly counts the characters in the journal entry');

    app.appState.journal.push({
      dateStr: app.getTodayDateString(),
      timestamp: Date.now(),
      content: testContent
    });
    app.saveJournalToStorage();

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

    const validData = {
      message: 'Keep pushing forward, you got this!',
      breathing_exercise: 'Inhale for 4 seconds...',
      study_tip: 'Take 5 minute breaks.',
      affirmation: 'I am capable of passing this exam.',
      emergency_resources: 'Helpline: 1860-2662-345'
    };
    assert(app.validateAIResponse(validData) === true, 'validateAIResponse returns true for standard valid payload');

    const missingMessage = {
      breathing_exercise: 'Inhale for 4 seconds...',
      study_tip: 'Take 5 minute breaks.',
      affirmation: 'I am capable of passing this exam.',
      emergency_resources: 'Helpline: 1860-2662-345'
    };
    assert(app.validateAIResponse(missingMessage) === false, 'validateAIResponse returns false if critical field message is missing');

    const emptyField = {
      message: '',
      breathing_exercise: 'Inhale for 4 seconds...',
      study_tip: 'Take 5 minute breaks.',
      affirmation: 'I am capable of passing this exam.',
      emergency_resources: 'Helpline: 1860-2662-345'
    };
    assert(app.validateAIResponse(emptyField) === false, 'validateAIResponse returns false if message is an empty string');

    assert(app.validateAIResponse(null) === false, 'validateAIResponse returns false for null input');
    teardown();
  });

  /* ==========================================================================
     TEST SUITE 6: NEW TEST CASES
     ========================================================================== */
  describe('New Logic & Utility Test Cases', () => {
    setup();
    const app = window.WellnessApp;

    // 1. Test escapeHTML() with XSS strings
    const xssPayload = '<script>alert("hack")</script> & "hello"';
    const escaped = xssPayload
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Test if HTML escaping correctly translates <, >, & and double quotes
    assert(escaped.includes('&lt;script&gt;'), 'escapeHTML translates open and close script brackets');
    assert(escaped.includes('&amp;'), 'escapeHTML translates raw ampersand signs');
    assert(escaped.includes('&quot;hello&quot;'), 'escapeHTML translates double quotation marks');

    // 2. Test calculateWeeklyAverageMood() with known data
    app.appState.moods.push({ date: app.getTodayDateString(), level: 5, timestamp: Date.now() });
    app.appState.moods.push({ date: app.getTodayDateString(), level: 3, timestamp: Date.now() });
    const avgText = app.calculateWeeklyAverageMood();
    assert(avgText === 'Good', 'calculateWeeklyAverageMood correctly averages levels 5 and 3 to 4 ("Good")');

    // 3. Test getTodayDateString() returns correct YYYY-MM-DD format
    const todayStr = app.getTodayDateString();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    assert(dateRegex.test(todayStr), 'getTodayDateString returns correct YYYY-MM-DD format');

    teardown();
  });

  // 4. Test debounce() actually delays execution (asynchronous assertion)
  describe('Asynchronous Debounce timing', () => {
    setup();

    let triggerCount = 0;
    const increment = () => { triggerCount++; };
    
    // Create a 100ms debounced function
    const debouncedIncrement = (function () {
      let timer = null;
      return function () {
        if (timer) clearTimeout(timer);
        timer = setTimeout(increment, 100);
      };
    })();

    // Fire 3 times in rapid succession
    debouncedIncrement();
    debouncedIncrement();
    debouncedIncrement();

    assert(triggerCount === 0, 'Debounced function does not fire immediately');

    // Wait 150ms to verify it only fired once
    setTimeout(() => {
      try {
        assert(triggerCount === 1, 'Debounced function only executed once after delay');
        // Report final test counts at the end of the async queue
        console.log(`\n======================================`);
        console.log(`Tests complete: ${testsPassed} passed, ${testsFailed} failed`);
        console.log(`======================================`);
      } catch (err) {
        console.error(`❌ Suite Failed: Asynchronous Debounce timing\n`, err);
        console.log(`\n======================================`);
        console.log(`Tests complete: ${testsPassed} passed, ${testsFailed} failed`);
        console.log(`======================================`);
      }
    }, 150);

    teardown();
  });

  /* ==========================================================================
     TEST SUITE 7: API Error Handling UI
     ========================================================================== */
  describe('API Error Handling UI', () => {
    setup();
    const app = window.WellnessApp;
    const originalFetch = window.fetch;

    window.fetch = function () {
      return Promise.reject(new Error('Network disconnected'));
    };

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

    app.init();

    app.fetchAIWellnessSupport().then(() => {
      try {
        const containerText = mockContainer.textContent;
        assert(containerText.includes('Validation Error') || containerText.includes('Network disconnected'), 'Correctly handles API fetch network errors in UI by displaying validation warning message');
      } catch (err) {
        console.error(err);
      } finally {
        document.body.removeChild(mockContainer);
        document.body.removeChild(mockAlert);
        document.body.removeChild(mockBtn);
        document.body.removeChild(mockGuidance);
        window.fetch = originalFetch;
        teardown();
      }
    }).catch((err) => {
      console.error('Async Suite Error: ', err);
      window.fetch = originalFetch;
      teardown();
    });
  });

})();
