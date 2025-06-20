
# GroZen: Level Up Your Vibe! ✨

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Genkit (Gemini)](https://img.shields.io/badge/AI%20by%20Genkit%20(Gemini)-4285F4?style=flat&logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Free AI Wellness Quest for Teens: Personalized Plans, Mood Boosts & Fun Challenges!**

GroZen is a free, AI-powered wellness app designed specifically for teens. We're turning self-care into an epic adventure with personalized health missions, instant mood feedback, and friendly competition.

## The Problem We're Solving
Many teens struggle to find engaging, accessible, and non-judgmental tools to manage their physical and mental well-being. Generic advice often misses the mark, and traditional wellness apps can feel clinical or overwhelming. There's a clear need for a wellness solution that speaks their language and fits their lifestyle.

## Our Solution: AI-Powered Wellness, Gamified!
GroZen uses cutting-edge AI (powered by Genkit with Google's Gemini models) to provide a unique and personalized wellness experience:

*   🧠 **Personalized Diet & Wellness Plans:** Our AI crafts tailored meal suggestions, exercise ideas, and mindfulness practices based on individual goals, dietary preferences (vegetarian, vegan, gluten-free, etc.), and budget. No more cookie-cutter advice!
*   📅 **AI-Powered Daily Quest Planner:** Teens describe their day's tasks and goals in natural language. GroZen's AI intelligently parses this into a fun, structured "Quest List" with estimated timings and XP rewards, making daily planning engaging.
*   😊 **Empathetic AI Mood Meter & Feedback:** Log your mood with emojis and optional selfies. Our AI offers supportive, non-judgmental feedback and helps track mood trends over time, promoting self-awareness.

## Key Features
*   🤖 **AI Plan Generator:** Get personalized wellness plans including meals, exercise, and mindfulness routines.
*   🗓️ **AI Daily Quest Scheduler:** Input your day in natural language, and our AI builds your gamified schedule.
*   😊 **AI Mood Tracker:** Log moods with emojis & optional selfies; receive instant AI insights.
*   🛒 **Smart Grocery Lists:** Automatically generated from your AI-crafted meal plan.
*   🏆 **Challenge Leaderboards:** Join wellness challenges, compete with friends, and climb the ranks.
*   ✨ **XP & Levels:** Progress through levels as you complete quests and build healthy habits.
*   🤳 **Social Share:** 'Before vs. After' progress sharing for challenges (Coming Soon!).
*   🔒 **Secure & Private:** Built with user privacy as a top priority. Firebase ensures robust security.

## Why GroZen for StartWell?
GroZen is a perfect fit for StartWell's focus on AI-driven wellness solutions:

*   🚀 **Showcase AI:** We clearly leverage Google's Gemini models via Genkit for:
    *   Personalized diet and wellness plan generation.
    *   Intelligent daily scheduling from natural language user input.
    *   Empathetic and contextual mood feedback.
    *   Selfie image validation for human faces.
    This directly aligns with StartWell’s AI innovation criteria.
*   🤸 **Teen Appeal:** Our UI/UX uses vibrant visuals, gamified language ("Quests," "XP," "Level Up Your Vibe!"), and features like leaderboards to make wellness genuinely engaging and fun for teenagers.
*   🛡️ **Professionalism & Impact:** We've focused on clean code, robust Firebase backend, and ethical considerations around AI and user data. GroZen aims to make a tangible positive impact on teen wellness.
*   ♿ **User Experience & Accessibility:** Intuitive onboarding, simple daily interactions, and clear visual feedback make GroZen easy and enjoyable to use.
*   📈 **Scalability & Sustainability:** Our Firebase architecture is inherently scalable. Future plans include group challenges and deeper AI insights, demonstrating a vision for growth.

## Tech Stack
*   **Frontend:** Next.js (App Router), React, TypeScript
*   **Styling:** Tailwind CSS, ShadCN UI (Neumorphic-inspired dark theme)
*   **AI Engine:** Genkit (with Google Gemini Models) for all generative AI features.
*   **Backend & Auth:** Firebase (Authentication, Firestore for database, Cloud Functions for Genkit integration if deployed as such).
*   **Hosting:** Firebase Hosting / Vercel

## The Team
*   **Lakshya Gupta** (Student Developer)
*   **The Techiral Team** (Conceptual Support)

## Screenshots
*(High-quality screenshots showcasing the app's UI will be added here. Ensure they reflect the vibrant, teen-friendly design.)*

*   [AI Buddy Boost Thumbnail - Placeholder for Repo Social Preview](https://placehold.co/1280x640.png?text=GroZen+AI+Buddy+Boost)
*   Landing Page: `[View Landing Page](https://placehold.co/600x400.png?text=GroZen+Landing+Page)`
*   Onboarding Flow: `[View Onboarding](https://placehold.co/600x400.png?text=GroZen+Onboarding)`
*   Dashboard - AI Quest Planner: `[View AI Quest Planner](https://placehold.co/600x400.png?text=Dashboard+Quests)`
*   AI Generated Wellness Plan: `[View Wellness Plan](https://placehold.co/600x400.png?text=AI+Wellness+Plan)`
*   Mood Logging & AI Feedback: `[View Mood Log](https://placehold.co/600x400.png?text=Mood+Logging)`
*   Challenge Leaderboard: `[View Leaderboard](https://placehold.co/600x400.png?text=Leaderboard)`

## Getting Started
Follow these steps to get GroZen running locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/GroZen.git
    cd GroZen
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Set up Environment Variables:**
    *   Copy the `.env.example` file to a new file named `.env.local`.
    *   Fill in your Firebase project configuration details in `.env.local`. You can get these from your Firebase project settings.
    *   If you're running Genkit locally and not using Firebase Extensions for billing/API key management, ensure your `GOOGLE_API_KEY` is set in your environment or `.env` file for Genkit to access Google AI Studio models.
4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The app will be available at `http://localhost:9002` (or your configured port).

5.  **(Optional) Run Genkit Developer UI (for testing flows):**
    In a separate terminal:
    ```bash
    npm run genkit:dev
    ```
    This will typically start the Genkit Developer UI on `http://localhost:4000`.

## Demo Video
🎬 **[Watch our GroZen Demo on YouTube!](YOUR_YOUTUBE_LINK_HERE)**
*(Please ensure your video is public or unlisted and marked "Not for Kids" for COPPA compliance if applicable).*

## Future Plans
*   **Group Challenges & Team Play:** Foster social wellness and friendly competition.
*   **Wearable Device Integration:** Sync activity data for more holistic tracking.
*   **Advanced AI Insights:** Predictive wellness tips and deeper trend analysis.
*   **Customizable Avatars & Themes:** More personalization options for users.
*   **Expanded Content Library:** More diverse quest types, mindfulness exercises, and meal ideas.

## Ethical AI & Data Privacy
We are committed to responsible AI development and user data protection:
*   **User Privacy:** Mood logs, selfies (if provided), and personal preferences are stored securely using Firebase Firestore and are tied to the user's authenticated account. We adhere to best practices for data security.
*   **AI Interactions:** Our AI is designed to be supportive, positive, and non-judgmental. We actively monitor and refine prompts to ensure ethical and helpful responses.
*   **Selfie Data:** Selfie uploads for mood logging are optional. If used for AI face validation, this is clearly communicated, and images are processed to confirm human presence without storing identifiable facial recognition data long-term unless explicitly stated for features like progress tracking (with consent).
*   **Transparency:** Users are informed about how their data is used to personalize their experience.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact
Questions or feedback? Reach out to [Your Name/Team Name] at [your.email@example.com] or connect with us on [Social Media Link - Optional].

---
*Built with ❤️ for the StartWell AI Wellness Hackathon!*
