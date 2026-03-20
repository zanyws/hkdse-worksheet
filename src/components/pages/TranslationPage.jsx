import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildTranslationPrompt } from '../../lib/prompts'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { FileText, AlertTriangle } from 'lucide-react'

function TeacherHTML({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default function TranslationPage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const data = state.worksheetData.translationData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先輸入篇章內容'); return }
    setLoading(true); setError(null)
    dispatch({ type: 'SET_GENERATING', page: 'translation' })
    try {
      const prompt = buildTranslationPrompt(state.textConfig)
      const result = await callAI({ ...state.aiConfig, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt, maxTokens: 6000 })
      const clean = result.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      dispatch({ type: 'SET_PAGE_DATA', page: 'translationData', data: parsed })
    } catch (e) {
      setError('生成失敗：' + e.message)
    } finally {
      setLoading(false)
      dispatch({ type: 'SET_GENERATING', page: null })
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gold-600 text-sm font-medium mb-2">
          <FileText size={14} /> 頁面三 · Translation
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">篇章語譯</h1>
        <p className="text-ink-500 mt-1">雙欄對應語譯、關鍵詞填空</p>
        <div className="brush-divider" />
      </div>

      <div className="flex items-center gap-3 mb-6 no-print">
        <GenerateButton onClick={generate} loading={loading} hasData={!!data} />
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && data && (
        <>
          <DownloadBar pageId="translation-worksheet" pageName="篇章語譯" />

          <div id="translation-worksheet" className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 animate-fadeIn">
            <PaperHeader pageTitle="篇章語譯" />

            {/* Instructions */}
            <div className="tips-box mb-6 text-sm">
              <p className="font-medium text-gold-700 mb-1">📖 閱讀指引</p>
              <p className="text-ink-600">左欄為原文，重點字詞以數字標記（如 <strong>1.</strong>）；右欄為語譯，對應位置留空（___1___），請根據上下文填入適當解釋。</p>
            </div>

            {/* Paragraphs */}
            {(data.paragraphs || []).map((para, pi) => (
              <div key={pi} className="mb-8">
                <div className="text-xs font-medium text-ink-400 mb-2 uppercase tracking-wider">
                  第 {pi + 1} 段
                </div>

                {/* Two-column layout */}
                <div className="translation-grid text-sm">
                  {/* Original */}
                  <div className="translation-original">
                    <div className="text-xs font-bold text-ink-400 mb-2 tracking-wider">【原文】</div>
                    <p className="leading-loose font-serif" dangerouslySetInnerHTML={{
                      __html: (para.markedOriginal || para.original || '')
                        .replace(/\*\*(\d+)\.\s*([^*]+)\*\*/g, '<strong class="text-gold-700">$1. $2</strong>')
                    }} />
                  </div>

                  {/* Translation */}
                  <div className="translation-modern">
                    <div className="text-xs font-bold text-ink-400 mb-2 tracking-wider">【語譯】</div>
                    <p className="leading-loose" dangerouslySetInnerHTML={{
                      __html: (para.markedTranslation || para.translation || '')
                        .replace(/___(\d+)___/g, '<span class="fill-blank teacher-answer" style="min-width:60px;display:inline-block;border-bottom:1.5px solid #ccc;text-align:center;margin:0 4px;"></span>')
                    }} />
                  </div>
                </div>

                {/* Key words table */}
                {para.keyWords && para.keyWords.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-ink-500 mb-2">關鍵詞語解釋</div>
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gold-50">
                          <th className="border border-gold-200 px-3 py-1.5 text-left w-8">序</th>
                          <th className="border border-gold-200 px-3 py-1.5 text-left w-28">字詞</th>
                          <th className="border border-gold-200 px-3 py-1.5 text-left">解釋</th>
                        </tr>
                      </thead>
                      <tbody>
                        {para.keyWords.map((kw, ki) => (
                          <tr key={ki}>
                            <td className="border border-ink-200 px-3 py-2 text-center text-ink-500">{kw.index}</td>
                            <td className="border border-ink-200 px-3 py-2 font-serif font-bold">{kw.word}</td>
                            <td className="border border-ink-200 px-3 py-2">
                              <TeacherHTML html={kw.meaning} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {/* Comprehension */}
            {data.comprehensionQuestions && data.comprehensionQuestions.length > 0 && (
              <section className="mt-6 border-t border-ink-100 pt-6">
                <h2 className="text-base font-serif font-bold text-ink-800 mb-4">語譯理解題</h2>
                <div className="space-y-5">
                  {data.comprehensionQuestions.map((q, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium mb-2">
                        <span className="font-bold mr-2">{i + 1}.</span>
                        <TeacherHTML html={q.question} />
                      </p>
                      <div className="space-y-1 ml-5">
                        {[1,2,3].map(n => (
                          <div key={n} className="border-b border-ink-200 h-7" />
                        ))}
                      </div>
                      <div className="ml-5 mt-2 text-sm">
                        <TeacherHTML html={q.answer} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-ink-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">點擊「生成工作紙」開始生成語譯內容</p>
        </div>
      )}
    </div>
  )
}
