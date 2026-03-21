/**
 * PDF/Image text extraction
 * Strategy:
 * 1. PDF → convert to base64, send to Gemini Vision API for OCR
 * 2. Image → convert to base64, send to Gemini Vision API for OCR
 * 3. TXT → read directly
 * No external dependencies required
 */

export async function extractTextFromPDF(file, aiConfig) {
  // Convert PDF to base64
  const base64 = await fileToBase64(file)
  const base64Data = base64.split(',')[1]

  if (!aiConfig?.apiKey) {
    throw new Error('請先設定 API Key 才能提取 PDF 內容')
  }

  // Use Gemini Vision to read PDF
  if (aiConfig.provider === 'gemini' || !aiConfig.provider) {
    return await geminiOCR(base64Data, 'application/pdf', aiConfig)
  }

  // For non-Gemini providers, we can't do PDF OCR directly
  throw new Error('PDF 自動提取只支援 Gemini 模型，請手動貼上原文')
}

export async function extractTextFromImage(file, aiConfig) {
  const base64 = await fileToBase64(file)
  const base64Data = base64.split(',')[1]
  const mimeType = file.type

  if (!aiConfig?.apiKey) {
    throw new Error('請先設定 API Key 才能識別圖片')
  }

  if (aiConfig.provider === 'gemini' || !aiConfig.provider) {
    return await geminiOCR(base64Data, mimeType, aiConfig)
  }

  throw new Error('圖片識別只支援 Gemini 模型，請手動貼上原文')
}

async function geminiOCR(base64Data, mimeType, aiConfig) {
  const base = aiConfig.baseUrl || 'https://generativelanguage.googleapis.com'
  const url = `${base}/v1beta/models/${aiConfig.model}:generateContent?key=${aiConfig.apiKey}`

  const prompt = `請完整提取以下文件中的所有文字內容。
要求：
1. 保持原有段落分隔
2. 只輸出文字內容，不加任何說明或標籤
3. 繁體中文輸出
4. 若有標題，保留標題
5. 按原文順序輸出`

  const body = {
    contents: [{
      parts: [
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        },
        { text: prompt }
      ]
    }],
    generationConfig: {
      maxOutputTokens: 8000,
      temperature: 0.1
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API 錯誤 ${res.status}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  if (!text) throw new Error('未能提取文字，請手動貼上原文')
  return text.trim()
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('檔案讀取失敗'))
    reader.readAsDataURL(file)
  })
}
