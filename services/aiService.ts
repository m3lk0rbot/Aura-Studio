import { CampaignResult, GeneratedPost, SummaryResult, TextAnalysis, CampaignPost } from '../types';
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Initialize Gemini lazily to pick up user-selected keys from process.env.API_KEY or Vite env vars
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please configure it in your environment variables (VITE_GEMINI_API_KEY).");
  }
  return new GoogleGenAI({ apiKey });
};

const SYSTEM_INSTRUCTION = `You are a world-class social media copywriter. 
Your goal is to create engaging, platform-specific content that drives interaction.
Output MUST be valid JSON.`;

const CAMPAIGN_SYSTEM_INSTRUCTION = `You are a world-class Multimodal Creative Director and Social Media Strategist. 
Your goal is to transform raw concepts into a high-impact, multi-platform social media campaign.
For the input text, you must generate:
1. A concise summary and key topics.
2. Exactly 3 distinct, high-quality visual descriptions for images that represent the campaign.
3. Multiple social media posts for different platforms as requested.

Platform Specific Requirements:
- Facebook: 2 posts (1x Friendly, 1x Community)
- Twitter: 2 posts (1x Normal, 1x Thread)
- LinkedIn: 2 posts (1x Professional, 1x Thought Leader)
- Instagram: 2 posts (1x Aesthetic, 1x Caption)
- SnapChat: 2 posts (1x Casual, 1x Hype)
- Telegram: 2 posts (1x Update, 1x Broadcast)
- Pinterest: 2 posts (1x Descriptive, 1x Default)
- Reddit: 2 posts (1x Discussion, 1x Default)

Each post must include the specific style tag requested.
Output MUST be valid JSON.`;

// --- COMMON HELPERS ---

const splitSentences = (text: string): string[] => {
  return text.match(/[^.!?]+[.!?]+/g) || [text];
};

const getStopWords = () => new Set([
  'the', 'and', 'a', 'to', 'of', 'in', 'is', 'that', 'for', 'it', 'with', 'as', 'was', 'are', 'on', 'be', 'at', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has', 'look', 'two', 'more', 'write', 'go', 'see', 'number', 'no', 'way', 'could', 'people', 'my', 'than', 'first', 'water', 'been', 'call', 'who', 'oil', 'its', 'now', 'find'
]);

const positiveWords = new Set(['good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'like', 'happy', 'success', 'win', 'improve', 'better', 'easy', 'smart', 'beautiful', 'creative', 'positive', 'excited', 'growth', 'strong']);
const negativeWords = new Set(['bad', 'terrible', 'worst', 'hate', 'fail', 'hard', 'difficult', 'wrong', 'error', 'sad', 'angry', 'poor', 'weak', 'negative', 'fear', 'problem', 'issue', 'stop', 'loss']);

// --- ANALYSIS (Runs Locally for Speed) ---

export const analyzeText = (text: string): TextAnalysis => {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const charCount = text.length;
    const readingTime = Math.ceil(wordCount / 200) || 1;

    let score = 0;
    words.forEach(w => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        if (positiveWords.has(clean)) score++;
        if (negativeWords.has(clean)) score--;
    });
    
    let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
    if (score > 1) sentiment = 'Positive';
    if (score < -1) sentiment = 'Negative';

    const avgWordLen = words.reduce((acc, w) => acc + w.length, 0) / (wordCount || 1);
    let complexity: 'Simple' | 'Moderate' | 'Complex' = 'Moderate';
    if (avgWordLen < 4.5) complexity = 'Simple';
    if (avgWordLen > 6) complexity = 'Complex';

    return { wordCount, charCount, readingTime, sentiment, complexity };
};

// --- CAMPAIGN GENERATION ---

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- AUDIO HELPERS ---

const createWavHeader = (dataLength: number) => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    /* RIFF identifier */
    view.setUint32(0, 0x52494646, false);
    /* file length */
    view.setUint32(4, 36 + dataLength, true);
    /* RIFF type */
    view.setUint32(8, 0x57415645, false);
    /* format chunk identifier */
    view.setUint32(12, 0x666d7420, false);
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, 24000, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, 24000 * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    view.setUint32(36, 0x64617461, false);
    /* data chunk length */
    view.setUint32(40, dataLength, true);
    
    return buffer;
};

