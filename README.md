# Stylesnatch

Stylesnatch is an elegant web application built for prompt-engineers and AI agents. It scans the sites you love and distills their visual essence into an AI-ready `SKILL.md` file, allowing your agents to ship interfaces that match that aesthetic.

## Tech Stack
- **Framework**: [TanStack Start](https://tanstack.com/start) / [React](https://react.dev/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://motion.dev/)
- **Data Scraping**: [Firecrawl](https://firecrawl.dev/)
- **LLM Processing**: [OpenRouter](https://openrouter.ai/) 

## Prerequisites

Before running the project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18+)
- [Bun](https://bun.sh/) (recommended) or npm/yarn/pnpm

You will also need API keys for the following services:
1. **Firecrawl**: For deeply scraping and extracting color/typography data from websites. Get a key at [Firecrawl](https://firecrawl.dev/).
2. **OpenRouter**: For processing the scraped data into an agent-ready markdown skill. Get a key at [OpenRouter](https://openrouter.ai/).

## Local Setup Instructions

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/shelar1423/stylesnatch.git
   cd stylesnatch
   ```

2. **Install dependencies**:
   ```bash
   bun install
   # or: npm install
   ```

3. **Configure Environment Variables**:
   Copy the provided example environment file to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file in your editor and add your API keys:
   ```env
   FIRECRAWL_API_KEY=your_firecrawl_key_here
   OPENROUTER_API_KEY=your_openrouter_key_here
   OPENROUTER_MODEL=google/gemini-2.5-flash # or your preferred model
   ```

4. **Run the Development Server**:
   ```bash
   bun run dev
   # or: npm run dev
   ```
   The application will be available at `http://localhost:8081` (or the port specified in your console).

## Usage

1. Open the local site in your browser.
2. Enter the URL of any beautifully designed website you admire in the main hero input.
3. Click "Start a scan". The tool will fetch the homepage, read the colors, typography, and spacing.
4. Once completed, download or copy the generated `SKILL.md`.
5. Drop this markdown file into your AI coding assistant (like Cursor, Windsurf, or Copilot) to give your agent a refined design taste.

## Building for Production

To create a production build:
```bash
bun run build
# or: npm run build
```
You can then preview the production build using:
```bash
bun run preview
# or: npm run preview
```
