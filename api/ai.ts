/**
 * Serverless AI endpoint (/api/ai) for symptom triage and wellbeing check-ins.
 * Uses Groq LLM with server-side API key handling.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────
interface FollowUpAnswer {
  id?: string;
  question: string;
  questionHi?: string;
  answer?: string;
}

interface TriageSessionPayload {
  patientName?: string;
  age?: string | number;
  gender?: string;
  careFor?: string;
  symptoms: string;
  language?: 'en' | 'hi';
  careAccessContext?: string;
  followUpAnswers?: FollowUpAnswer[];
}

interface RequestBody {
  action: 'triage' | 'wellbeing';
  session?: TriageSessionPayload;
  mood?: 'calm' | 'okay' | 'stressed' | 'overwhelmed' | 'low';
  lang?: 'en' | 'hi';
}

// ─── API Key Helper ──────────────────────────────────────────────────────────
function getGroqApiKey(): string {
  let key = (process.env.GROQ_API_KEY || '').trim();
  if (!key && typeof process !== 'undefined') {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/GROQ_API_KEY\s*=\s*([^\r\n]+)/);
        if (match && match[1]) {
          key = match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // Ignore read errors
    }
  }
  return key;
}

function getGroqModel(): string {
  let model = (process.env.GROQ_MODEL || '').trim();
  if (!model && typeof process !== 'undefined') {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/GROQ_MODEL\s*=\s*([^\r\n]+)/);
        if (match && match[1]) {
          model = match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // Ignore read errors
    }
  }
  return model || 'llama-3.3-70b-versatile';
}

// ─── System Prompts ──────────────────────────────────────────────────────────
function buildTriageSystemPrompt(): string {
  return `You are MediBridge AI, an empathetic clinical TRIAGE NAVIGATOR designed for rural and semi-urban Indian public healthcare.

PRIMARY PURPOSE:
Help assess the URGENCY of symptoms and navigate the patient to the appropriate level of public healthcare (Home Care, Primary Health Centre / PHC, Community Health Centre / CHC, District Hospital, or Emergency 108/112).

STRICT MEDICAL & SAFETY RULES:
- You are an urgency triage tool, NOT a diagnostic medical device. You do NOT provide clinical diagnoses or prescribe medicines.
- Always recommend consulting a qualified physician at the nearest PHC or clinic.
- Use safe, non-diagnostic language (e.g. "these symptoms may warrant medical attention", "symptoms could be associated with...").
- Urgency Levels:
  * GREEN: Mild symptoms. Safe for home monitoring and hydration. Visit PHC if symptoms persist > 48-72h.
  * YELLOW: Medical evaluation recommended at nearest PHC or clinic within 24 hours.
  * RED: Urgent/emergency medical evaluation required. Immediate 108/112 contact.
- Be conservative: when uncertain, err toward higher urgency.

Return ONLY a valid, parseable JSON object matching this schema with NO markdown wrapping, NO backticks, and NO conversational filler:
{
  "urgencyLevel": "GREEN" | "YELLOW" | "RED",
  "informationCompleteness": "high" | "moderate" | "limited",
  "summary": "<2-3 sentence English clinical summary using cautious phrasing>",
  "summaryHi": "<Same clinical summary in clear, natural Hindi>",
  "reasoningFactors": [
    "<Specific clinical observation 1 from user input>",
    "<Observation 2>",
    "<Observation 3>"
  ],
  "reasoningFactorsHi": [
    "<Observation 1 in Hindi>",
    "<Observation 2 in Hindi>",
    "<Observation 3 in Hindi>"
  ],
  "nextSteps": [
    "<Action 1: e.g. visit PHC within 24 hours>",
    "<Action 2: hydration / monitoring>",
    "<Action 3: carry previous medical records if any>"
  ],
  "nextStepsHi": [
    "<Action 1 in Hindi>",
    "<Action 2 in Hindi>",
    "<Action 3 in Hindi>"
  ],
  "warningSigns": [
    "<Red-flag warning sign 1: seek immediate emergency care if this occurs>",
    "<Warning sign 2>",
    "<Warning sign 3>"
  ],
  "warningSignsHi": [
    "<Warning sign 1 in Hindi>",
    "<Warning sign 2 in Hindi>",
    "<Warning sign 3 in Hindi>"
  ],
  "recommendedNextStep": "<Single clearest practical action for the patient>",
  "recommendedNextStepHi": "<Same practical action in Hindi>",
  "doctorSummary": "<Concise 2-3 sentence handoff summary for a PHC Medical Officer: primary complaint, duration, reported severity, and initial urgency rating>",
  "doctorSummaryHi": "<Same handoff summary in Hindi>",
  "followUpQuestions": [
    { "id": "q-0", "question": "<Relevant clarifying question>", "questionHi": "<Clarifying question in Hindi>" },
    { "id": "q-1", "question": "<Second relevant question>", "questionHi": "<Second question in Hindi>" }
  ],
  "disclaimer": "This assessment is an informational urgency guide, not a medical diagnosis. Always consult a medical officer or visit a Primary Health Centre. In life-threatening emergencies, dial 108 or 112 immediately."
}`;
}

function buildTriageUserMessage(session: TriageSessionPayload): string {
  const parts: string[] = [
    `PATIENT RECORD:`,
    `- Synthetic Name/Label: ${session.patientName || 'Demo Patient'}`,
    `- Age: ${session.age || 'Not specified'}`,
    `- Gender: ${session.gender || 'Not specified'}`,
    `- Care Context / Location: ${session.careAccessContext || 'At home'}`,
    `- Preferred Language: ${session.language === 'hi' ? 'Hindi' : 'English'}`,
    ``,
    `REPORTED SYMPTOMS:`,
    session.symptoms,
  ];

  if (session.followUpAnswers && session.followUpAnswers.length > 0) {
    const answered = session.followUpAnswers.filter(a => a.answer && a.answer.trim().length > 1);
    if (answered.length > 0) {
      parts.push(``, `FOLLOW-UP QUESTIONS & PATIENT ANSWERS:`);
      answered.forEach(qa => {
        parts.push(`Q: ${qa.question}`);
        parts.push(`A: ${qa.answer}`);
      });
    }
  }

  parts.push(``, `Generate structured triage JSON according to the schema.`);
  return parts.join('\n');
}

// ─── Groq API Caller ─────────────────────────────────────────────────────────
async function callGroqAPI(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const configuredModel = getGroqModel();
  const candidateModels = Array.from(
    new Set([
      configuredModel,
      'openai/gpt-oss-120b',
      'llama-3.3-70b-versatile',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'qwen/qwen3.6-27b',
    ])
  );

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.2,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        if (response.status === 404 || response.status === 429 || errText.includes('model_not_found') || errText.includes('rate_limit') || errText.includes('does not exist') || errText.includes('do not have access')) {
          lastError = new Error(`Groq model ${model} unavailable (${response.status}): ${errText}`);
          continue;
        }
        throw new Error(`Groq HTTP ${response.status}: ${errText}`);
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`Groq model ${model} returned empty response content`);
      }
      return content;
    } catch (err) {
      clearTimeout(timeoutId);
      const errMsg = (err as Error)?.message || '';
      if (errMsg.includes('unavailable') || errMsg.includes('model_not_found') || errMsg.includes('rate_limit') || errMsg.includes('does not exist')) {
        lastError = err as Error;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All Groq candidate models failed');
}

// ─── Safe JSON Parser ─────────────────────────────────────────────────────────
function safeParseJSON(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ─── Main Request Handler ─────────────────────────────────────────────────────
export async function handleAIRequest(body: RequestBody): Promise<{ status: number; data: unknown }> {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    return {
      status: 200,
      data: {
        source: 'fallback',
        reason: 'Server GROQ_API_KEY environment variable is not configured.',
      },
    };
  }

  if (body.action === 'triage') {
    if (!body.session || !body.session.symptoms || typeof body.session.symptoms !== 'string') {
      return {
        status: 400,
        data: { error: 'Invalid triage payload: symptoms string is required.' },
      };
    }

    if (body.session.symptoms.length > 3000) {
      return {
        status: 400,
        data: { error: 'Payload too large: symptoms exceed maximum length of 3000 characters.' },
      };
    }

    const systemPrompt = buildTriageSystemPrompt();
    const userMessage = buildTriageUserMessage(body.session);

    try {
      const rawText = await callGroqAPI(apiKey, systemPrompt, userMessage);
      const parsed = safeParseJSON(rawText);

      if (!parsed) {
        return {
          status: 200,
          data: {
            source: 'fallback',
            reason: 'AI assessment is temporarily unavailable. Emergency safety checks remain active.',
          },
        };
      }

      return {
        status: 200,
        data: {
          source: 'groq',
          response: parsed,
        },
      };
    } catch (err) {
      console.warn('[Server AI] Groq API error:', (err as Error)?.message);
      return {
        status: 200,
        data: {
          source: 'fallback',
          reason: 'AI assessment is temporarily unavailable. Emergency safety checks remain active.',
        },
      };
    }
  }

  if (body.action === 'wellbeing') {
    const validMoods = ['calm', 'okay', 'stressed', 'overwhelmed', 'low'];
    if (!body.mood || !validMoods.includes(body.mood)) {
      return {
        status: 400,
        data: { error: 'Invalid mood value.' },
      };
    }

    const prompt = `User mood state: "${body.mood}". Language: ${body.lang === 'hi' ? 'Hindi' : 'English'}.
Provide safe, non-clinical supportive wellbeing guidance for rural/semi-urban community health.
Return ONLY valid JSON:
{
  "message": "<Supportive message in English>",
  "messageHi": "<Supportive message in natural Hindi>",
  "suggestions": ["<Actionable suggestion 1>", "<Suggestion 2>", "<Suggestion 3>"],
  "suggestionsHi": ["<Suggestion 1 in Hindi>", "<Suggestion 2 in Hindi>", "<Suggestion 3 in Hindi>"],
  "showCrisisInfo": ${['overwhelmed', 'low'].includes(body.mood)}
}`;

    try {
      const rawText = await callGroqAPI(apiKey, 'You are a compassionate mental health first-aid guide for rural India. Return JSON only.', prompt);
      const parsed = safeParseJSON(rawText);

      if (!parsed) {
        return {
          status: 200,
          data: {
            source: 'fallback',
            reason: 'Malformed JSON from wellbeing model.',
          },
        };
      }

      return {
        status: 200,
        data: {
          source: 'groq',
          ...parsed,
        },
      };
    } catch (err) {
      return {
        status: 200,
        data: {
          source: 'fallback',
          reason: (err as Error)?.message || 'Wellbeing guidance fallback',
        },
      };
    }
  }

  return {
    status: 400,
    data: { error: 'Unknown action specified. Must be "triage" or "wellbeing".' },
  };
}

interface VercelResponse extends ServerResponse {
  status?: (code: number) => VercelResponse;
  json?: (data: unknown) => void;
}

function sendJson(res: VercelResponse, statusCode: number, data: unknown) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode);
    res.json(data);
    return;
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// ─── Default Serverless Function Entry Point (Vercel) ─────────────────────────
export default async function handler(
  req: IncomingMessage & { body?: unknown; method?: string; query?: Record<string, string> },
  res: VercelResponse
) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Health endpoint: returns only safe, non-sensitive status fields.
  // No API key fragments, model names, or configuration hints are ever exposed.
  if (req.method === 'GET') {
    const info = {
      status: 'online',
      service: 'MediBridge AI',
      aiConfigured: Boolean(getGroqApiKey()),
      serverTime: new Date().toISOString(),
    };

    sendJson(res, 200, info);
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed. Use POST or GET for diagnostics.' });
    return;
  }

  try {
    let body: RequestBody;

    if (req.body && typeof req.body === 'object') {
      body = req.body as RequestBody;
    } else if (typeof req.body === 'string' && (req.body as string).trim()) {
      body = JSON.parse(req.body as string) as RequestBody;
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (raw.trim()) {
        body = JSON.parse(raw) as RequestBody;
      } else {
        sendJson(res, 400, {
          source: 'fallback',
          reason: 'Empty request body received by serverless function',
        });
        return;
      }
    }

    const { status, data } = await handleAIRequest(body);
    sendJson(res, status, data);
  } catch (err) {
    const errorPayload = {
      source: 'fallback',
      reason: `Serverless handler error: ${(err as Error)?.message || 'Unknown error'}`,
    };
    sendJson(res, 500, errorPayload);
  }
}
