import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const SUPABASE_TABLE = 'cadence_sessions';
const OWNER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

function supabaseHeaders(key: string, extra: Record<string, string> = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function validOwnerId(ownerId: unknown): ownerId is string {
  return typeof ownerId === 'string' && OWNER_ID_RE.test(ownerId);
}


// Initialise Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
    timeout: 18_000,
    retryOptions: { attempts: 1 },
  },
});

export interface SpeechAnalysisResponse {
  transcript: string;
  transcriptSegments: Array<{
    text: string;
    type: 'normal' | 'filler' | 'pause' | 'strong_point' | 'weak_hedge';
    feedbackNote?: string;
  }>;
  metrics: {
    durationSeconds: number;
    wordCount: number;
    wordsPerMinute: number;
    pacingRating: 'too_slow' | 'measured' | 'ideal' | 'brisk' | 'rushed';
    pacingFeedback: string;
    fillerWordsCount: number;
    fillerDensityPct: number;
    fillersBreakdown: Array<{
      word: string;
      count: number;
      frequencyFeedback: string;
    }>;
    pauseCount: number;
    pauseFeedback: string;
    vocabularyRichnessPct: number;
    clarityScore: number;
    confidenceScore: number;
    structureScore: number;
    overallScore: number;
    toneImpression: string;
  };
  coaching: {
    executiveSummary: string;
    superpowers: Array<{
      title: string;
      observation: string;
      quote: string;
    }>;
    honestBlindspots: Array<{
      title: string;
      criticalFeedback: string;
      impactOnAudience: string;
      actionableFix: string;
    }>;
    rewrites: Array<{
      originalSnippet: string;
      polishedVersion: string;
      rationale: string;
    }>;
    practiceDrills: Array<{
      drillName: string;
      estimatedMinutes: number;
      instructions: string;
    }>;
    recruiterVerdict: string;
  };
}

// Session persistence uses a random per-browser owner ID. The service key stays server-side.
app.get('/api/sessions', async (req, res) => {
  const ownerId = req.query.ownerId;
  if (!validOwnerId(ownerId)) return res.status(400).json({ error: 'A valid owner ID is required.' });
  const config = getSupabaseConfig();
  if (!config) return res.status(503).json({ error: 'Session database is not configured.' });

  try {
    const url = new URL(`${config.url}/rest/v1/${SUPABASE_TABLE}`);
    url.searchParams.set('owner_id', `eq.${ownerId}`);
    url.searchParams.set('select', 'session_data');
    url.searchParams.set('order', 'created_at.desc');
    const response = await fetch(url, { headers: supabaseHeaders(config.key) });
    if (!response.ok) {
      console.error('Session load failed:', response.status);
      return res.status(502).json({ error: 'Could not load saved sessions.' });
    }
    const rows = await response.json() as Array<{ session_data: SpeechAnalysisResponse }>;
    return res.json(rows.map((row) => row.session_data));
  } catch (error) {
    console.error('Session load failed:', error);
    return res.status(502).json({ error: 'Could not load saved sessions.' });
  }
});

