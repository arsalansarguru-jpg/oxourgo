import 'server-only'

import { logUnknownError } from '@/lib/errors/safe-user-message'

export type OpenAiChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type OpenAiJsonCompletionOptions = {
  messages: OpenAiChatMessage[]
  /** Response must parse as JSON object. */
  temperature?: number
  maxTokens?: number
  model?: string
}

export type OpenAiJsonCompletionResult<T> =
  | { ok: true; data: T; model: string; usage?: { prompt_tokens: number; completion_tokens: number } }
  | { ok: false; code: 'not_configured' | 'api_error' | 'parse_error'; message: string }

export function openAiApiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null
}

export function openAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
}

export function isOpenAiConfigured(): boolean {
  return Boolean(openAiApiKey())
}

export function isWhatsAppAiEnabled(): boolean {
  const flag = process.env.WHATSAPP_AI_ENABLED?.trim()
  if (flag === '0' || flag === 'false') return false
  return isOpenAiConfigured()
}

/**
 * Chat Completions with JSON object response format (OpenAI-compatible HTTP API).
 */
export async function openAiJsonCompletion<T extends Record<string, unknown>>(
  options: OpenAiJsonCompletionOptions,
): Promise<OpenAiJsonCompletionResult<T>> {
  const apiKey = openAiApiKey()
  if (!apiKey) {
    return { ok: false, code: 'not_configured', message: 'OPENAI_API_KEY is not set.' }
  }

  const model = options.model ?? openAiModel()

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 900,
        response_format: { type: 'json_object' },
        messages: options.messages,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      logUnknownError('[openAiJsonCompletion] http', `${res.status} ${errText.slice(0, 400)}`)
      return { ok: false, code: 'api_error', message: `OpenAI HTTP ${res.status}` }
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { prompt_tokens: number; completion_tokens: number }
    }

    const raw = json.choices?.[0]?.message?.content?.trim()
    if (!raw) {
      return { ok: false, code: 'parse_error', message: 'Empty model response.' }
    }

    const data = JSON.parse(raw) as T
    return { ok: true, data, model, usage: json.usage }
  } catch (e) {
    logUnknownError('[openAiJsonCompletion]', e)
    return { ok: false, code: 'api_error', message: e instanceof Error ? e.message : 'OpenAI request failed.' }
  }
}
