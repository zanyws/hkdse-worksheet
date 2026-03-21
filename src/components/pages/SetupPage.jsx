import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { testConnection } from '../../lib/api'
import { callAI } from '../../lib/api'
import { extractTextFromPDF, extractTextFromImage } from '../../lib/pdfReader'
import { parseAIJson } from '../../lib/parseJSON'
import { SYSTEM_PROMPT } from '../../lib/prompts'
import {
  Settings, Key, Cpu, Link, Eye, EyeOff,
  Upload, FileText, CheckCircle, AlertCircle,
  ChevronRight, Zap, Wifi, BookOpen
} from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

const PROVIDERS = [
  { value: 'gemini',    label: 'Google Gemini', defaultModel: 'gemini-2.5-flash' },
  { value: 'openai',    label: 'OpenAI',        defaultModel: 'gpt-4o' },
  { value: 'anthropic', label: 'Anthropic',     defaultModel: 'claude-opus-4-6' },
]

export default function SetupPage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const { aiConfig, textConfig } = state

  function updateAI(field, value) {
    dispatch({ type: 'SET_AI_CONFIG', payload: { [field]: value } })
  }

  function updateText(field, value) {
    dispatch({ type: 'SET_TEXT_CONFIG', payload: { [field]: value } })
  }

  function handleProviderChange(provider) {
    const found = PROVIDERS.find(p => p.value === provider)
    dispatch({ type: 'SET_AI_CONFIG', payload: { provider, model: found?.defaultModel || '' } })
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      await testConnection(aiConfig)
      setTestResult({ ok: true, msg: '連線成功！API Key 有效。' })
    } catch (e) {
      setTestResult({ ok: false, msg: `連線失敗：${e.message}` })
    } finally {
      setTesting(false)
    }
  }

  function handleFileDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0]
    if (file) processFile(file)
  }

  async function processFile(file) {
    setUploadedFile(file)

    if (file.type === 'text/plain') {
      const text = await file.text()
      updateText('content', text)
      updateText('ocrSource', 'manual')
      return
    }

    if (file.type === 'application/pdf') {
      updateText('ocrSource', 'pdf')
      try {
        const text = await extractTextFromPDF(file)
        if (text && text.length > 20) {
          updateText('content', text)
        } else {
          alert('未能從PDF提取文字（可能是掃描版PDF）\n請手動貼上原文，或點擊「AI智能提取」讓AI協助識別。')
        }
      } catch (e) {
        alert('PDF讀取失敗：' + e.message + '\n請手動貼上原文。')
      }
      return
    }

    // Image files: store as base64 for AI OCR via vision
    if (file.type.startsWith('image/')) {
      updateText('ocrSource', 'image')
      try {
        const base64 = await extractTextFromImage(file)
        // Store base64 temporarily, use AI to extract text
        updateText('_imageBase64', base64)
        alert('圖片已上傳，請點擊「AI智能提取篇章信息」讓AI識別圖片內容。')
      } catch (e) {
        alert('圖片讀取失敗，請手動貼上原文。')
      }
    }
  }

  async function extractWithAI() {
    if (!textConfig.content && !uploadedFile) {
      alert('請先貼上原文或上傳文件')
      return
    }
    if (!aiConfig.apiKey) {
      alert('請先設定 API Key')
      return
    }
    setExtracting(true)
    try {
      const EXTRACT_SYSTEM = '你是一位中文科老師，請從文章中提取基本信息。只輸出純JSON，所有值均為純文字，絕對不可加任何HTML標籤或teacher-answer標籤。'

      // Build messages - support image OCR if image was uploaded
      let result
      if (textConfig._imageBase64) {
        // Use vision API for image OCR
        const imagePrompt = `請識別這張圖片中的文字，提取篇章基本信息。

【重要】只輸出以下JSON，所有值必須是純文字：
{
  "title": "篇章題目",
  "author": "作者姓名",
  "dynasty": "朝代或時代",
  "content": "完整原文（保持原有分段）",
  "analysis": "篇章主要內容摘要（3至5句）"
}`
        // For Gemini vision, include image in prompt
        if (aiConfig.provider === 'gemini') {
          const base64Data = textConfig._imageBase64.split(',')[1]
          const mimeType = textConfig._imageBase64.split(';')[0].split(':')[1]
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent?key=${aiConfig.apiKey}`
          const body = {
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: base64Data } },
                { text: imagePrompt }
              ]
            }],
            generationConfig: { maxOutputTokens: 4000, temperature: 0.3 }
          }
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          const data2 = await res.json()
          result = data2.candidates?.[0]?.content?.parts?.[0]?.text || ''
        } else {
          result = await callAI({ ...aiConfig, systemPrompt: EXTRACT_SYSTEM, userPrompt: imagePrompt })
        }
      } else {
        const prompt = `請分析以下文章，提取篇章基本信息。

文章內容：
${textConfig.content || '（請先貼上原文）'}

【重要】只輸出以下JSON，所有值必須是純文字，絕對不可加任何HTML標籤：
{
  "title": "篇章題目（純文字，如：出師表）",
  "author": "作者姓名（純文字，如：諸葛亮）",
  "dynasty": "朝代或時代（純文字，如：三國、唐代、現代）",
  "content": "完整原文（純文字，保持原有分段，不加任何標籤）",
  "analysis": "篇章主要內容摘要（純文字，3至5句）"
}`
        result = await callAI({ ...aiConfig, systemPrompt: EXTRACT_SYSTEM, userPrompt: prompt })
      }
      const data = parseAIJson(result)
      
      Object.entries(data).forEach(([k, v]) => {
        if (v) updateText(k, v)
      })
    } catch (e) {
      alert('AI提取失敗：' + e.message)
    } finally {
      setExtracting(false)
    }
  }

  const canProceed = textConfig.title && textConfig.author && textConfig.content && aiConfig.apiKey

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gold-600 text-sm font-medium mb-2">
          <Settings size={14} />
          頁面一 · Setup
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">篇章設定</h1>
        <p className="text-ink-500 mt-1">配置 AI 模型，上傳或輸入篇章，開始生成工作紙</p>
        <div className="brush-divider" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Config Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden">
          <div className="px-5 py-4 bg-ink-950 text-white flex items-center gap-2">
            <Cpu size={16} className="text-gold-400" />
            <span className="font-medium">AI 模型配置</span>
          </div>
          <div className="p-5 space-y-4">
            {/* Provider */}
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">AI 平台</label>
              <div className="flex gap-2">
                {PROVIDERS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => handleProviderChange(p.value)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all
                      ${aiConfig.provider === p.value
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model name */}
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <Cpu size={12} /> 模型名稱
              </label>
              <input
                type="text"
                value={aiConfig.model}
                onChange={e => updateAI('model', e.target.value)}
                placeholder="如 gemini-2.5-flash"
                className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-gold-400 font-mono"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <Key size={12} /> API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={aiConfig.apiKey}
                  onChange={e => updateAI('apiKey', e.target.value)}
                  placeholder="輸入您的 API Key"
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-gold-400 font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-xs text-ink-400 mt-1 flex items-center gap-1">
                🔒 API Key 僅儲存於您的瀏覽器，不會上傳至任何伺服器
              </p>
            </div>

            {/* Base URL (optional) */}
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1">
                <Link size={12} /> Base URL（可選，用於反向代理）
              </label>
              <input
                type="text"
                value={aiConfig.baseUrl}
                onChange={e => updateAI('baseUrl', e.target.value)}
                placeholder="https://your-proxy.com（留空使用預設）"
                className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-gold-400"
              />
            </div>

            {/* Test button */}
            <button
              onClick={handleTest}
              disabled={testing || !aiConfig.apiKey}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                bg-ink-900 text-white text-sm font-medium hover:bg-ink-800
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <Wifi size={14} />}
              測試連線
            </button>

            {testResult && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg
                ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {testResult.msg}
              </div>
            )}
          </div>
        </div>

        {/* Text Input Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden">
          <div className="px-5 py-4 bg-ink-950 text-white flex items-center gap-2">
            <BookOpen size={16} className="text-gold-400" />
            <span className="font-medium">篇章資料</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">篇名 *</label>
                <input
                  type="text"
                  value={textConfig.title}
                  onChange={e => updateText('title', e.target.value)}
                  placeholder="如：出師表"
                  className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">作者 *</label>
                <input
                  type="text"
                  value={textConfig.author}
                  onChange={e => updateText('author', e.target.value)}
                  placeholder="如：諸葛亮"
                  className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-gold-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">朝代 / 時代</label>
                <input
                  type="text"
                  value={textConfig.dynasty}
                  onChange={e => updateText('dynasty', e.target.value)}
                  placeholder="如：三國"
                  className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-gold-400"
                />
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">上傳檔案（可選）</label>
              <div
                onDrop={handleFileDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
                  ${dragOver ? 'border-gold-400 bg-gold-50' : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'}`}
              >
                <Upload size={20} className="mx-auto text-ink-400 mb-1" />
                <p className="text-xs text-ink-500">
                  {uploadedFile ? `✓ ${uploadedFile.name}` : '拖放 PDF / 圖片 / TXT，或點擊上傳'}
                </p>
                <input ref={fileRef} type="file" className="hidden" accept=".txt,.pdf,.png,.jpg,.jpeg"
                  onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
              </div>
            </div>

            {/* Content textarea */}
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">原文 * <span className="text-ink-400">（可手動貼入或由 AI 提取）</span></label>
              <textarea
                value={textConfig.content}
                onChange={e => updateText('content', e.target.value)}
                placeholder="請貼上篇章原文…"
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-gold-400 font-serif resize-none"
              />
            </div>

            {/* AI Extract button */}
            <button
              onClick={extractWithAI}
              disabled={extracting || !aiConfig.apiKey}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg
                bg-gold-50 text-gold-700 border border-gold-200 text-sm font-medium
                hover:bg-gold-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {extracting ? (
                <span className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
              ) : <Zap size={14} />}
              AI 智能提取篇章信息
            </button>
          </div>
        </div>
      </div>

      {/* Analysis field */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-ink-100 p-5">
        <label className="block text-xs font-medium text-ink-500 mb-1.5">篇章賞析 / 教師備注（可選）</label>
        <textarea
          value={textConfig.analysis}
          onChange={e => updateText('analysis', e.target.value)}
          placeholder="可貼入篇章賞析資料，供 AI 生成工作紙時參考…"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm focus:outline-none focus:border-gold-400 resize-none"
        />
      </div>

      {/* Proceed button */}
      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-ink-400">
          {canProceed ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle size={14} /> 設定完成，可以開始生成工作紙
            </span>
          ) : (
            <span className="text-ink-400">請填寫篇名、作者、原文，並設定 API Key</span>
          )}
        </div>
        <button
          onClick={() => navigate('/author')}
          disabled={!canProceed}
          className="flex items-center gap-2 px-6 py-3 rounded-xl
            bg-gradient-to-r from-gold-500 to-gold-600 text-white font-medium
            hover:from-gold-600 hover:to-gold-700 shadow-sm
            disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          開始生成
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
