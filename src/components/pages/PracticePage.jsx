import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildPracticePrompt } from '../../lib/prompts'
import { parseAIJson } from '../../lib/parseJSON'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { BookOpen, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

function HTML({ html }) {
  if (!html) return null
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

const TYPE_STYLES = {
  translation:        { label: '語譯',     color: 'bg-blue-100 text-blue-700',    bar: 'bg-blue-600' },
  comprehension:      { label: '內容理解', color: 'bg-green-100 text-green-700',  bar: 'bg-green-600' },
  structure_or_technique: { label: '結構／手法', color: 'bg-purple-100 text-purple-700', bar: 'bg-purple-600' },
  technique:          { label: '手法效果', color: 'bg-rose-100 text-rose-700',    bar: 'bg-rose-600' },
  insight:            { label: '見解體會', color: 'bg-amber-100 text-amber-700',  bar: 'bg-amber-600' },
}

const LEVEL_ICONS = { '★★☆': '入門', '★★★': '進階', '★★★★': '高階' }

function QuestionCard({ q, index, showAnswers }) {
  const [showDetail, setShowDetail] = useState(false)
  const style = TYPE_STYLES[q.type] || TYPE_STYLES.comprehension
  const typeName = q.typeName || style.label
  const lines = q.answerLines || 5
  const hasLeveled = q.leveledSamples?.level5 || q.leveledSamples?.level3

  return (
    <div className="mb-8 pb-8 border-b border-ink-100 last:border-0">

      {/* Question header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 w-9 h-9 ${style.bar} text-white rounded-xl flex items-center justify-center font-bold text-sm`}>
          {index}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${style.color}`}>
              {typeName}
            </span>
            {q.q3Type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 text-ink-500">
                {q.q3Type}
              </span>
            )}
            {q.sentencePattern && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gold-100 text-gold-700">
                {q.sentencePattern}
              </span>
            )}
            <span className="text-xs text-ink-400 ml-auto">（{q.marks}分）</span>
          </div>
          <p className="text-sm text-ink-800 leading-relaxed font-medium">
            {q.question}
          </p>
        </div>
      </div>

      {/* Answer lines */}
      <div className="ml-12 space-y-1 mb-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="border-b border-ink-200 h-7" />
        ))}
      </div>

      {/* Teacher answers (shown when toggled) */}
      {showAnswers && (
        <div className="ml-12 space-y-3">

          {/* Main answer */}
          {q.answer && (
            <div className="bg-vermillion-50 border border-vermillion-200 rounded-xl p-4">
              <div className="text-xs font-bold text-vermillion-600 mb-2">【答案】</div>
              <div className="text-sm leading-relaxed">
                <HTML html={q.answer} />
              </div>
            </div>
          )}

          {/* Error analysis + leveled samples toggle */}
          {(q.errorAnalysis || hasLeveled) && (
            <>
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="no-print flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 transition-colors"
              >
                {showDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showDetail ? '收起' : '展開'}教學備注
              </button>

              {showDetail && (
                <div className="space-y-3">
                  {/* Error analysis */}
                  {q.errorAnalysis && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <div className="text-xs font-bold text-orange-600 mb-1.5 flex items-center gap-1">
                        ⚠️ 常見錯誤分析
                      </div>
                      <p className="text-xs text-orange-800 leading-relaxed">
                        {q.errorAnalysis}
                      </p>
                    </div>
                  )}

                  {/* Leveled samples */}
                  {hasLeveled && (
                    <div className="bg-ink-50 rounded-xl p-3 border border-ink-200">
                      <div className="text-xs font-bold text-ink-600 mb-2">分級答案示例</div>
                      <div className="space-y-2">
                        {q.leveledSamples?.level5 && (
                          <div>
                            <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold mb-1">
                              5** 級
                            </span>
                            <div className="text-xs text-ink-700 leading-relaxed">
                              <HTML html={q.leveledSamples.level5} />
                            </div>
                          </div>
                        )}
                        {q.leveledSamples?.level3 && (
                          <div className="pt-2 border-t border-ink-200">
                            <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold mb-1">
                              3 級
                            </span>
                            <p className="text-xs text-ink-600 leading-relaxed">
                              {q.leveledSamples.level3}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function PracticePage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [showAnswers, setShowAnswers] = useState(false)

  const data = state.worksheetData.practiceData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先輸入篇章內容'); return }
    setLoading(true); setError(null)
    try {
      const result = await callAI({
        ...state.aiConfig,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildPracticePrompt(state.textConfig),
        maxTokens: 65536,
      })
      const parsed = parseAIJson(result)
      dispatch({ type: 'SET_PAGE_DATA', page: 'practiceData', data: parsed })
    } catch (e) {
      setError('生成失敗：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gold-600 text-sm font-medium mb-2">
          <BookOpen size={14} /> 頁面六 · Practice
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">課文鞏固練習</h1>
        <p className="text-ink-500 mt-1">五題綜合考核，貫通前四頁所學</p>
        <div className="brush-divider" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6 no-print flex-wrap">
        <GenerateButton onClick={generate} loading={loading} hasData={!!data} />
        {data && (
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`text-sm px-4 py-2.5 rounded-xl border transition-all font-medium
              ${showAnswers
                ? 'bg-vermillion-600 text-white border-vermillion-600'
                : 'bg-white text-vermillion-600 border-vermillion-200 hover:bg-vermillion-50'}`}
          >
            {showAnswers ? '隱藏答案' : '顯示教師版答案'}
          </button>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && data && (
        <>
          <DownloadBar pageId="practice-worksheet" pageName="鞏固練習" />

          <div id="practice-worksheet" className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 animate-fadeIn">
            <PaperHeader pageTitle="課文鞏固練習" />

            {/* Score summary */}
            <div className="flex items-center gap-3 mb-8 p-3 bg-ink-50 rounded-xl border border-ink-100 no-print">
              <span className="text-xs text-ink-500">總分：</span>
              {(data.questions || []).map((q, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-xs text-ink-400">題{i + 1}</span>
                  <span className="text-xs font-bold text-ink-700">{q.marks}分</span>
                </div>
              ))}
              <span className="ml-auto text-sm font-bold text-ink-700">
                共 {(data.questions || []).reduce((s, q) => s + (q.marks || 0), 0)} 分
              </span>
            </div>

            {/* Questions */}
            {(data.questions || []).map((q, i) => (
              <QuestionCard
                key={q.id || i}
                q={q}
                index={i + 1}
                showAnswers={showAnswers}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-ink-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">點擊「生成工作紙」開始生成鞏固練習</p>
        </div>
      )}
    </div>
  )
}
