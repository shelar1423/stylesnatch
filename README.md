# Stylesnatch

Stylesnatch is an elegant web application built for prompt-engineers and AI agents. It scans the sites you love and distills their visual essence into an AI-ready `SKILL.md` file, allowing your agents to ship interfaces that match that aesthetic.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) / [React](https://react.dev/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://motion.dev/)
- **Data Scraping**: [Firecrawl](https://firecrawl.dev/)
- **LLM Processing**: [Google Gemini AI Studio](https://aistudio.google.com/)

## Prerequisites

Before running the project locally, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (v18 or higher)
- **npm** (comes installed automatically with Node.js)

You will also need API keys for the following services to make the app work:

1. **Firecrawl API Key**: For deeply scraping and extracting color/typography data from websites. Get a free key at [Firecrawl](https://firecrawl.dev/).
2. **Google Gemini API Key**: For processing the scraped data into an agent-ready markdown skill using AI. Get a free key at [Google AI Studio](https://aistudio.google.com/).

## Local Setup Instructions (Step-by-Step)

Follow these exact steps to get the app running on your computer.

### Step 1: Clone the repository

First, download the code to your local machine using git.

```bash
git clone https://github.com/shelar1423/stylesnatch.git
cd stylesnatch
```

### Step 2: Install dependencies

Next, install all the required packages using npm. This might take a minute or two.

```bash
npm install
```

### Step 3: Configure Environment Variables

The app needs your API keys to function. We'll set these up using an environment file.

1. Create a copy of the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open the newly created `.env` file in your code editor.
3. Replace the placeholder text with your actual API keys:
   ```env
   FIRECRAWL_API_KEY=your_actual_firecrawl_key_here
   GEMINI_API_KEY=your_actual_gemini_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

### Step 4: Run the Development Server

Finally, start the local server to run the app.

```bash
npm run dev
```

Once the server starts, open your browser and go to the link shown in your terminal (usually `http://localhost:8080`).

## Usage Guide

1. Open the local site in your browser.
2. Enter the URL of any beautifully designed website you admire in the main input field.
3. Click **Scan style**. The tool will fetch the homepage, read the colors, typography, spacing, layout, and motion/interactions.
4. Once completed, download or copy the generated `SKILL.md`.
5. Drop this markdown file into your AI coding assistant (like Cursor, Windsurf, or Copilot) to give your agent a refined design taste.

## Building for Production

When you're ready to deploy the app, create a production build:

```bash
npm run build
```

You can preview the built production app locally using:

```bash
npm run preview
```
