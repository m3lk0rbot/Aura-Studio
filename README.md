# Aura Studio

Aura Studio is a local-first, AI-powered social media post generator designed to help creators, marketers, and businesses transform long-form text into engaging, multimodal social media campaigns across multiple platforms.

## 🚀 Overview 

The application leverages the **Gemini API** to analyze source text and generate platform-specific posts. It features a sleek, dark-themed interface built with **React 19** and **Tailwind CSS**, prioritizing speed and local data persistence. Aura Studio fulfills the Gemini Live Agent Challenge requirements by generating interleaved multimodal output (Caption + Image + Audio + Hashtags).

## ✨ Key Features

- **Interleaved Multimodal Output:** Generates a complete campaign with text captions, AI-generated images, AI voice narratives (audio), and strategic hashtags in a single cohesive flow.
- **Smart Text Analysis:** Automatically generates summaries and extracts key topics from your source text.
- **Multi-Platform Support:**
  - **Standard:** Facebook, Twitter, LinkedIn.
  - **Pro:** Instagram, Snapchat, Telegram, Pinterest, Reddit.
- **Style Customization:** Generate posts in various tones (e.g., Friendly, Professional, Punchy, Thought Leader).
- **Cloud Archive:** Save your favorite generated campaigns and posts, including images and audio, directly to Firebase.
- **Responsive Design:** Optimized for both desktop and mobile workflows.
- **Pro Mode:** Unlock advanced platforms, image generation, and audio generation features.

## ☁️ Google Services Used

Aura Studio heavily relies on Google Cloud and AI services to deliver its multimodal experience:

- **Gemini API (`@google/genai`)**
  - `gemini-3-flash-preview`: Used for text analysis, summarization, and generating structured JSON schemas for multi-platform social media campaigns.
  - `gemini-2.5-flash-image`: Used to generate high-quality, contextual visual assets (images) for the social media posts.
  - `gemini-2.5-flash-preview-tts`: Used to generate natural-sounding voiceovers and audio narratives for the posts.
- **Firebase**
  - **Authentication:** Google Sign-In for secure user access and identity management.
  - **Cloud Firestore:** NoSQL database used to store user profiles, generated campaigns, and archived posts.
  - **Cloud Storage:** Used to securely store and serve the AI-generated images (`.png`) and audio files (`.wav`).

## 🛠️ Tech Stack

- **Frontend:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine:** [@google/genai](https://www.npmjs.com/package/@google/genai) (Gemini API)
- **Backend/Storage:** [Firebase](https://firebase.google.com/) (Firestore, Auth & Cloud Storage)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd aura-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   *(Note: Ensure your `firebase-applet-config.json` is present in the `src` directory for Firebase initialization).*

### Development

Run the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Build

To build the project for production:
```bash
npm run build
```

## 🧪 Reproducible Testing Instructions (For Judges)

*Did you add Reproducible Testing instructions to your README?* **Yes!** 
Here is how to test the project and evaluate its multimodal capabilities:

1. **Environment Setup:**
   - Clone the repository and run `npm install`.
   - Ensure you have a valid `firebase-applet-config.json` in the `src` directory for Firebase configuration.
   - Set your Gemini API key in the `.env` file: `GEMINI_API_KEY=your_api_key_here`.
   - Start the development server: `npm run dev` and open `http://localhost:3000`.

2. **Authentication:**
   - Click **"Sign In with Google"** in the top right corner to authenticate. This is required to save campaigns to Firestore and upload media to Cloud Storage.

3. **Generating a Multimodal Campaign:**
   - In the **Editor** tab, paste a sample text (e.g., a blog post, an article, or product release notes).
   - Toggle **"Pro Mode"** on the top right to unlock Image and Audio generation capabilities.
   - Select your target platforms (e.g., Twitter, LinkedIn, Instagram) and choose the desired styles (e.g., "Thread", "Professional").
   - Ensure the **"Generate Images"** and **"Generate Audio"** toggles are checked in the configuration panel.
   - Click **"Generate Campaign"**.

4. **Verifying the Output:**
   - Wait for the generation process to complete (you will see progress indicators for Analyzing, Images, and Audio).
   - Once finished, navigate through the platform tabs to see the generated posts.
   - **Text:** Verify the captions are tailored to the platform and style, complete with hashtags.
   - **Images:** Verify that an AI-generated image is displayed alongside the post.
   - **Audio:** Click the play button on the audio player to hear the AI-generated voiceover.

5. **Archiving and Retrieval:**
   - Click the **"Save to Archive"** button on a generated post.
   - Click the **"Archive"** button in the top navigation bar.
   - Verify that your saved campaign/post appears in the archive list, and that the image and audio playback work correctly (fetched from Firebase Cloud Storage).

## 🛡️ Pro Features

Upgrade to Pro to unlock:
- **Multimodal Generation:** Unlock AI Image and Audio generation for your posts.
- **Instagram & Snapchat:** Visual-first platform caption generation.
- **Telegram & Reddit:** Community-focused broadcast and discussion styles.
- **Pinterest:** Descriptive and aesthetic pin descriptions.
- **Advanced Styles:** More nuanced tone options for every platform.

---

Built with ❤️ for social media creators.
