export class AIProvider {
  async generate() {
    throw new Error('AIProvider no implementado');
  }
}

export class OpenAICompatibleProvider extends AIProvider {
  constructor({ apiKey, baseUrl, model }) {
    super();
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
    this.model = model || 'gpt-4o-mini';
  }

  async generate(messages) {
    const result = await this.complete(messages);
    return result.message?.content?.trim() || '';
  }

  async generateWithTools(messages, tools) {
    const result = await this.complete(messages, tools);
    return result.message || { role: 'assistant', content: '' };
  }

  async complete(messages, tools) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS || 30000)),
      body: JSON.stringify({ model: this.model, temperature: 0.1, messages, ...(tools ? { tools, tool_choice: 'auto' } : {}) }),
    });
    if (!response.ok) throw new Error(`Proveedor IA respondió ${response.status}`);
    const data = await response.json();
    const message = data.choices?.[0]?.message;
    return { message, raw: data };
  }
}

export function createAIProvider(env = process.env) {
  const baseUrl = env.AI_BASE_URL || env.LLM_BASE_URL || '';
  const local = env.LLM_PROVIDER === 'ollama' || /localhost|127\.0\.0\.1/.test(baseUrl);
  const apiKey = env.AI_API_KEY || env.LLM_API_KEY || (local ? 'local' : '');
  if (!apiKey) return null;
  return new OpenAICompatibleProvider({ apiKey, baseUrl: baseUrl || (local ? 'http://127.0.0.1:11434/v1' : undefined), model: env.AI_MODEL || env.LLM_MODEL || (local ? 'llama3.2' : undefined) });
}
