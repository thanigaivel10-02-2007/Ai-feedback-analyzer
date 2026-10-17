# SentiQ — AI Feedback Analyzer 🧠📊

> Turn raw user feedback into meaningful, actionable insights in seconds. SentiQ is an intelligent, high-performance customer feedback analytics suite running **100% entirely in your browser**.

🔗 **Live Demo**: [https://sentiqq.cv](https://sentiqq.cv)

[![Live Demo](https://img.shields.io/badge/Live_Demo-sentiqq.cv-6366f1?logo=google-chrome&logoColor=white)](https://sentiqq.cv)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/Vanilla-JavaScript-yellow?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Client--Side-green)](#privacy--security)

---

## 🌟 Highlights

- **⚡ Client-Side NLP Engine**: Zero server round-trips. Lexicon-based sentiment scoring, negator parsing, emotion detection, and topic classification run locally in JavaScript.
- **🛡️ 100% Privacy-Preserving**: Your sensitive customer feedback, student surveys, or internal employee reviews never leave your browser.
- **🎥 YouTube Integration**: Ingest real-time comments from any public YouTube video via YouTube Data API v3.
- **📂 Multi-Format Ingestion**: Paste raw text, upload `.csv` / `.xlsx` files, or test immediately using built-in presets.
- **📈 Rich Visual Analytics**: Dynamic charts, sentiment gauges, topic radar breakdown, keyword clouds, and recurring issue mining.
- **💾 Export & Reporting**: Export filtered insights, charts, and clean datasets to CSV or print-ready reports.

---

## 🚀 Features

### 1. Advanced Sentiment & Emotion Scoring
- **Context-Aware Sentiment**: Evaluates positive/negative polarities while accounting for amplifiers (*"extremely good"*), dampeners (*"slightly slow"*), negators (*"not bad"*, *"never worked"*), and contrastive clauses (*"great UI, but too expensive"*).
- **Emoji Sentiment Mapping**: Accurately scores positive and negative emojis (😍, ❤️, 👍, 💩, 😡, 🤬).
- **Emotion Classification**: Surfaces underlying tones such as **Joy**, **Anger**, **Sadness**, **Surprise**, and **Trust**.

### 2. Automatic Topic Modeling
Automatically classifies feedback into standard operational categories:
- 💳 **Pricing & Billing**: Costs, subscriptions, refunds, hidden charges.
- 🎧 **Customer Support**: Response times, ticket handling, agent helpfulness.
- ⚡ **Performance & Speed**: Latency, crashes, downtime, load times.
- 🎨 **Usability & UI/UX**: Navigation, layout clarity, accessibility.
- 🐞 **Bugs & Reliability**: Glitches, broken features, sync issues.
- 📦 **Shipping & Delivery**: Logistics, courier delays, package condition.
- 🎓 **Education & Course Feedback**: Lecture clarity, syllabus, exams, professors.
- 🏢 **Workplace Culture & Management**: Work-life balance, leadership, burnout.

### 3. Recurring Issue Mining
- Uses n-gram phrase clustering to surface repeated friction points and recurring customer pain points.
- Distinguishes between critical negative bugs vs. high-value positive feedback.

### 4. Versatile Data Inputs
- **Direct Input**: Paste raw customer reviews, survey responses, or interview notes.
- **File Upload**: Drag-and-drop CSV spreadsheets with custom column mapping.
- **YouTube Comments**: Paste any YouTube video link to fetch and analyze real audience feedback in real time.
- **Preloaded Demos**: Instant test datasets covering SaaS, E-Commerce, Course Evaluations, and HR/Employee surveys.

---

## 📁 Repository Structure

```text
├── index.html            # Main application UI and dashboard
├── styles.css            # Responsive UI styles, themes & layout
├── app.js                # UI controller, event handlers, file parsing & rendering
├── nlp.js                # Core in-browser NLP engine & sentiment algorithms
├── config.js             # Optional configuration (e.g. YouTube Data API v3 key)
├── vercel.json           # Vercel deployment and routing rules
├── .gitignore            # Git ignore definitions
├── .vercelignore         # Vercel build ignore rules
└── README.md             # Project documentation
```

---

## 🛠️ Quick Start

No complex build steps or dependencies required! SentiQ is built with vanilla HTML5, CSS3, and modern JavaScript.

### Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/thanigaivel10-02-2007/Ai-feedback-analyzer.git
   cd Ai-feedback-analyzer
   ```

2. **Open the project**:
   - Simply double-click `index.html` in your file explorer, **or**
   - Serve using any local development server:
     ```bash
     # Using Python
     python3 -m http.server 8000

     # Or using Node.js npx
     npx serve .
     ```

3. Open `http://localhost:8000` (or the URL shown in your terminal) in your browser.

---

## ⚙️ Configuration (Optional)

### YouTube Data API
To analyze YouTube video comments:
1. Obtain an API Key from the [Google Cloud Console](https://console.cloud.google.com/) with **YouTube Data API v3** enabled.
2. Open [`config.js`](file:///Users/bharathkumar/Sentiq/config.js) and update your key:
   ```javascript
   window.SENTIQ_CONFIG = {
     youtubeApiKey: "YOUR_YOUTUBE_DATA_API_KEY",
   };
   ```

---

## 🌐 Deployment

### Deploy to Vercel
Deploy directly to Vercel with zero configuration:
```bash
npm install -g vercel
vercel
```

### Deploy to GitHub Pages
1. Go to your repository settings on GitHub: **Settings → Pages**.
2. Under **Source**, select `Deploy from a branch`.
3. Choose branch `main` and folder `/ (root)`.
4. Click **Save**.

---

## 🔒 Privacy & Security

- All NLP tokenization, lexicon matching, sentiment scoring, and dashboard computations run **locally in your web browser**.
- No feedback data is sent to external servers or remote machine learning endpoints.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
