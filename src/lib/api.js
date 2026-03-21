/**
 * Unified AI API caller
 * Supports Gemini, OpenAI, Anthropic, custom base URL
 */
export async function callAI({ provider, model, apiKey, baseUrl, systemPrompt, userPrompt, maxTokens = 65536 }) {
  if (!apiKey) throw new Error('請先設定 API Key')

  if (provider === 'gemini') {
    const base = baseUrl || 'https://generativelanguage.googleapis.com'
    const url = `${base}/v1beta/models/${model}:generateContent?key=${apiKey}`
    const body = {
      contents: [{ parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `HTTP ${res.status}`)
    }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  if (provider === 'openai') {
    const base = baseUrl || 'https://api.openai.com'
    const url = `${base}/v1/chat/completions`
    const messages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
      : [{ role: 'user', content: userPrompt }]
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `HTTP ${res.status}`)
    }
    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  }

  if (provider === 'anthropic') {
    const base = baseUrl || 'https://api.anthropic.com'
    const url = `${base}/v1/messages`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `HTTP ${res.status}`)
    }
    const data = await res.json()
    return data.content?.[0]?.text || ''
  }

  throw new Error(`不支援的 API 提供商: ${provider}`)
}

export async function testConnection({ provider, model, apiKey, baseUrl }) {
  const result = await callAI({
    provider, model, apiKey, baseUrl,
    userPrompt: '請回覆「連線成功」三個字',
    maxTokens: 50,
  })
  return result.includes('連線') || result.includes('成功') || result.length > 0
}