const base64ToUint8Array = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const uint8ArrayToBase64 = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

async function generateAudioWithRetry(text: string, retries = 3, delay = 2000): Promise<string | undefined> {
    for (let i = 0; i < retries; i++) {
        try {
            const audioResponse = await getAI().models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    }
                }
            });
            const rawBase64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!rawBase64) return undefined;

            // Convert raw PCM to WAV
            const pcmData = base64ToUint8Array(rawBase64);
            const wavHeader = new Uint8Array(createWavHeader(pcmData.length));
            const wavData = new Uint8Array(wavHeader.length + pcmData.length);
            wavData.set(wavHeader);
            wavData.set(pcmData, wavHeader.length);

            return uint8ArrayToBase64(wavData);
        } catch (err: any) {
            const isQuotaError = err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED");
            if (isQuotaError && i < retries - 1) {
                console.warn(`Audio generation rate limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
                await sleep(delay * (i + 1)); // Exponential backoff
                continue;
            }
            throw err;
        }
    }
    return undefined;
}

const generateLocalCampaign = (text: string, config: Record<string, { name: string; styles: { label: string; value: string }[] }>): CampaignResult => {
    const posts: CampaignPost[] = [];
    Object.entries(config).forEach(([id, platform]) => {
        platform.styles.forEach(style => {
            posts.push({
                platform: platform.name,
                style: style.label,
                content: `[Local Mode] ${platform.name} (${style.label}):\n\n${text.substring(0, 200)}...`
            });
        });
    });
    return {
        summary: "Local mode generation (AI disabled)",
        keywords: ["local", "text-only"],
        images: [],
        posts
    };
};

export const generateCampaign = async (
    text: string,
    config: Record<string, { name: string; styles: { label: string; value: string }[] }>,
    usePro: boolean,
    options: { text: boolean; image: boolean; audio: boolean },
    onProgress?: (stepId: string) => void
): Promise<CampaignResult> => {
    if (!usePro || !options.text) {
        onProgress?.('analyzing');
        return generateLocalCampaign(text, config);
    }

    try {
        const model = 'gemini-3-flash-preview';
        
        onProgress?.('analyzing');
        // Prepare a prompt that includes all platforms and their requested styles
        const platformRequests = Object.values(config).map(p => ({
            name: p.name,
            styles: p.styles.map(s => s.label)
        }));

        const prompt = `Generate a full social media campaign for the following text.
        Platforms and Styles: ${JSON.stringify(platformRequests)}
        
        Input Text: "${text.substring(0, 8000)}"`;

        const response = await getAI().models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: CAMPAIGN_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        visualDescriptions: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "Exactly 3 distinct image prompts for the campaign" 
                        },
                        posts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    platform: { type: Type.STRING },
                                    style: { type: Type.STRING, description: "The style tag (e.g., Friendly, Community, Normal, Thread, etc.)" },
                                    content: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });

        const data = JSON.parse(response.text);
        const postsData = data.posts || [];
        
        // 1. Generate 3 Images
        const images: { url: string; description: string }[] = [];
        if (options.image) {
            onProgress?.('images');
            const visualDescriptions = data.visualDescriptions || [];
            
            await Promise.all(visualDescriptions.slice(0, 3).map(async (desc: string) => {
                try {
                    const imageResponse = await getAI().models.generateContent({
                        model: 'gemini-3.1-flash-image-preview',
                        contents: { parts: [{ text: desc }] },
                        config: { imageConfig: { aspectRatio: "1:1", imageSize: "512px" } }
                    });
                    for (const part of imageResponse.candidates[0].content.parts) {
                        if (part.inlineData) {
                            images.push({
                                url: `data:image/png;base64,${part.inlineData.data}`,
                                description: desc
                            });
                            break;
                        }
                    }
                } catch (imgErr) {
                    console.error("Image generation failed", imgErr);
                }
            }));
        }

        // 2. Generate Audio for all posts in small batches to avoid rate limits
        const postsWithAudio: CampaignPost[] = [];
        if (options.audio) {
            onProgress?.('audio');
            const batchSize = 3; // Small batch size for TTS
            
            for (let i = 0; i < postsData.length; i += batchSize) {
                const batch = postsData.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map(async (post: any) => {
                    try {
                        const base64Audio = await generateAudioWithRetry(post.content);
                        return {
                            ...post,
                            audioUrl: base64Audio ? `data:audio/wav;base64,${base64Audio}` : undefined
                        };
                    } catch (audioErr) {
                        console.error("Audio generation failed for post", post.platform, audioErr);
                        return post;
                    }
                }));
                postsWithAudio.push(...batchResults);
                
                // Brief pause between batches if not the last one
                if (i + batchSize < postsData.length) {
                    await sleep(500);
                }
            }
        } else {
            postsWithAudio.push(...postsData);
        }

        return {
            summary: data.summary,
            keywords: data.keywords,
            images,
            posts: postsWithAudio
        };

    } catch (e) {
        console.error("Campaign generation failed", e);
        throw new Error("Failed to generate campaign.");
    }
};

// --- SUMMARIZATION ---

const summarizeHeuristic = async (text: string, length: string): Promise<SummaryResult> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const sentences = splitSentences(text.trim());
  const numSentences = parseInt(length) || 4;
  let summary = "";
  
  if (sentences.length <= numSentences) {
    summary = text;
  } else {
    const first = sentences[0];
    const last = sentences[sentences.length - 1];
    const middleCount = Math.max(0, numSentences - 2);
    const step = Math.floor((sentences.length - 2) / (middleCount + 1));
    const middle = [];
    for (let i = 0; i < middleCount; i++) {
      const idx = 1 + (i + 1) * step;
      if (sentences[idx]) middle.push(sentences[idx]);
    }
    summary = [first, ...middle, last].join(' ');
  }

  // Local Keyword Extraction
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const stopWords = getStopWords();
  const freqMap: Record<string, number> = {};
  words.forEach(w => {
    if (w.length > 3 && !stopWords.has(w)) {
      freqMap[w] = (freqMap[w] || 0) + 1;
    }
  });
  const keywords = Object.entries(freqMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);

  return { summary, keywords };
};

const summarizeGemini = async (text: string, length: string): Promise<SummaryResult> => {
  try {
      const model = 'gemini-2.5-flash';
      const prompt = `Analyze the following text. 
      1. Provide a summary that is approximately ${length} sentences long. 
      2. Extract 5-8 key topics/tags as a list of keywords.
      
      Text: "${text.substring(0, 10000)}"`; // Safety clip

      const response = await getAI().models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
      });
      
      const json = JSON.parse(response.text);
      
      return {
          summary: json.summary || json.text || "Could not generate summary.",
          keywords: json.keywords || []
      };
  } catch (error) {
      console.error("Gemini Error", error);
      throw new Error("Gemini API failed. Check your API Key.");
  }
};

export const summarizeText = async (text: string, length: string, usePro: boolean): Promise<SummaryResult> => {
    if (usePro) {
        // We use a specific schema to guarantee the shape
        try {
             const response = await getAI().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Summarize the text in ${length} sentences and extract keywords. Text: ${text.substring(0, 8000)}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING },
                            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
             });
             const data = JSON.parse(response.text);
             return { summary: data.summary, keywords: data.keywords };
        } catch (e) {
            console.error(e);
            return summarizeHeuristic(text, length); // Fallback
        }
    }
    return summarizeHeuristic(text, length);
};

// --- POST GENERATION ---

const generatePostsHeuristic = async (platform: string, text: string, style: string, hashtags: boolean): Promise<GeneratedPost[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const sentences = splitSentences(text.trim());
  const shuffled = [...sentences].sort(() => 0.5 - Math.random());
  const candidates = shuffled.filter(s => s.length > 15);
  const keyPoints = candidates.length >= 5 ? candidates.slice(0, 5) : sentences.slice(0, 5);
  
  while (keyPoints.length < 5) {
      keyPoints.push(sentences[Math.floor(Math.random() * sentences.length)] || text.substring(0, 50));
  }

  const baseTemplates: Record<string, (s: string) => string> = {
    'friendly and engaging': (s) => `✨ Loving this concept:\n\n"${s.trim()}"\n\nWho else agrees? 🙋‍♂️`,
    'bold and controversial': (s) => `🚨 Unpopular opinion maybe, but:\n\n${s.trim()}\n\nThoughts? 👇`,
    'community-focused question': (s) => `Question for the group 💭\n\nWhen it comes to this: "${s.trim()}"\n\nWhat's your experience?`,
    'casual': (s) => `${s.trim().toLowerCase()} 🤷‍♂️`,
    'professional': (s) => `🚀 Key Takeaway:\n\n${s.trim()}\n\nConsistency is key in our industry. #Professional #Growth`,
  };

  const getTemplate = (p: string, s: string) => {
    const tmpl = baseTemplates[style] || ((txt) => txt);
    switch (p) {
        case 'Snapchat': return `👻 Mood:\n${s.substring(0, 60)}...\n\nSwipe up 👆`;
        case 'Instagram': return `📸 ${s.trim()}\n.\n.\nLink in bio! ✨`;
        case 'LinkedIn': return `💡 Thought Leadership\n\n${s.trim()}\n\nWhat is your perspective? 👇`;
        case 'Twitter': return `${s.substring(0, 200)}... 🧵`;
        default: return tmpl(s);
    }
  };

  return keyPoints.map((point, idx) => {
    let content = getTemplate(platform, point);
    if (platform === 'Twitter' && content.length > 280) content = content.substring(0, 277) + "...";
    if (hashtags) {
       const tags = ["#fyp", `#${platform}`, "#trending"];
       content += `\n\n${tags.join(' ')}`;
    }
    return { id: `${platform}-${Date.now()}-${idx}`, content };
  });
};

const generatePostsGemini = async (platform: string, text: string, style: string, hashtags: boolean): Promise<GeneratedPost[]> => {
    try {
        const model = 'gemini-3-flash-preview';
        const prompt = `Write 5 distinct ${platform} posts based on the text below.
        Style: ${style}.
        Hashtags: ${hashtags ? "Include relevant hashtags" : "No hashtags"}.
        
        Input Text: "${text.substring(0, 8000)}"`;

        const response = await getAI().models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        posts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    content: { type: Type.STRING, description: "The caption including hashtags if requested" },
                                    visualDescription: { type: Type.STRING, description: "Detailed prompt for image generation" }
                                }
                            }
                        }
                    }
                }
            }
        });

        const data = JSON.parse(response.text);
        const postsData = data.posts || [];
        const posts: GeneratedPost[] = [];

        // Generate images in parallel for each post
        const imagePromises = postsData.map(async (p: any, i: number) => {
            try {
                const imageResponse = await getAI().models.generateContent({
                    model: 'gemini-3.1-flash-image-preview',
                    contents: {
                        parts: [{ text: p.visualDescription }]
                    },
                    config: {
                        imageConfig: {
                            aspectRatio: "1:1",
                            imageSize: "512px"
                        }
                    }
                });

                let imageUrl = "";
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                        break;
                    }
                }

                return {
                    id: `gemini-${Date.now()}-${i}`,
                    content: p.content,
                    imageUrl,
                    visualDescription: p.visualDescription
                };
            } catch (imgErr) {
                console.error("Image generation failed for post", i, imgErr);
                return {
                    id: `gemini-${Date.now()}-${i}`,
                    content: p.content,
                    visualDescription: p.visualDescription
                };
            }
        });

        return await Promise.all(imagePromises);

    } catch (e) {
        console.error(e);
        throw new Error("Gemini generation failed.");
    }
};

export const generatePosts = async (
  platform: string,
  text: string,
  style: string,
  hashtags: boolean,
  usePro: boolean
): Promise<GeneratedPost[]> => {
    if (usePro) {
        return generatePostsGemini(platform, text, style, hashtags);
    }
    return generatePostsHeuristic(platform, text, style, hashtags);
};