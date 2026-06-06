# Aura - Student Mental Wellness Tracker

A premium, highly accessible, and visually calming mental wellness tracker designed for students preparing for high-stakes competitive examinations like NEET, JEE, CUET, CAT, GATE, UPSC, and board exams.

---

## 🚀 Features

### 1. Mood Tracker
- Daily mood check-in with 5 distinct levels (Very Low / Low / Neutral / Good / Excellent).
- Visual interactive emoji mood selector.
- 7-day visual mood history chart styled entirely using **pure CSS bar charts** (no external charting libraries).
- Mood logs saved locally in the browser (`localStorage`).

### 2. Stress Trigger Identifier
- Checklist of common exam stress triggers including Syllabus pressure, Mock test results, Peer comparison, Parent expectations, Time management, Fear of failure, Sleep issues, Self-doubt, Burnout, and Anxiety before results.
- Simple daily check-in that tracks which triggers affect the student today.
- Aggregated frequency patterns display showing the most common stress triggers over time.

### 3. Emotion Reflection Journal
- A daily reflection text editor: *"How are you feeling today? What's on your mind?"*
- Autodetection and save operations debounced at 300ms to preserve performance.
- Saved to local storage with automated date and time stamps.
- Live-updating character count (maximum 500 characters).
- Timeline list displaying the last 5 reflection entries.

### 4. Personalized AI Wellness Support
- Integration with the **GitHub Models API** (`openai/gpt-4o`).
- Returns customized student coping strategies (breathing exercises, study/focus tips, affirmations, and distress helplines such as Vandrevala Foundation and iCall).
- Displayed as a premium, high-fidelity AI support card.

### 5. Wellness Dashboard
- Real-time statistics grid display showing:
  - **Current Streak**: Consecutive days logged in a row.
  - **Average Mood**: Your average mood rating over the past week.
  - **Top Stress Trigger**: The most frequently logged exam stress trigger.
  - **Total Journal Entries**: Total count of reflections recorded.

---

## 🛠️ Tech Stack
- **Structure**: Semantic HTML5
- **Style**: Custom Vanilla CSS (Nunito typography from Google Fonts, calming light theme)
- **Logic**: Vanilla JavaScript ES6 (No external JS frameworks or charting libraries)
- **AI Integration**: GitHub Models API (`openai/gpt-4o`)

---

## 💻 Setup Instructions

1. **Clone or download** the workspace files.
2. **Duplicate the configuration template**:
   Copy the `config.example.js` file and rename it to `config.js`:
   ```bash
   cp config.example.js config.js
   ```
3. **Configure your GitHub Personal Access Token**:
   Open the new `config.js` file and replace the placeholder text with your GitHub token:
   ```javascript
   const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN_HERE';
   ```
4. **Run the Application**:
   Since the app is built purely on HTML, CSS, and JS, you can open `index.html` directly in any browser. Alternatively, serve it locally using a light-weight dev server:
   ```bash
    # Example using Python's built-in server
    python -m http.server 8000
    ```

---

## 🧪 Running Unit Tests

The project includes a comprehensive unit testing suite in `tests.js` built using vanilla JavaScript `console.assert()`. No external dependencies or packages are required.

### What is covered:
1. **Mood Tracker Storage**: Asserts that daily mood scores save accurately to localStorage and can be reloaded back into memory state intact.
2. **Streak Calculation Logic**: Asserts proper calculation of consecutive days logged in a row. Covers edge cases like empty logs (0 days), 1-day logs, multi-day consecutive streaks, and gap days breaking the streak.
3. **Stress Trigger Frequency**: Asserts calculation of the top stress trigger, counting frequencies accurately across all history and returning "None" when no triggers are logged.
4. **Journal Storage & Character Counting**: Asserts correct character count computation and validation of journal reflections stored and re-loaded from localStorage.
5. **API Response Schema Validation**: Asserts that `validateAIResponse` strictly checks the JSON structure (validates presence of critical fields like message and study tips, and invalidates payloads missing properties or containing empty values/null).
6. **API Error Handling UI**: Mocks fetch failures to verify that app state catches errors gracefully and renders a user-friendly "Validation Error" card instead of crashing or showing a broken UI.

### To run the tests:
1. Open the application in your web browser (e.g. `http://localhost:8080/`).
2. Open the **Browser Developer Tools** (Press `F12` or `Ctrl+Shift+I` / `Cmd+Option+I` on Mac).
3. Navigate to the **Console** tab.
4. Execute the following command in the developer console to run the tests live:
   ```javascript
   const s = document.createElement('script'); s.src = 'tests.js'; document.body.appendChild(s);
   ```
5. Check the Console outputs for clean `✅ Suite Passed` and `✓ Pass:` messages!

---

## 📸 Screenshots

*(Screenshots placeholder - to be added upon deployment)*
