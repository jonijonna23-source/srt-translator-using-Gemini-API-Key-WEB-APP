<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/globe.svg" width="80" height="80" />
  <h1>🎬 Gemini SRT Translator</h1>
  <p><b>A professional subtitle translation tool with Batch Processing & Smart Retry</b></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
    <img src="https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  </p>
</div>

<hr />

### 🚀 Overview
**Gemini SRT Translator** is a specialized web application built to translate `.srt` subtitle files. It uses **Google Gemini** to deliver natural, conversational translations while managing API rate limits through an automated batching system.

---

### ✨ Key Features

<table>
  <tr>
    <td width="50%">
      <h4>📦 Automated Batching</h4>
      Automatically splits subtitles into groups of 15 lines to stay within AI context windows.
    </td>
    <td width="50%">
      <h4>🔄 Infinite Retry System</h4>
      Automatically waits for 15 seconds and retries if the API is busy (Error 429).
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h4>📊 Live Progress Tracking</h4>
      Displays real-time percentage, batch count, and a live preview of translated text.
    </td>
    <td width="50%">
      <h4>⏹️ Process Control</h4>
      Includes a "Stop" button to halt the process while keeping all successfully translated data.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h4>💾 Local Persistence</h4>
      Saves your API Key securely in <code>localStorage</code> so you don't have to re-enter it.
    </td>
    <td width="50%">
      <h4>📋 Quick Export</h4>
      One-click buttons to download the final .srt file or copy the text to your clipboard.
    </td>
  </tr>
</table>

---

### 💻 Local Installation Guide

To run this application on your local machine, follow these steps:

1.  **Clone or Download the Project**
    ```bash
    cd <your-project-folder>
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    npm install lucide-react
    ```

3.  **Launch the Application**
    ```bash
    npm run dev
    ```

4.  **Usage**
    * Open your browser at `http://localhost:5173`.
    * Enter your **Gemini API Key** in the input field.
    * Upload your `.srt` file and select the target language.
    * Click **"Mulai Terjemahkan"** (Start Translation).

---

### 🛠️ Technical Reference

| Component | Description |
| :--- | :--- |
| **Translation Engine** | Uses a custom "Professional Movie Translator" prompt for informal/natural results. |
| **State Management** | Uses `useState` and `useRef` to handle real-time UI updates and process status. |
| **Reliability** | Implements a `while(!success)` loop to ensure no batch is skipped during API congestion. |
| **SRT Service** | Custom logic to parse and reconstruct SRT files without breaking timecode sync. |

---
