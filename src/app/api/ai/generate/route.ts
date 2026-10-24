import { NextRequest, NextResponse } from 'next/server';
import { AiProvider } from '@/types';

interface AiGenerateRequest {
  text?: string;
  documentTitle?: string;
  mode: 'flashcards' | 'summary' | 'expand' | 'explain' | 'qa' | 'test';
  prompt?: string;
  config?: {
    provider?: AiProvider;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
  };
}

// Master System Prompt embedded on the backend so any LLM immediately understands Recallio & its role
const RECALLIO_MASTER_SYSTEM_PROMPT = `You are Recallio's Core AI Knowledge & Flashcard Engine.
Software Context:
Recallio is an advanced hierarchical outliner and active-recall spaced-repetition (SM-2) learning system inspired by RemNote.
Your Role:
Transform notes, documents, and student prompts into structured, high-yield active-recall knowledge artifacts adhering strictly to Recallio's syntax.

Recallio Syntax Rules:
1. Concept Flashcard: "Concept :: Definition"
   - Front is the prompt/cue, back is the concise explanation.
2. Bidirectional Card: "Term ::: Equivalent/Translation"
   - Tested in both directions during review.
3. Cloze Deletion Card: "Sentence with {{hidden key term}} for fill-in-the-blank active recall."
   - Wrap core vocabulary, formulas, numbers, or dates in double braces {{...}}.
4. Document Links: "[[Document Title]]"
5. Tags: "#tag"

Output Rules:
- Return ONLY valid JSON with no markdown backticks, no comments, and no conversational preamble.
`;