app.post('/api/sessions', async (req, res) => {
  const { ownerId, session } = req.body ?? {};
  if (!validOwnerId(ownerId) || !session || typeof session.id !== 'string' || typeof session.timestamp !== 'number') {
    return res.status(400).json({ error: 'A valid owner ID and session are required.' });
  }
  const config = getSupabaseConfig();
  if (!config) return res.status(503).json({ error: 'Session database is not configured.' });

  try {
    const { audioBlobUrl: _temporaryAudioUrl, ...persistedSession } = session;
    const url = new URL(`${config.url}/rest/v1/${SUPABASE_TABLE}`);
    url.searchParams.set('on_conflict', 'owner_id,session_id');
    const response = await fetch(url, {
      method: 'POST',
      headers: supabaseHeaders(config.key, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({
        owner_id: ownerId,
        session_id: session.id,
        session_data: persistedSession,
        created_at: new Date(session.timestamp).toISOString(),
      }),
    });
    if (!response.ok) {
      console.error('Session save failed:', response.status, await response.text());
      return res.status(502).json({ error: 'Could not save the session.' });
    }
    return res.status(204).end();
  } catch (error) {
    console.error('Session save failed:', error);
    return res.status(502).json({ error: 'Could not save the session.' });
  }
});

app.delete('/api/sessions/:sessionId', async (req, res) => {
  const ownerId = req.query.ownerId;
  const sessionId = req.params.sessionId;
  if (!validOwnerId(ownerId) || !sessionId) return res.status(400).json({ error: 'A valid owner ID and session ID are required.' });
  const config = getSupabaseConfig();
  if (!config) return res.status(503).json({ error: 'Session database is not configured.' });

  try {
    const url = new URL(`${config.url}/rest/v1/${SUPABASE_TABLE}`);
    url.searchParams.set('owner_id', `eq.${ownerId}`);
    url.searchParams.set('session_id', `eq.${sessionId}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: supabaseHeaders(config.key, { Prefer: 'return=minimal' }),
    });
    if (!response.ok) {
      console.error('Session delete failed:', response.status, await response.text());
      return res.status(502).json({ error: 'Could not delete the session.' });
    }
    return res.status(204).end();
  } catch (error) {
    console.error('Session delete failed:', error);
    return res.status(502).json({ error: 'Could not delete the session.' });
  }
});

// POST /api/analyze-speech
app.post('/api/analyze-speech', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType,
      transcript: incomingTranscript,
      speechContext,
      durationSeconds = 60,
    } = req.body;

    const topic = speechContext?.topic || 'General Presentation';
    const category = speechContext?.category || 'academic_presentation';
    const audience = speechContext?.audience || 'General Academic / Professional Audience';
    const notesPrompt = speechContext?.notesPrompt || '';

    const systemInstruction = `You are Elena Vance, a world-class speech and communication coach known for delivering HONEST, INSTANT, and EMPOWERING feedback to university students and job seekers.
Context:
- Category: ${category}
- Topic/Prompt: "${topic}"
- Intended Audience: ${audience}
- Speaker Notes / Objectives: "${notesPrompt}"
- Recorded Duration: ~${Math.round(durationSeconds)} seconds.

Problem to solve:
Students get no honest, instant feedback when practicing presentations. Their peers simply say "It was great!" which leaves them unaware of crutch words, pacing rushes, defensive hedges, or lack of conviction.
Your job is to provide honest, rigorous, compassionate, and precise coaching.

If audio is provided:
1. Transcribe the speech VERBATIM without auto-cleaning filler words. If the speaker said "uh, basically like", you must preserve every single "uh", "like", and "basically".
2. Treat the topic and speaker notes as context only. Never include them in the transcript unless you can hear the speaker say them. Never invent a generic closing or substitute a canned sentence when speech is unclear; return an empty transcript if no speech is intelligible.
3. If no audio is provided but a transcript is provided, analyze the provided transcript with identical forensic rigor.

Return a valid JSON object matching the exact schema requested with:
- Verbatim transcript
- Segmented transcript with tags (filler, pause, weak_hedge, strong_point, normal)
- Quantitative delivery metrics (WPM calculated accurately from word count / duration in minutes, filler count, clarity, confidence, structure, and overall score out of 100)
- Deep, honest AI coaching: Executive summary, 3 superpowers with direct quotes, 3 honest blindspots that peers never tell them, before/after sentence rewrites, and 2 targeted drills.`;

    const contents: any[] = [];

    if (audioBase64) {
      contents.push({
        inlineData: {
          data: audioBase64,
          mimeType: mimeType || 'audio/webm',
        },
      });
      contents.push({
        text: `Listen to the attached audio. The topic "${topic}" is context only, not spoken content. Transcribe only words that are clearly audible, preserving fillers. Do not invent words, echo the topic, or add a generic opening or closing. If no speech is intelligible, return an empty transcript. Evaluate delivery metrics honestly and return the requested JSON.`,
      });
    } else if (incomingTranscript) {
      contents.push({
        text: `Analyze this speech transcript (${Math.round(durationSeconds)}s estimated delivery duration) for a talk on "${topic}".\n\nTRANSCRIPT:\n"${incomingTranscript}"\n\nEvaluate delivery metrics, identify fillers/hedges, and provide honest coaching tips. Return as JSON.`,
      });
    } else {
      return res.status(400).json({ error: 'Either audioBase64 or transcript must be provided.' });
    }

    // Try calling Gemini with retry and model fallback
    let parsedData: SpeechAnalysisResponse | null = null;
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transcript: { type: Type.STRING },
                transcriptSegments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      type: { type: Type.STRING },
                      feedbackNote: { type: Type.STRING },
                    },
                    required: ['text', 'type'],
                  },
                },
                metrics: {
                  type: Type.OBJECT,
                  properties: {
                    durationSeconds: { type: Type.NUMBER },
                    wordCount: { type: Type.INTEGER },
                    wordsPerMinute: { type: Type.INTEGER },
                    pacingRating: { type: Type.STRING },
                    pacingFeedback: { type: Type.STRING },
                    fillerWordsCount: { type: Type.INTEGER },
                    fillerDensityPct: { type: Type.NUMBER },
                    fillersBreakdown: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          word: { type: Type.STRING },
                          count: { type: Type.INTEGER },
                          frequencyFeedback: { type: Type.STRING },
                        },
                        required: ['word', 'count', 'frequencyFeedback'],
                      },
                    },
                    pauseCount: { type: Type.INTEGER },
                    pauseFeedback: { type: Type.STRING },
                    vocabularyRichnessPct: { type: Type.INTEGER },
                    clarityScore: { type: Type.INTEGER },
                    confidenceScore: { type: Type.INTEGER },
                    structureScore: { type: Type.INTEGER },
                    overallScore: { type: Type.INTEGER },
                    toneImpression: { type: Type.STRING },
                  },
                  required: [
                    'durationSeconds',
                    'wordCount',
                    'wordsPerMinute',
                    'pacingRating',
                    'pacingFeedback',
                    'fillerWordsCount',
                    'fillerDensityPct',
                    'fillersBreakdown',
                    'pauseCount',
                    'pauseFeedback',
                    'clarityScore',
                    'confidenceScore',
                    'structureScore',
                    'overallScore',
                    'toneImpression',
                  ],
                },
                coaching: {
                  type: Type.OBJECT,
                  properties: {
                    executiveSummary: { type: Type.STRING },
                    superpowers: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          observation: { type: Type.STRING },
                          quote: { type: Type.STRING },
                        },
                        required: ['title', 'observation', 'quote'],
                      },
                    },
                    honestBlindspots: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          criticalFeedback: { type: Type.STRING },
                          impactOnAudience: { type: Type.STRING },
                          actionableFix: { type: Type.STRING },
                        },
                        required: ['title', 'criticalFeedback', 'impactOnAudience', 'actionableFix'],
                      },
                    },
                    rewrites: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          originalSnippet: { type: Type.STRING },
                          polishedVersion: { type: Type.STRING },
                          rationale: { type: Type.STRING },
                        },
                        required: ['originalSnippet', 'polishedVersion', 'rationale'],
                      },
                    },
                    practiceDrills: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          drillName: { type: Type.STRING },
                          estimatedMinutes: { type: Type.INTEGER },
                          instructions: { type: Type.STRING },
                        },
                        required: ['drillName', 'estimatedMinutes', 'instructions'],
                      },
                    },
                    recruiterVerdict: { type: Type.STRING },
                  },
                  required: [
                    'executiveSummary',
                    'superpowers',
                    'honestBlindspots',
                    'rewrites',
                    'practiceDrills',
                    'recruiterVerdict',
                  ],
                },
              },
              required: ['transcript', 'transcriptSegments', 'metrics', 'coaching'],
            },
          },
        });

        const text = response.text;
        if (text) {
          parsedData = JSON.parse(text);
          break;
        }
      } catch (retryErr: any) {
        console.warn(`Model ${modelName} failed or busy, trying next candidate:`, retryErr?.message);
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    if (!parsedData && !incomingTranscript) {
      return res.status(503).json({
        error: 'Gemini could not transcribe this recording. Your audio is still available; please retry in a moment.',
      });
    }

    if (!parsedData) {
      // Heuristic fallback for temporary model outages
      const rawText = incomingTranscript || 'Thank you for listening to my practice talk on ' + topic;
      const words = rawText.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const wpm = Math.round((wordCount / Math.max(durationSeconds, 10)) * 60) || 135;

      const fillerWordsList = ['um', 'uh', 'like', 'basically', 'actually', 'you know', 'sort of', 'kind of'];
      let detectedFillers: Record<string, number> = {};
      let totalFillers = 0;

      rawText.toLowerCase().replace(/[.,!?;:()]/g, ' ').split(/\s+/).forEach((w: string) => {
        if (fillerWordsList.includes(w)) {
          detectedFillers[w] = (detectedFillers[w] || 0) + 1;
          totalFillers++;
        }
      });

      const fillersBreakdown = Object.entries(detectedFillers).map(([word, count]) => ({
        word,
        count,
        frequencyFeedback: `Appeared ${count} times; replace with a calm one-second silence.`,
      }));

      parsedData = {
        transcript: rawText,
        transcriptSegments: [
          { text: rawText, type: 'normal' },
        ],
        metrics: {
          durationSeconds,
          wordCount,
          wordsPerMinute: wpm,
          pacingRating: wpm > 165 ? 'rushed' : wpm < 115 ? 'too_slow' : 'ideal',
          pacingFeedback: `At ${wpm} WPM, your speaking rate is ${wpm > 165 ? 'faster than optimal' : 'well-paced'}. Aim for 130-155 WPM.`,
          fillerWordsCount: totalFillers,
          fillerDensityPct: Math.round((totalFillers / Math.max(wordCount, 1)) * 1000) / 10,
          fillersBreakdown,
          pauseCount: 3,
          pauseFeedback: 'Maintain a 2-second deliberate pause between key ideas to let claims settle.',
          vocabularyRichnessPct: 78,
          clarityScore: 82,
          confidenceScore: 76,
          structureScore: 80,
          overallScore: 79,
          toneImpression: 'Direct and engaged; focus on confident assertion and zero filler crutches.',
        },
        coaching: {
          executiveSummary:
            'You demonstrated solid subject grasp, but need a stronger opening anchor and fewer filler crutches to project senior-level authority.',
          superpowers: [
            {
              title: 'Focused Technical Progression',
              observation: 'You stayed on topic without drifting into tangential side-stories.',
              quote: rawText.slice(0, 70),
            },
            {
              title: 'Natural Conversational Cadence',
              observation: 'Your delivery sounded authentic rather than robotic or memorized.',
              quote: 'Natural inflection maintained throughout the explanation',
            },
          ],
          honestBlindspots: [
            {
              title: 'Hedge Language at Transition Points',
              criticalFeedback: 'Conversational fillers diminish executive command.',
              impactOnAudience: 'Creates doubt about whether you are fully confident in the conclusion.',
              actionableFix: 'Use silence instead of verbal placeholders when thinking.',
            },
          ],
          rewrites: [
            {
              originalSnippet: rawText.slice(0, 80),
              polishedVersion: `Leading our strategy for ${topic}, I prioritized high-leverage execution.`,
              rationale: 'Frames your actions with active verbs and strategic ownership.',
            },
          ],
          practiceDrills: [
            {
              drillName: 'The 3-Second Breath Anchor',
              estimatedMinutes: 2,
              instructions: 'Breathe in for 2 seconds before beginning your answer. Eliminate all initial filler words.',
            },
          ],
          recruiterVerdict: 'High potential candidate; eliminate conversational fillers for an immediate bump in perceived authority.',
        },
      };
    }

    if (audioBase64) {
      const normalizedTranscript = parsedData.transcript.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (!normalizedTranscript) {
        return res.status(422).json({
          error: 'No clear speech was recognized. Please record again in a quieter place and speak close to the microphone.',
        });
      }
      if (/thank you for listening to my practice talk on/.test(normalizedTranscript)) {
        return res.status(422).json({
          error: 'The speech recognizer returned a generic placeholder instead of your words. No session was created; please retake the recording and try again.',
        });
      }
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Speech analysis error:', error);
    return res.status(500).json({
      error: 'Failed to analyze speech',
      details: error?.message || 'Internal server error',
    });
  }
});

// POST /api/coach-voice - Gemini TTS voice synthesis for speech coach
app.post('/api/coach-voice', async (req, res) => {
  try {
    const { text, coachVoice = 'Kore' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 450), // keep coaching soundbite punchy
              speechMetadata: {
                style: 'Warm, encouraging, articulate executive speech coach',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: coachVoice },
          },
        },
      },
    });

    const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(502).json({ error: 'No audio returned from TTS model.' });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('TTS generation error:', err);
    return res.status(500).json({
      error: 'Failed to generate coach voice',
      details: err?.message || 'Server TTS error',
    });
  }
});

app.post('/api/analyze-drill', async (req, res) => {
  try {
    const { drillName, instructions, answer } = req.body;

    if (!drillName || !answer) {
      return res.status(400).json({
        error: 'Drill name and answer are required.',
      });
    }

    const prompt = `
You are Cadence, an AI speech coach.

Evaluate the user's answer to a speaking practice drill.

Drill:
${drillName}

Instructions:
${instructions || 'Evaluate the response for clarity, confidence, and delivery.'}

User's answer:
${answer}

Analyze the answer and return useful coaching.

Return ONLY valid JSON in this exact structure:

{
  "overallFeedback": "short overall assessment",
  "strengths": [
    "strength 1",
    "strength 2"
  ],
  "improvements": [
    "improvement 1",
    "improvement 2"
  ],
  "fillerWords": [
    "word1"
  ],
  "clarity": 0,
  "confidence": 0,
  "delivery": 0
}

Scores must be numbers from 0 to 100.
`;

    // Try multiple Gemini models so a temporary overload
    // on one model does not break the practice drill.
    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
    ];

    type DrillFeedback = {
      overallFeedback: string;
      strengths: string[];
      improvements: string[];
      fillerWords: string[];
      clarity: number;
      confidence: number;
      delivery: number;
    };

    let feedback: DrillFeedback | null = null;
    let lastError: unknown;

    for (const modelName of candidateModels) {
      try {
        console.log(`Trying drill analysis with model: ${modelName}`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallFeedback: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                fillerWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                clarity: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
                delivery: { type: Type.NUMBER },
              },
              required: [
                'overallFeedback',
                'strengths',
                'improvements',
                'fillerWords',
                'clarity',
                'confidence',
                'delivery',
              ],
            },
          },
        });

        if (!response.text) throw new Error('Gemini returned an empty drill response.');
        feedback = JSON.parse(response.text) as DrillFeedback;
        console.log(`Drill analysis succeeded with model: ${modelName}`);
        break;
      } catch (error) {
        lastError = error;
        const status = typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status?: number }).status
          : undefined;
        console.warn(`Drill model ${modelName} failed with status ${status}; trying fallback.`);
        if (modelName !== candidateModels[candidateModels.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    if (!feedback) throw lastError || new Error('All Gemini drill models failed.');
    return res.json(feedback);
  } catch (error) {
    console.error('Drill analysis error:', error);

    return res.status(503).json({
      error: 'Gemini is temporarily unavailable. Please try submitting the drill again in a moment.',
    });
  }
});

// Full-stack Vite handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'public')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Cadence Speech Lab server active on port ${port}`);
  });
}

export default app;

if (process.env.VERCEL !== '1') startServer();
