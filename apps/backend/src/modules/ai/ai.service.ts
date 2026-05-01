import {
  normalizeAppConfig,
  type AppConfig,
  type NormalizeIssue,
} from '@ai-gen/shared';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * System prompt describing the AppConfig shape. Kept tight on purpose —
 * the LLM only needs the *grammar*; our `normalizeAppConfig` is the source
 * of truth and will gracefully drop anything invalid.
 */
const SYSTEM_PROMPT = `
You generate JSON AppConfig objects for a config-driven internal-app runtime.
Respond with ONE JSON object only. No prose, no markdown fences, no comments.

Shape (all keys optional unless noted):
{
  "id": "<kebab-slug, REQUIRED>",
  "name": "<human title, REQUIRED>",
  "description": "<one-sentence summary>",
  "entities": [
    {
      "key": "<kebab-slug>",
      "name": "<Singular Title>",
      "displayField": "<one of this entity's field keys>",
      "fields": [
        { "type": "string"|"text"|"email"|"url", "key": "...", "label": "...", "required": true|false },
        { "type": "number", "key": "...", "label": "...", "min": 0, "max": 100, "defaultValue": 0 },
        { "type": "boolean", "key": "...", "label": "...", "defaultValue": false },
        { "type": "date"|"datetime", "key": "...", "label": "..." },
        { "type": "select"|"multiselect", "key": "...", "label": "...",
          "options": [ { "value": "todo", "label": "To do" } ],
          "defaultValue": "todo" },
        { "type": "relation", "key": "...", "label": "...",
          "entity": "<another-entity-key>", "cardinality": "one"|"many" },
        { "type": "json", "key": "meta", "label": "Metadata" }
      ]
    }
  ],
  "pages": [
    {
      "key": "...", "type": "dashboard", "title": "...",
      "widgets": [
        { "key": "...", "type": "metric", "title": "...", "entity": "<entity-key>",
          "aggregate": "count"|"sum"|"avg"|"min"|"max", "field": "<numeric-field-key?>", "span": 1..12 },
        { "key": "...", "type": "list", "title": "...", "entity": "<entity-key>",
          "limit": 1..100, "sort": "newest"|"oldest", "span": 1..12 },
        { "key": "...", "type": "chart", "title": "...", "entity": "<entity-key>",
          "chartType": "bar"|"line"|"pie"|"area", "xField": "...", "yField": "...", "span": 1..12 },
        { "key": "...", "type": "markdown", "title": "...", "content": "# md", "span": 1..12 }
      ]
    },
    { "key": "...", "type": "form",  "title": "...", "entity": "<entity-key>", "submitLabel": "Create", "layout": "grid"|"vertical"|"horizontal" },
    { "key": "...", "type": "table", "title": "...", "entity": "<entity-key>",
      "columns": [ { "field": "<field-key>" } ], "pageSize": 25 }
  ]
}

Rules:
- All "key" values are lowercase, kebab-case, unique within their list.
- Every page's "entity" MUST reference an entity key you define above.
- Every table column "field" and widget "field"/"xField"/"yField" MUST reference
  a field key on the referenced entity.
- Prefer 1-2 entities, 1 dashboard, 1 form per entity, 1 table per entity.
- Dashboard widget spans should add up to around 12 per row.
- Output ONLY the JSON object. No explanations.
`.trim();

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

function extractJson(raw: string): unknown {
  // Strip common wrappers the model might still emit (```json ... ``` fences).
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  }
  // Take from first { to last } — robust against stray leading/trailing text.
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw HttpError.badRequest('AI did not return a JSON object');
  }
  const slice = text.slice(first, last + 1);
  try {
    return JSON.parse(slice) as unknown;
  } catch (err) {
    throw HttpError.badRequest(
      'AI returned malformed JSON',
      err instanceof Error ? err.message : String(err),
    );
  }
}

export interface GenerateConfigResult {
  config: AppConfig;
  issues: NormalizeIssue[];
  /** Raw model output, useful for debugging on the client if desired. */
  modelUsed: string;
}

export const aiService = {
  /**
   * Generate + normalize an AppConfig from a natural-language prompt.
   * Throws HttpError with status 503 if Gemini isn't configured.
   */
  async generateConfig(
    prompt: string,
    hints: { slug?: string; name?: string } = {},
  ): Promise<GenerateConfigResult> {
    if (!env.GEMINI_API_KEY) {
      throw new HttpError(
        503,
        'AI_DISABLED',
        'AI generation is disabled: GEMINI_API_KEY is not set on the server.',
      );
    }

    const hintParts: string[] = [];
    if (hints.slug) hintParts.push(`Use "${hints.slug}" as the top-level "id".`);
    if (hints.name) hintParts.push(`Use "${hints.name}" as the top-level "name".`);
    const hintBlock = hintParts.length ? `\n\nUser hints:\n- ${hintParts.join('\n- ')}` : '';

    const body = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT + hintBlock }],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Generate an AppConfig JSON for the following request:\n\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        responseMimeType: 'application/json',
        maxOutputTokens: 4096,
      },
    };

    const url = `${GEMINI_ENDPOINT}/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new HttpError(
        502,
        'AI_UPSTREAM_ERROR',
        'Could not reach the Gemini API.',
        err instanceof Error ? err.message : String(err),
      );
    }

    const payload = (await res.json().catch(() => null)) as GeminiResponse | null;

    if (!res.ok || !payload) {
      throw new HttpError(
        res.status === 400 || res.status === 401 || res.status === 403 ? 502 : 502,
        'AI_UPSTREAM_ERROR',
        payload?.error?.message ?? `Gemini request failed (${res.status})`,
        payload?.error,
      );
    }

    const blocked = payload.promptFeedback?.blockReason;
    if (blocked) {
      throw HttpError.badRequest(
        `Your prompt was blocked by the model safety filter (${blocked}). Try rephrasing.`,
      );
    }

    const text = payload.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('')
      .trim();

    if (!text) {
      throw new HttpError(
        502,
        'AI_EMPTY_RESPONSE',
        'The model returned an empty response. Try again, or be more specific.',
      );
    }

    const raw = extractJson(text);
    const { config, issues } = normalizeAppConfig(raw);

    return { config, issues, modelUsed: env.GEMINI_MODEL };
  },
};
