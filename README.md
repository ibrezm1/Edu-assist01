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

```bash
npm install
npm run dev
```
The application runs on `http://localhost:5173` (usually).

## Usage

1. Open the application in your browser.
2. Enter your **Gemini API Key** (or other supported AI providers in Settings).
3. Enter a **Topic** you want to learn (e.g., "Machine Learning", "Cooking", "React").
4. Complete the initial assessment.
5. Follow the generated path!

## Roadmap / Upcoming Features

- **Persistent Storage**: Save learning paths, assessment results, and user progress to a database so you can resume learning anytime.
- **Enhanced AI Response Formatting**: Implement stricter JSON schema validation and structured output controls for the Generative AI responses to ensure 100% reliability.
- **Comment Feature**: Add the ability for users to leave personal notes and comments on specific learning nodes or resources.

## Deployment

### GitHub Pages

To deploy the application to GitHub Pages:

```bash
npm run deploy
```

    This command builds the project and pushes the `dist` folder to the `gh-pages` branch on GitHub.

3.  **GitHub Settings**:
    -   Go to your repository settings on GitHub.
    -   Navigate to **Pages**.
    -   Under **Build and deployment** > **Source**, select **Deploy from a branch**.
    -   Select the `gh-pages` branch and `/ (root)` folder.
    -   Click **Save**.

Your application should be live at `https://ibrezm1.github.io/Edu-assist01/`.
