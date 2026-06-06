/**
 * Aura - Student Mental Wellness Tracker
 * Frontend application logic and state management.
 */

// Establish global namespace or safe declarations if config.js failed to load
if (typeof window.configLoaded === 'undefined') {
  window.configLoaded = false;
}

(function () {
  'use strict';

  /* ==========================================================================
     GLOBAL CONSTANTS & STRESS TRIGGERS LIST
     ========================================================================== */

  /**
   * The list of valid stress triggers from the challenge description.
   * @type {string[]}
   */
  const STRESS_TRIGGERS = [
    'Syllabus pressure',
    'Mock test results',
    'Peer comparison',
    'Parent expectations',
    'Time management',
    'Fear of failure',
    'Sleep issues',
    'Self-doubt',
    'Burnout',
    'Anxiety before results'
  ];

  /**
   * Label translations for mood levels.
   * @type {Object<number, string>}
   */
  const MOOD_LEVELS = {
    1: 'Very Low',
    2: 'Low',
    3: 'Neutral',
    4: 'Good',
    5: 'Excellent'
  };

  /**
   * Emojis corresponding to mood levels.
   * @type {Object<number, string>}
   */
  const MOOD_EMOJIS = {
    1: '😢',
    2: '🙁',
    3: '😐',
    4: '🙂',
    5: '😊'
  };

  /* ==========================================================================
     APPLICATION STATE (BATCH LOADED)
     ========================================================================== */

  /**
   * In-memory cache of the application state.
   * Prevents per-render localStorage read operations.
   * @type {{ moods: Array<Object>, triggers: Array<Object>, journal: Array<Object> }}
   */
  const appState = {
    moods: [],
    triggers: [],
    journal: []
  };

  /**
   * Currently selected mood level for the active check-in form.
   * @type {number|null}
   */
  let selectedMood = null;

  /**
   * Debounce timer reference for journal auto-saving.
   * @type {number|null}
   */
  let journalSaveTimeout = null;

  /* ==========================================================================
     DOM CACHE
     ========================================================================== */

  /**
   * Cache object for storing references to DOM elements.
   * Prevents redundant DOM querying.
   * @type {Object<string, HTMLElement>}
   */
  const dom = {};

  /**
   * Caches all required DOM elements on startup.
   * @returns {void}
   */
  function cacheElements() {
    // Navigation Tabs
    dom.navTabs = document.querySelectorAll('.nav-tab-btn');
    dom.panels = document.querySelectorAll('.tab-panel');

    // Stats Row
    dom.statStreak = document.getElementById('stat-streak');
    dom.statAvgMood = document.getElementById('stat-avg-mood');
    dom.statCommonTrigger = document.getElementById('stat-common-trigger');
    dom.statTotalJournal = document.getElementById('stat-total-journal');

    // Charts Containers
    dom.moodChartContainer = document.getElementById('mood-chart-container');
    dom.triggersChartContainer = document.getElementById('triggers-chart-container');

    // Form inputs and feedback
    dom.checkinForm = document.getElementById('checkin-form');
    dom.moodButtons = document.querySelectorAll('.mood-btn');
    dom.checkinFeedback = document.getElementById('checkin-feedback');

    // Journal Entry
    dom.journalEntry = document.getElementById('journal-entry');
    dom.saveStatusMsg = document.getElementById('save-status-msg');
    dom.charCountInfo = document.getElementById('char-count-info');
    dom.journalTimelineContainer = document.getElementById('journal-timeline-container');

    // AI Support
    dom.tokenStatusAlert = document.getElementById('token-status-alert');
    dom.btnGetWellness = document.getElementById('btn-get-wellness');
    dom.checkinGuidanceMsg = document.getElementById('checkin-guidance-msg');
    dom.aiResponseContainer = document.getElementById('ai-response-container');
  }

  /* ==========================================================================
     LOCAL STORAGE METHODS (BATCH READ / WRITE)
     ========================================================================== */

  /**
   * Loads all application data from localStorage into the in-memory state.
   * @returns {void}
   */
  function loadStateFromStorage() {
    try {
      appState.moods = JSON.parse(localStorage.getItem('aura_moods')) || [];
      appState.triggers = JSON.parse(localStorage.getItem('aura_triggers')) || [];
      appState.journal = JSON.parse(localStorage.getItem('aura_journal')) || [];
    } catch (e) {
      showGlobalError('Failed to load your local storage history. Try reloading.');
    }
  }

  /**
   * Saves the current mood state array back to localStorage.
   * @returns {void}
   */
  function saveMoodsToStorage() {
    try {
      localStorage.setItem('aura_moods', JSON.stringify(appState.moods));
    } catch (e) {
      showGlobalError('Could not save mood log to device storage.');
    }
  }

  /**
   * Saves the current triggers state array back to localStorage.
   * @returns {void}
   */
  function saveTriggersToStorage() {
    try {
      localStorage.setItem('aura_triggers', JSON.stringify(appState.triggers));
    } catch (e) {
      showGlobalError('Could not save triggers to device storage.');
    }
  }

  /**
   * Saves the current journal state array back to localStorage.
   * @returns {void}
   */
  function saveJournalToStorage() {
    try {
      localStorage.setItem('aura_journal', JSON.stringify(appState.journal));
    } catch (e) {
      showGlobalError('Could not save journal entry to device storage.');
    }
  }

  /* ==========================================================================
     HELPER UTILITIES
     ========================================================================== */

  /**
   * Gets today's date formatted as YYYY-MM-DD.
   * @returns {string} The formatted date string.
   */
  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats a raw timestamp into a user-friendly date and time.
   * @param {number} timestamp - The milliseconds since epoch.
   * @returns {string} The formatted date string.
   */
  function formatFriendlyDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Display a user-friendly error message in a temporary banner or modal logic if needed.
   * @param {string} msg - The error message text.
   * @returns {void}
   */
  function showGlobalError(msg) {
    // Simple feedback helper. Avoids console.log statements.
    const errorBar = document.createElement('div');
    errorBar.style.position = 'fixed';
    errorBar.style.top = '10px';
    errorBar.style.left = '50%';
    errorBar.style.transform = 'translateX(-50%)';
    errorBar.style.backgroundColor = '#b33939';
    errorBar.style.color = '#ffffff';
    errorBar.style.padding = '10px 20px';
    errorBar.style.borderRadius = '8px';
    errorBar.style.fontSize = '0.9rem';
    errorBar.style.fontWeight = 'bold';
    errorBar.style.zIndex = '1000';
    errorBar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    errorBar.textContent = msg;

    document.body.appendChild(errorBar);
    setTimeout(() => {
      if (errorBar.parentNode) {
        errorBar.parentNode.removeChild(errorBar);
      }
    }, 4000);
  }

  /* ==========================================================================
     NAVIGATION & TAB ROUTING
     ========================================================================== */

  /**
   * Handles click/activation of tabs, switches panels, and updates ARIA states.
   * @param {Event} e - The tab button click event.
   * @returns {void}
   */
  function handleTabClick(e) {
    const targetTab = e.currentTarget;
    const targetPanelId = targetTab.getAttribute('aria-controls');

    // Update tab header classes and accessibility attributes
    dom.navTabs.forEach(tab => {
      const isSelected = tab === targetTab;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected.toString());
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    });

    // Toggle panels
    dom.panels.forEach(panel => {
      const isActive = panel.id === targetPanelId;
      panel.classList.toggle('active', isActive);
      if (isActive) {
        // Accessibility focus management on tab activation
        panel.focus();
      }
    });

    // Re-render dashboard features if switching to dashboard
    if (targetPanelId === 'panel-dashboard') {
      renderDashboard();
    }
  }

  /**
   * Registers accessibility keyboard navigation for tablist.
   * Allows ArrowLeft / ArrowRight to switch focus.
   * @param {KeyboardEvent} e - Keydown event.
   * @returns {void}
   */
  function handleTabKeydown(e) {
    const tabsArr = Array.from(dom.navTabs);
    const currIdx = tabsArr.indexOf(document.activeElement);
    if (currIdx === -1) return;

    let nextIdx = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (currIdx + 1) % tabsArr.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (currIdx - 1 + tabsArr.length) % tabsArr.length;
    }

    if (nextIdx !== null) {
      tabsArr[nextIdx].focus();
      e.preventDefault();
    }
  }

  /* ==========================================================================
     FEATURE 1: MOOD TRACKER LOGIC
     ========================================================================== */

  /**
   * Updates UI Selection states for daily mood selectors.
   * @param {number} level - The level from 1 to 5.
   * @returns {void}
   */
  function selectMoodLevel(level) {
    selectedMood = level;
    dom.moodButtons.forEach(btn => {
      const btnLevel = parseInt(btn.getAttribute('data-mood'), 10);
      const isSelected = btnLevel === level;
      btn.setAttribute('aria-checked', isSelected.toString());
    });
  }

  /**
   * Renders the 7-day mood history pure CSS bar chart.
   * @returns {void}
   */
  function renderMoodChart() {
    const container = dom.moodChartContainer;
    container.innerHTML = '';

    // If no data, show empty state
    if (appState.moods.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'chart-empty-state';
      empty.textContent = 'No mood logs yet. Log your mood to see your weekly trend!';
      container.appendChild(empty);
      return;
    }

    // Get last 7 calendar days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
      last7Days.push({ dateStr, weekday });
    }

    // Map logs by date
    const moodMap = {};
    appState.moods.forEach(log => {
      moodMap[log.date] = log.level;
    });

    // Render bars
    last7Days.forEach(day => {
      const level = moodMap[day.dateStr] || 0; // 0 means not logged
      const barWrapper = document.createElement('div');
      barWrapper.className = 'chart-bar-wrapper';

      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.setAttribute('tabindex', '0');

      if (level > 0) {
        bar.setAttribute('data-level', level.toString());
        // Calculate height percentage: Level 1 = 20%, 2 = 40%, 3 = 60%, 4 = 80%, 5 = 100%
        bar.style.height = `${level * 20}%`;
        bar.setAttribute('data-tooltip', `${day.weekday}: ${MOOD_LEVELS[level]}`);
        bar.setAttribute('aria-label', `${day.weekday}: ${MOOD_LEVELS[level]} mood`);
      } else {
        bar.style.height = '0%';
        bar.setAttribute('data-tooltip', `${day.weekday}: No log`);
        bar.setAttribute('aria-label', `${day.weekday}: No log recorded`);
      }

      const dayLabel = document.createElement('span');
      dayLabel.className = 'chart-day';
      dayLabel.textContent = day.weekday;

      barWrapper.appendChild(bar);
      barWrapper.appendChild(dayLabel);
      container.appendChild(barWrapper);
    });
  }

  /* ==========================================================================
     FEATURE 2: STRESS TRIGGERS LOGIC
     ========================================================================== */

  /**
   * Renders the stress trigger frequency patterns graph on the dashboard.
   * @returns {void}
   */
  function renderTriggersChart() {
    const container = dom.triggersChartContainer;
    container.innerHTML = '';

    if (appState.triggers.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'chart-empty-state';
      empty.textContent = 'No stress triggers tracked yet. Check in to identify triggers!';
      container.appendChild(empty);
      return;
    }

    // Count frequencies of each trigger type
    const frequencies = {};
    STRESS_TRIGGERS.forEach(t => {
      frequencies[t] = 0;
    });

    appState.triggers.forEach(log => {
      if (Array.isArray(log.items)) {
        log.items.forEach(item => {
          if (frequencies[item] !== undefined) {
            frequencies[item]++;
          }
        });
      }
    });

    // Filter out triggers with 0 count to show top ones, or show all sorted
    const sortedTriggers = Object.entries(frequencies)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedTriggers.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'chart-empty-state';
      empty.textContent = 'You haven\'t selected any triggers yet. Great job!';
      container.appendChild(empty);
      return;
    }

    const maxCount = sortedTriggers[0][1];

    sortedTriggers.forEach(([name, count]) => {
      const widthPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;

      const row = document.createElement('div');
      row.className = 'trigger-pattern-row';
      row.setAttribute('aria-label', `${name} occurred ${count} times`);

      const nameLabel = document.createElement('span');
      nameLabel.className = 'trigger-pattern-name';
      nameLabel.textContent = name;

      const barBg = document.createElement('div');
      barBg.className = 'trigger-pattern-bar-bg';

      const barFill = document.createElement('div');
      barFill.className = 'trigger-pattern-bar-fill';
      // Trigger width animation via CSS opacity/transform principles where applicable
      // Use width animation for layout here safely on mount
      setTimeout(() => {
        barFill.style.width = `${widthPercent}%`;
      }, 50);

      const countLabel = document.createElement('span');
      countLabel.className = 'trigger-pattern-count';
      countLabel.textContent = count.toString();

      barBg.appendChild(barFill);
      row.appendChild(nameLabel);
      row.appendChild(barBg);
      row.appendChild(countLabel);
      container.appendChild(row);
    });
  }

  /* ==========================================================================
     FEATURE 3: EMOTION JOURNAL LOGIC
     ========================================================================== */

  /**
   * Debounces any task call by delay milliseconds.
   * @param {Function} func - The callback execution logic.
   * @param {number} delay - Duration of idle time to wait.
   * @returns {Function}
   */
  function debounce(func, delay) {
    return function (...args) {
      if (journalSaveTimeout) {
        clearTimeout(journalSaveTimeout);
      }
      journalSaveTimeout = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
  }

  /**
   * Saves the current journal entry text to localStorage.
   * @param {string} text - The journal reflection input content.
   * @returns {void}
   */
  function autoSaveJournal(text) {
    dom.saveStatusMsg.textContent = 'Saving...';
    dom.saveStatusMsg.className = 'save-status saving';

    const cleanText = text.trim();
    const todayDate = getTodayDateString();

    // Check if we already have an entry for today. If so, overwrite. Else add.
    const existingIndex = appState.journal.findIndex(j => j.dateStr === todayDate);

    if (cleanText === '') {
      // If today is empty and it existed, we can delete or keep it. Let's remove today's log if cleared.
      if (existingIndex !== -1) {
        appState.journal.splice(existingIndex, 1);
      }
    } else {
      const entryObj = {
        dateStr: todayDate,
        timestamp: Date.now(),
        content: cleanText
      };

      if (existingIndex !== -1) {
        appState.journal[existingIndex] = entryObj;
      } else {
        appState.journal.push(entryObj);
      }
    }

    // Save & render timeline
    saveJournalToStorage();
    renderJournalTimeline();
    updateStatsRow();

    setTimeout(() => {
      dom.saveStatusMsg.textContent = 'All changes saved locally';
      dom.saveStatusMsg.className = 'save-status';
    }, 800);
  }

  /**
   * Renders the journal timeline showing the last 5 logs.
   * @returns {void}
   */
  function renderJournalTimeline() {
    const container = dom.journalTimelineContainer;
    container.innerHTML = '';

    // Sort by timestamp descending
    const sorted = [...appState.journal].sort((a, b) => b.timestamp - a.timestamp);
    const last5 = sorted.slice(0, 5);

    if (last5.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'timeline-empty-state';
      empty.textContent = 'No journal entries yet. Start writing above to see them in your timeline!';
      container.appendChild(empty);
      return;
    }

    last5.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.setAttribute('role', 'article');

      const dateStr = document.createElement('span');
      dateStr.className = 'timeline-date';
      dateStr.textContent = formatFriendlyDateTime(entry.timestamp);

      const text = document.createElement('p');
      text.className = 'timeline-text';
      text.textContent = entry.content;

      item.appendChild(dateStr);
      item.appendChild(text);
      container.appendChild(item);
    });
  }

  /**
   * Dynamic character counter for the text area.
   * @returns {void}
   */
  function handleJournalInput() {
    const textVal = dom.journalEntry.value;
    const len = textVal.length;
    dom.charCountInfo.textContent = `${len} / 500 characters`;
    
    // Trigger auto-save using the 300ms debouncer
    debouncedSave(textVal);
  }

  const debouncedSave = debounce(autoSaveJournal, 300);

  /* ==========================================================================
     FEATURE 4: AI WELLNESS GUIDANCE (FETCH)
     ========================================================================== */

  /**
   * Validates if the user has completed mood and stress trigger check-in today.
   * @returns {boolean} True if logged.
   */
  function isTodayCheckInLogged() {
    const today = getTodayDateString();
    const moodLogged = appState.moods.some(m => m.date === today);
    // Even if no triggers selected, check-in counts as logged if they hit "Save Today's Check-in"
    const triggersLogged = appState.triggers.some(t => t.date === today);
    return moodLogged && triggersLogged;
  }

  /**
   * Refreshes AI Support Tab state based on daily status & token configuration.
   * @returns {void}
   */
  function updateAISupportState() {
    // 1. Check GITHUB_TOKEN status
    const hasToken = typeof GITHUB_TOKEN !== 'undefined' && GITHUB_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE' && GITHUB_TOKEN !== '';
    if (hasToken) {
      dom.tokenStatusAlert.style.display = 'none';
    } else {
      dom.tokenStatusAlert.style.display = 'flex';
    }

    // 2. Check check-in status
    const checkedIn = isTodayCheckInLogged();
    if (checkedIn) {
      dom.btnGetWellness.disabled = false;
      dom.checkinGuidanceMsg.style.display = 'none';
    } else {
      dom.btnGetWellness.disabled = true;
      dom.checkinGuidanceMsg.style.display = 'block';
    }
  }

  /**
   * Generates localized AI wellness guidance and handles GitHub Models API integration.
   * @returns {Promise<void>}
   */
  async function fetchAIWellnessSupport() {
    const today = getTodayDateString();
    
    // Find today's logs to tailor the prompt
    const todayMoodLog = appState.moods.find(m => m.date === today);
    const todayTriggersLog = appState.triggers.find(t => t.date === today);

    const moodVal = todayMoodLog ? todayMoodLog.level : 3;
    const moodText = MOOD_LEVELS[moodVal];
    const triggersList = todayTriggersLog && todayTriggersLog.items.length > 0
      ? todayTriggersLog.items.join(', ')
      : 'no specific triggers';

    // Verify token
    const hasToken = typeof GITHUB_TOKEN !== 'undefined' && GITHUB_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE' && GITHUB_TOKEN !== '';
    if (!hasToken) {
      showGlobalError('GitHub Token is missing. Please configure config.js.');
      return;
    }

    // Render loading state
    dom.aiResponseContainer.innerHTML = `
      <div class="loader-card">
        <div class="spinner" aria-hidden="true"></div>
        <p>Creating your personalized wellness plan...</p>
      </div>
    `;

    const systemPrompt = `You are a warm, empathetic mental health chatbot designed to help students preparing for high-pressure competitive exams like NEET, JEE, UPSC, GATE, CAT, CUET, and boards.
You MUST respond ONLY with a valid JSON object matching the exact structure below. Do not include markdown code blocks, backticks, or any trailing/leading text outside the JSON.

JSON Structure:
{
  "message": "warm personalized message to student",
  "breathing_exercise": "step by step breathing technique",
  "study_tip": "personalized study/focus tip",
  "affirmation": "positive affirmation for the student",
  "emergency_resources": "VANDREVALA helpline 1860-2662-345 or iCall 9152987821 if student seems very distressed"
}`;

    const userPrompt = `Today, the student checked in with:
Mood level: ${moodText} (${moodVal} out of 5)
Stress Triggers: ${triggersList}

Please tailor the message, breathing exercise, and study tip specifically to address these stress factors for a student.`;

    try {
      const response = await fetch('https://models.github.ai/inference/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const rawData = await response.json();
      
      // Extract completion response content
      let content = rawData.choices[0].message.content.trim();
      
      // Clean up markdown block headers if AI accidentally generated them
      if (content.startsWith('```json')) {
        content = content.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (content.startsWith('```')) {
        content = content.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const wellnessData = JSON.parse(content);
      renderWellnessCard(wellnessData);

    } catch (err) {
      dom.aiResponseContainer.innerHTML = `
        <div class="ai-placeholder-card" style="border-color: var(--color-danger); color: var(--color-danger);">
          <span class="ai-placeholder-icon" aria-hidden="true">⚠️</span>
          <h4>Connection Issue</h4>
          <p>We couldn't connect to the AI service. Details: ${err.message}. Please verify your network and GitHub token config.</p>
        </div>
      `;
    }
  }

  /**
   * Renders the dynamic AI Response output as a premium wellness card.
   * @param {{message: string, breathing_exercise: string, study_tip: string, affirmation: string, emergency_resources: string}} data
   * @returns {void}
   */
  function renderWellnessCard(data) {
    const cardHtml = `
      <div class="wellness-card">
        <div class="wellness-card-header">
          <span class="wellness-card-header-icon" aria-hidden="true">✨</span>
          <h3>Your Personalized Wellness Plan</h3>
        </div>
        <div class="wellness-card-body">
          
          <div class="wellness-section">
            <h4>💌 Reflection</h4>
            <div class="wellness-content">${escapeHTML(data.message)}</div>
          </div>

          <div class="wellness-section">
            <h4>🌬️ Guided Breathing</h4>
            <div class="wellness-content">${escapeHTML(data.breathing_exercise)}</div>
          </div>

          <div class="wellness-section">
            <h4>💡 Study & Focus Tip</h4>
            <div class="wellness-content">${escapeHTML(data.study_tip)}</div>
          </div>

          <div class="wellness-section">
            <h4>☀️ Daily Affirmation</h4>
            <div class="wellness-content" style="font-style: italic; font-weight: 600;">"${escapeHTML(data.affirmation)}"</div>
          </div>

          <div class="emergency-section" role="alert">
            <h4>🆘 Support Resources Helpline</h4>
            <p class="emergency-content">${escapeHTML(data.emergency_resources)}</p>
          </div>

        </div>
      </div>
    `;
    dom.aiResponseContainer.innerHTML = cardHtml;
  }

  /**
   * Escapes special characters to avoid XSS injections in dynamic cards.
   * @param {string} str - Safe parsing target.
   * @returns {string} Safe string.
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     FEATURE 5: DASHBOARD CALCULATIONS
     ========================================================================== */

  /**
   * Calculates the consecutive login/log streak in days.
   * Consecutive means days where a mood or trigger log exists.
   * @returns {number} The consecutive days streak count.
   */
  function calculateStreak() {
    const loggedDates = new Set();
    appState.moods.forEach(m => loggedDates.add(m.date));
    appState.triggers.forEach(t => loggedDates.add(t.date));

    if (loggedDates.size === 0) return 0;

    // Convert dates to absolute milliseconds at midnight to compare sequence
    const uniqueDatesSorted = Array.from(loggedDates)
      .map(dStr => new Date(dStr + 'T00:00:00'))
      .sort((a, b) => b - a); // Descending (latest first)

    const todayMidnight = new Date(getTodayDateString() + 'T00:00:00');
    const yesterdayMidnight = new Date(getTodayDateString() + 'T00:00:00');
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);

    const latestLogged = uniqueDatesSorted[0];

    // If latest log is neither today nor yesterday, streak is broken (0)
    if (latestLogged < yesterdayMidnight) {
      return 0;
    }

    let streak = 1;
    let expectedDate = new Date(latestLogged);

    for (let i = 1; i < uniqueDatesSorted.length; i++) {
      expectedDate.setDate(expectedDate.getDate() - 1);
      const nextLogged = uniqueDatesSorted[i];

      // Compare difference in days (approximated for DST changes)
      const diffTime = Math.abs(expectedDate - nextLogged);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        streak++;
      } else {
        break; // Streak broken
      }
    }

    return streak;
  }

  /**
   * Calculates average mood this week (last 7 days).
   * @returns {string} The text status of average mood.
   */
  function calculateWeeklyAverageMood() {
    const moods = appState.moods;
    if (moods.length === 0) return 'No Logs';

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = moods.filter(m => {
      const logTime = new Date(m.date + 'T00:00:00').getTime();
      return logTime >= oneWeekAgo;
    });

    if (recentLogs.length === 0) return 'No Logs';

    const sum = recentLogs.reduce((total, m) => total + m.level, 0);
    const avg = Math.round(sum / recentLogs.length);
    return MOOD_LEVELS[avg] || 'Neutral';
  }

  /**
   * Calculates the single most frequent stress trigger across all history.
   * @returns {string}
   */
  function calculateTopStressTrigger() {
    const triggers = appState.triggers;
    if (triggers.length === 0) return 'None';

    const countMap = {};
    triggers.forEach(log => {
      if (Array.isArray(log.items)) {
        log.items.forEach(item => {
          countMap[item] = (countMap[item] || 0) + 1;
        });
      }
    });

    const entries = Object.entries(countMap);
    if (entries.length === 0) return 'None';

    // Sort descending by count
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  /**
   * Updates all stats metrics in the Dashboard card grid.
   * @returns {void}
   */
  function updateStatsRow() {
    dom.statStreak.textContent = `${calculateStreak()} days`;
    dom.statAvgMood.textContent = calculateWeeklyAverageMood();
    dom.statCommonTrigger.textContent = calculateTopStressTrigger();
    dom.statTotalJournal.textContent = appState.journal.length.toString();
  }

  /**
   * Aggregates and renders all components inside the Dashboard tab.
   * @returns {void}
   */
  function renderDashboard() {
    updateStatsRow();
    renderMoodChart();
    renderTriggersChart();
  }

  /* ==========================================================================
     FORM ACTION HANDLER (DAILY CHECK-IN)
     ========================================================================== */

  /**
   * Processes submission of daily check-in (mood + stress triggers checklist).
   * @param {Event} e - Submit event.
   * @returns {void}
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    if (selectedMood === null) {
      dom.checkinFeedback.textContent = 'Please select a mood level before saving.';
      dom.checkinFeedback.className = 'feedback-msg error';
      return;
    }

    const today = getTodayDateString();

    // 1. Log Mood
    const existingMoodIdx = appState.moods.findIndex(m => m.date === today);
    const moodObj = { date: today, level: selectedMood, timestamp: Date.now() };
    if (existingMoodIdx !== -1) {
      appState.moods[existingMoodIdx] = moodObj;
    } else {
      appState.moods.push(moodObj);
    }
    saveMoodsToStorage();

    // 2. Log Triggers
    const checkedTriggers = [];
    const checkboxes = dom.checkinForm.querySelectorAll('input[name="triggers"]:checked');
    checkboxes.forEach(cb => {
      checkedTriggers.push(cb.value);
    });

    const existingTrigIdx = appState.triggers.findIndex(t => t.date === today);
    const trigObj = { date: today, items: checkedTriggers, timestamp: Date.now() };
    if (existingTrigIdx !== -1) {
      appState.triggers[existingTrigIdx] = trigObj;
    } else {
      appState.triggers.push(trigObj);
    }
    saveTriggersToStorage();

    // Feedback message
    dom.checkinFeedback.textContent = 'Your check-in has been successfully saved!';
    dom.checkinFeedback.className = 'feedback-msg success';

    // Update conditional triggers/buttons
    updateAISupportState();

    // Clear message after delay
    setTimeout(() => {
      dom.checkinFeedback.textContent = '';
      dom.checkinFeedback.className = 'feedback-msg';
    }, 3000);
  }

  /* ==========================================================================
     INITIALIZATION & REGISTRATION
     ========================================================================== */

  /**
   * Initializes application dependencies, state, and registers DOM events.
   * @returns {void}
   */
  function init() {
    cacheElements();
    loadStateFromStorage();
    
    // Tab switching event registration
    dom.navTabs.forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });
    
    // Accessibility keyboard navigation on the navigation bar list container
    const navList = document.querySelector('.nav-tabs-list');
    if (navList) {
      navList.addEventListener('keydown', handleTabKeydown);
    }

    // Mood emoji buttons interaction
    dom.moodButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const level = parseInt(e.currentTarget.getAttribute('data-mood'), 10);
        selectMoodLevel(level);
      });
    });

    // Journal Entry text changes listener
    dom.journalEntry.addEventListener('input', handleJournalInput);

    // Main Check-in Submit event listener
    dom.checkinForm.addEventListener('submit', handleFormSubmit);

    // AI Wellness action button trigger listener
    dom.btnGetWellness.addEventListener('click', fetchAIWellnessSupport);

    // Initial renders
    renderDashboard();
    renderJournalTimeline();
    updateAISupportState();

    // Pre-populate today's values in check-in form if already saved
    const today = getTodayDateString();
    const todayMood = appState.moods.find(m => m.date === today);
    if (todayMood) {
      selectMoodLevel(todayMood.level);
    }

    const todayTrig = appState.triggers.find(t => t.date === today);
    if (todayTrig && Array.isArray(todayTrig.items)) {
      todayTrig.items.forEach(val => {
        const cb = dom.checkinForm.querySelector(`input[value="${val}"]`);
        if (cb) {
          cb.checked = true;
        }
      });
    }

    // Pre-populate today's journal in text area
    const todayJournal = appState.journal.find(j => j.dateStr === today);
    if (todayJournal) {
      dom.journalEntry.value = todayJournal.content;
      dom.charCountInfo.textContent = `${todayJournal.content.length} / 500 characters`;
    }
  }

  // Load the app on DOM content ready
  document.addEventListener('DOMContentLoaded', init);

})();
