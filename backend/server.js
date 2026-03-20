import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createRequire } from 'module'
import { readFileSync } from 'fs'
import 'dotenv/config'

const require = createRequire(import.meta.url)
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: [
    'https://zanyws.github.io',
    'http://localhost:5173',
    'http://localhost:4173',
  ]
}))
app.use(express.json({ limit: '10mb' }))

// File upload (10MB limit)
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'text/plain']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('不支援的檔案格式'))
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// PDF/Image OCR endpoint
app.post('/api/ocr', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '請上傳檔案' })

    const { mimetype, buffer } = req.file
    let text = ''

    if (mimetype === 'text/plain') {
      text = buffer.toString('utf-8')
    } else if (mimetype === 'application/pdf') {
      // Use pdf-parse for PDF text extraction
      try {
        const pdfParse = require('pdf-parse')
        const data = await pdfParse(buffer)
        text = data.text
      } catch (e) {
        return res.status(500).json({ error: 'PDF解析失敗，請嘗試手動貼上文字' })
      }
    } else {
      // Image — return base64 for frontend AI processing
      const base64 = buffer.toString('base64')
      return res.json({
        type: 'image',
        base64,
        mimeType: mimetype,
        message: '圖片已上傳，請使用 AI 進行 OCR 識別'
      })
    }

    // Clean up text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    res.json({ type: 'text', text, length: text.length })
  } catch (e) {
    console.error('OCR error:', e)
    res.status(500).json({ error: e.message || 'OCR處理失敗' })
  }
})

// Optional: AI proxy (prevents CORS for some providers)
app.post('/api/ai-proxy', async (req, res) => {
  const { provider, endpoint, headers, body } = req.body
  
  // Use server-side key if available, otherwise use client-provided
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || body?.key

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message || '伺服器錯誤' })
})

app.listen(PORT, () => {
  console.log(`🚀 後端服務啟動於 http://localhost:${PORT}`)
})