// Fast, zero-dependency local NLP heuristics engine for offline / zero-key usage
function generateLocalHeuristicCards(text: string, title?: string): Array<{
  front: string;
  back: string;
  type: 'concept' | 'bidirectional' | 'cloze';
  textFormat: string;
}> {
  const cards: Array<{
    front: string;
    back: string;
    type: 'concept' | 'bidirectional' | 'cloze';
    textFormat: string;
  }> = [];

  const sentences = text
    .split(/(?<=[.?!;])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const defPatterns = [
    /\b([A-Z][a-zA-Z0-9_\s]{2,30}?)\s+(?:is|are|refers to|means|defined as|represents)\s+(.+)/i,
    /\b([a-zA-Z0-9_\s]{2,30}?)\s*:\s*(.+)/,
    /\b([a-zA-Z0-9_\s]{2,30}?)\s*—\s*(.+)/,
  ];

  for (const sentence of sentences) {
    let matched = false;

    for (const pattern of defPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2] && match[2].length > 10) {
        const front = match[1].trim();
        const back = match[2].trim().replace(/[.]+$/, '');
        cards.push({
          front,
          back,
          type: 'concept',
          textFormat: `${front} :: ${back}`,
        });
        matched = true;
        break;
      }
    }

    if (!matched && sentence.length > 25 && sentence.length < 220) {
      const clozeMatch = sentence.match(
        /\b(\d{4}|\d+%(?:age)?|\b[A-Z][a-z]{3,}\b|\b(?:algorithm|database|memory|repetition|ontology|factor|interval|retention|schedule)\b)/
      );
      if (clozeMatch && clozeMatch[0]) {
        const target = clozeMatch[0];
        const withCloze = sentence.replace(target, `{{${target}}}`);
        cards.push({
          front: sentence.replace(target, '[...]'),
          back: target,
          type: 'cloze',
          textFormat: withCloze,
        });
      }
    }
  }

  if (cards.length === 0 && text.trim().length > 0) {
    const mainTitle = title || 'Core Concept';
    cards.push({
      front: mainTitle,
      back: text.slice(0, 150).trim(),
      type: 'concept',
      textFormat: `${mainTitle} :: ${text.slice(0, 150).trim()}`,
    });
  }

  return cards;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AiGenerateRequest;
    const { text = '', documentTitle = '', mode = 'flashcards', prompt = '', config } = body;

    const provider: AiProvider = config?.provider || (process.env.GEMINI_API_KEY ? 'gemini' : 'builtin');
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
    let model = config?.model || (provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash');
    const baseUrl = config?.baseUrl || '';

    // Auto-alias deprecated models to recommended current versions
    if (provider === 'gemini') {
      if (model.includes('gemini-2.0') || model === 'gemini-2.0-flash') {
        model = 'gemini-3.8-flash';
      }
    }

    // SSRF protection: block private/internal addresses in baseUrl
    if (baseUrl) {
      try {
        const parsedUrl = new URL(baseUrl);
        const host = parsedUrl.hostname.toLowerCase();
        if (
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host === '::1' ||
          host.startsWith('10.') ||
          host.startsWith('192.168.') ||
          host.startsWith('172.16.') ||
          host.startsWith('172.17.') ||
          host.startsWith('172.18.') ||
          host.startsWith('172.19.') ||
          host.startsWith('172.20.') ||
          host.startsWith('172.21.') ||
          host.startsWith('172.22.') ||
          host.startsWith('172.23.') ||
          host.startsWith('172.24.') ||
          host.startsWith('172.25.') ||
          host.startsWith('172.26.') ||
          host.startsWith('172.27.') ||
          host.startsWith('172.28.') ||
          host.startsWith('172.29.') ||
          host.startsWith('172.30.') ||
          host.startsWith('172.31.') ||
          host === '169.254.169.254'
        ) {
          return NextResponse.json({ error: 'Private or local IP endpoints are blocked for security.' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid custom base URL format.' }, { status: 400 });
      }
    }

    // Quick connection test mode for Settings BYOK verification
    if (mode === 'test') {
      if (provider === 'builtin') {
        return NextResponse.json({
          success: true,
          provider: 'builtin',
          message: 'Connected to Recallio Built-in NLP Engine (Offline, Zero-Cost)',
        });
      }
      if (!apiKey && provider !== 'custom') {
        return NextResponse.json(
          { error: `API Key for ${provider.toUpperCase()} is required.` },
          { status: 400 }
        );
      }
    }

    // Task-specific instructions
    const modeInstructions: Record<string, string> = {
      flashcards: `Task: Analyze the provided notes and extract high-yield active-recall flashcards.
Output strictly as a JSON object:
{
  "cards": [
    {
      "front": "Question or Concept prompt",
      "back": "Answer or Explanation",
      "type": "concept" | "bidirectional" | "cloze",
      "textFormat": "Concept :: Definition" or "Sentence with {{cloze}}"
    }
  ]
}`,
      summary: `Task: Create an executive summary and a list of key bullet points from the document.
Output strictly as a JSON object:
{
  "summary": "Executive summary paragraph...",
  "bullets": [
    "Key concept 1",
    "Key concept 2"
  ]
}`,
      expand: `Task: Elaborate on this concept with concrete real-world examples, intuitive analogies, and a memory mnemonic.
Output strictly as a JSON object:
{
  "expanded": "Detailed explanation...",
  "bullets": [
    "Example: ...",
    "Analogy: ...",
    "Mnemonic: ..."
  ]
}`,
      explain: `Task: Explain this concept simply (ELI5) with an intuitive analogy.
Output strictly as a JSON object:
{
  "explanation": "Simple explanation...",
  "analogy": "Analogy...",
  "mnemonic": "Memory trick..."
}`,
      qa: `Task: Answer the student's question about the notes accurately and concisely.
Output strictly as a JSON object:
{
  "answer": "Clear explanation..."
}`,
      test: `Task: Confirm connection. Output strictly as JSON: { "status": "ok", "message": "Connection verified" }`,
    };

    const taskInstruction = modeInstructions[mode] || modeInstructions.flashcards;
    const userPrompt = `Document Title: "${documentTitle}"\nContent:\n${text}\n\nUser Question/Note Context: ${prompt || mode}`;

    // -------------------------------------------------------------------------
    // 1. Google Gemini Provider
    // -------------------------------------------------------------------------
    if (provider === 'gemini' && apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${RECALLIO_MASTER_SYSTEM_PROMPT}\n\n${taskInstruction}` },
                    { text: userPrompt },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1500,
              },
            }),
          }
        );

        let responseToUse = geminiRes;
        if (!responseToUse.ok && model !== 'gemini-1.5-flash') {
          // Automatic graceful retry with standard gemini-1.5-flash fallback
          const fallbackRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: `${RECALLIO_MASTER_SYSTEM_PROMPT}\n\n${taskInstruction}` },
                      { text: userPrompt },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 1500,
                },
              }),
            }
          );
          if (fallbackRes.ok) {
            responseToUse = fallbackRes;
            model = 'gemini-1.5-flash';
          }
        }

        if (responseToUse.ok) {
          const geminiData = await responseToUse.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          const cleanedJson = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
          const parsed = JSON.parse(cleanedJson);
          return NextResponse.json({ success: true, provider: 'gemini', model, data: parsed });
        } else {
          const errData = await responseToUse.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Gemini API returned ${responseToUse.status}`);
        }
      } catch (geminiErr: any) {
        if (mode === 'test') {
          return NextResponse.json({ error: geminiErr.message }, { status: 400 });
        }
        console.warn('Gemini API call failed, falling back to local NLP heuristics:', geminiErr);
      }
    }

    // -------------------------------------------------------------------------
    // 2. OpenAI / OpenAI-Compatible (Groq, OpenRouter, Ollama, Local)
    // -------------------------------------------------------------------------
    if ((provider === 'openai' || provider === 'custom') && (apiKey || baseUrl)) {
      try {
        const apiEndpoint = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const openAiRes = await fetch(apiEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `${RECALLIO_MASTER_SYSTEM_PROMPT}\n\n${taskInstruction}` },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          }),
        });

        if (openAiRes.ok) {
          const data = await openAiRes.json();
          const rawContent = data.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(rawContent);
          return NextResponse.json({ success: true, provider, model, data: parsed });
        } else {
          const errData = await openAiRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `OpenAI API returned ${openAiRes.status}`);
        }
      } catch (openAiErr: any) {
        if (mode === 'test') {
          return NextResponse.json({ error: openAiErr.message }, { status: 400 });
        }
        console.warn('OpenAI/Custom API call failed, falling back to local heuristics:', openAiErr);
      }
    }

    // -------------------------------------------------------------------------
    // 3. Anthropic Claude Provider
    // -------------------------------------------------------------------------
    if (provider === 'anthropic' && apiKey) {
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: model || 'claude-3-5-sonnet-20241022',
            max_tokens: 1500,
            system: `${RECALLIO_MASTER_SYSTEM_PROMPT}\n\n${taskInstruction}`,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });

        if (claudeRes.ok) {
          const data = await claudeRes.json();
          const rawContent = data.content?.[0]?.text || '{}';
          const cleanedJson = rawContent.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
          const parsed = JSON.parse(cleanedJson);
          return NextResponse.json({ success: true, provider: 'anthropic', model, data: parsed });
        } else {
          const errData = await claudeRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Anthropic API returned ${claudeRes.status}`);
        }
      } catch (claudeErr: any) {
        if (mode === 'test') {
          return NextResponse.json({ error: claudeErr.message }, { status: 400 });
        }
        console.warn('Anthropic API call failed, falling back to local heuristics:', claudeErr);
      }
    }

    // -------------------------------------------------------------------------
    // 4. Built-in Local NLP Heuristics Fallback (Zero-Cost & Offline)
    // -------------------------------------------------------------------------
    if (mode === 'test') {
      return NextResponse.json({
        success: true,
        provider: 'builtin',
        message: 'Connected to Recallio Built-in NLP Engine',
      });
    }

    if (mode === 'flashcards') {
      const cards = generateLocalHeuristicCards(text, documentTitle);
      return NextResponse.json({
        success: true,
        provider: 'builtin',
        data: { cards },
      });
    }

    if (mode === 'summary') {
      const lines = text
        .split('\n')
        .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
        .filter((l) => l.length > 5);

      const bullets = lines.slice(0, 5).map((l) => l.split('::')[0].trim());
      const summary = `Overview of ${documentTitle || 'document'}: Contains ${lines.length} key concepts focusing on ${bullets.slice(0, 3).join(', ')}.`;

      return NextResponse.json({
        success: true,
        provider: 'builtin',
        data: {
          summary,
          bullets: bullets.length > 0 ? bullets : ['Key point: ' + text.slice(0, 60)],
        },
      });
    }

    if (mode === 'expand') {
      const topic = documentTitle || text.split('::')[0].trim() || 'This concept';
      return NextResponse.json({
        success: true,
        provider: 'builtin',
        data: {
          expanded: `Detailed breakdown of ${topic}: In active recall and outliner hierarchies, this forms a core anchor.`,
          bullets: [
            `Concrete Example: Practical application in daily workflows or system modeling.`,
            `Analogy: Think of ${topic} like an index in a database or a mental milestone.`,
            `Mnemonic Device: Associate with key trigger words or the first letters of related sub-concepts.`,
          ],
        },
      });
    }

    if (mode === 'explain') {
      const topic = documentTitle || text.split('::')[0].trim() || 'Concept';
      return NextResponse.json({
        success: true,
        provider: 'builtin',
        data: {
          explanation: `${topic} is fundamentally structured to optimize retention and understanding when reviewed spaced over time.`,
          analogy: `Like building muscle through progressive overload, reviewing ${topic} at calibrated intervals solidifies long-term neural connections.`,
          mnemonic: `Remember: Identify Front (Cue) -> Recall Back (Retrieval) -> Self-Grade.`,
        },
      });
    }

    // Default QA
    return NextResponse.json({
      success: true,
      provider: 'builtin',
      data: {
        answer: `Based on your notes in "${documentTitle || 'Recallio'}":\n\n${text.slice(0, 300)}...`,
      },
    });
  } catch (err: unknown) {
    console.error('AI route error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI generation error' },
      { status: 500 }
    );
  }
}
