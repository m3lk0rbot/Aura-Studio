# 🚀 Gemini Live Agent Challenge: Task List (Aura Studio)

This task list outlines the steps to transform **Social Content Studio** into a **Aura Studio** agent that fulfills the hackathon requirements by generating interleaved multimodal output (Caption + Image + Hashtags).

## 1. Data Structure Updates (`types.ts`)
- [ ] **Extend `GeneratedPost` Interface**:
    - Add `imageUrl?: string` (to store base64 image data).
    - Add `visualDescription?: string` (to store the AI's visual concept for accessibility).
- [ ] **Update `TextAnalysis` (Optional)**:
    - Add fields if needed for more complex visual guidance.

## 2. AI Service Enhancements (`services/aiService.ts`)
- [ ] **Switch to Multimodal Models**:
    - Transition `generatePostsGemini` to use `gemini-2.5-flash-image` (or `gemini-3.1-flash-image-preview` for higher quality).
- [ ] **Implement "Creative Director" System Instruction**:
    - Add the comprehensive system instruction that defines the agent as a Creative Director.
    - Explicitly command the model to generate **interleaved output** (text and image in one turn).
- [ ] **Update Prompt Engineering**:
    - Modify the prompt to include "Visual Hints" provided by the user.
    - Request specific aspect ratios based on the platform (e.g., 9:16 for Instagram Stories/Snapchat, 1:1 for Facebook/Twitter).
- [ ] **Handle Multi-part Responses**:
    - Update the logic to iterate through `response.candidates[0].content.parts`.
    - Extract `text` for captions/hashtags.
    - Extract `inlineData` for the generated image.
- [ ] **Implement Image Configuration**:
    - Pass `imageConfig` (aspectRatio, imageSize) to the `generateContent` call.

## 3. UI Component Updates
### `components/InputPanel.tsx`
- [ ] **Add "Visual Context" Input**:
    - Create a new text area or input field for "Visual Style/Hints" (e.g., "Cyberpunk", "Minimalist", "Warm lighting").
    - Pass this context to the generation service.

### `components/PostGenerator.tsx`
- [ ] **Update Post Card Layout**:
    - Add an `<img />` slot to display the generated visual asset.
    - Ensure `referrerPolicy="no-referrer"` is set on images.
- [ ] **Add "Interleaved Mode" Toggle**:
    - Allow users to toggle between "Text Only" and "Text + Image" generation.
- [ ] **Enhance Loading States**:
    - Add a specific "Generating Visuals..." indicator, as image generation takes longer.
- [ ] **Image Preview & Actions**:
    - Add a "Download Image" button for each generated post.

## 4. Platform & Compliance
- [ ] **API Key Selection Dialog**:
    - If using Gemini 3.1 models, implement `window.aistudio.openSelectKey()` and `window.aistudio.hasSelectedApiKey()`.
- [ ] **Google Cloud Hosting**:
    - Ensure the app remains compatible with the Cloud Run environment.
- [ ] **SDK Validation**:
    - Verify all calls use the `@google/genai` SDK correctly for multimodal inputs/outputs.

## 5. Verification & Final Polish
- [ ] **Run Linting**: `npm run lint` (or `lint_applet` tool).
- [ ] **Run Compilation**: `npm run build` (or `compile_applet` tool).
- [ ] **Manual Testing**: Verify that one click generates a cohesive package of caption, hashtags, and a relevant image.
- [ ] **Update Documentation**: Refresh `README.md` to highlight the new "Aura Studio" capabilities.

---
**Status:** ⏳ Pending Implementation
