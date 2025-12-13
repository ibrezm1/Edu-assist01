# GetPath - AI Powered Learning Paths

A Node.js and React application that generates personalized learning paths using Google Gemini AI.

## Features

- **AI Assessment**: personalized diagnostic questionnaire.
- **Dynamic Learning Path**: Generates a curriculum of YouTube videos and Articles based on your level.
- **Checkpoint Quizzes**: Verifies your knowledge after each module.
- **Premium Design**: Modern Glassmorphism UI.

## Setup

### Prerequisites

- Node.js installed.
- A Google Gemini API Key (Get one at [Google AI Studio](https://makersuite.google.com/app/apikey)).

### Installation

1.  **Backend**:
    ```bash
    cd server
    npm install
    node index.js
    ```
    The server runs on `http://localhost:3000`.

2.  **Frontend**:
    ```bash
    cd client
    npm install
    npm run dev
    ```
    The client runs on `http://localhost:5173` (usually).

## Usage

1.  Open the frontend in your browser.
2.  Enter your **Gemini API Key**.
3.  Enter a **Topic** you want to learn (e.g., "Machine Learning", "Cooking", "React").
4.  Complete the initial assessment.
5.  Follow the generated path!
