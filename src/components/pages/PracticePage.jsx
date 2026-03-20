import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildPracticePrompt, buildVariationPrompt } from '../../lib/prompts'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { BookOpen, AlertTriangle, ChevronDown, Sparkles, RefreshCw, TrendingUp } from 'lucide-react'

function TeacherHTML({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

const TYPE_LABELS = {
  vocabulary: '字詞理解',
  extraction: '截取信息',
  synthesis: '整合論述',
  attitude: '觀點態度',
  technique: '寫作手法',
  technique_compare: '手法比較',
}

const TYPE_COLORS = {
  vocabulary: 'bg-blue-100 text-blue-700',
  extraction: 'bg-green-100 text-green-700',
  synthesis: 'bg-purple-100 text-purple-700',
  attitude: 'bg-orange-100 text-orange-700',
  technique: 'bg-rose-100 text-rose-700',
  technique_compare: 'bg-pink-100 text-pink-700',
}

const VARIATION_TYPES = [
  { value: 'comparison', label: '跨段比較版', icon: '↔️' },
  { value: 'transfer',   label: '情境遷移版', icon: '🔄' },
  { value: 'evaluation', label: '評價反思版', icon: '💡' },
]

function MotherQuestionCard({ mq, textConfig, aiConfig }) {
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(null)
  const [generatedVariations, setGeneratedVariations] = useState({})

  async function generateVariation(type) {
    setGenerating(type)
    try {
      const prompt = buildVariationPrompt(mq.content, type, textConfig)
      const result = await callAI({ ...aiConfig, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt, maxTokens: 1500 })
      const clean = result.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setGeneratedVariations(prev => ({ ...prev, [type]: parsed }))
    } catch (e) {
      alert('生成失敗：' + e.message)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
      {/* Mother question */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded font-medium">母題</span>
              <span className="text-xs text-ink-500">{mq.type}</span>
            </div>
            <p className="text-sm text-ink-800 leading-relaxed"><TeacherHTML html={mq.content} /></p>
            <div className="mt-2 text-xs">
              <span className="text-vermillion-600 font-bold">評分關鍵點：</span>
              <TeacherHTML html={mq.answerKey} />
            </div>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-gold-600 border border-gold-200 rounded-lg px-3 py-1.5 hover:bg-gold-50 transition-colors"
          >
            <Sparkles size={11} />
            生成變式
            <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Variation panel */}
      {open && (
        <div className="border-t border-ink-100 bg-gold-50 p-4">
          <div className="text-xs font-medium text-gold-700 mb-3">選擇變式類型生成：</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {VARIATION_TYPES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => generateVariation(value)}
                disabled={!!generating}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all
                  ${generatedVariations[value]
                    ? 'bg-white border-gold-400 text-gold-700 font-medium'
                    : 'bg-white border-ink-200 text-ink-600 hover:border-gold-300'
                  } disabled:opacity-50`}
              >
                {generating === value ? (
                  <span className="w-3 h-3 border border-gold-400 border-t-transparent rounded-full animate-spin" />
                ) : <span>{icon}</span>}
                {label}
                {generatedVariations[value] && ' ✓'}
              </button>
            ))}
          </div>

          {/* Display generated variations */}
          {Object.entries(generatedVariations).map(([type, varData]) => {
            const typeInfo = VARIATION_TYPES.find(t => t.value === type)
            return (
              <div key={type} className="bg-white border border-gold-200 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gold-700">
                    {typeInfo?.icon} {typeInfo?.label}
                  </span>
                  <button
                    onClick={() => generateVariation(type)}
                    className="text-xs text-ink-400 hover:text-ink-600 flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> 重新生成
                  </button>
                </div>
                <p className="text-sm text-ink-800 mb-3"><TeacherHTML html={varData.content} /></p>
                <div className="space-y-1 mb-3">
                  {[1,2,3].map(n => <div key={n} className="border-b border-ink-200 h-6" />)}
                </div>
                <div className="text-xs">
                  <span className="text-vermillion-600 font-bold">教師版答案：</span>
                  <TeacherHTML html={varData.answer || ''} />
                </div>
                {varData.scoringNote && (
                  <div className="mt-2 text-xs text-ink-500 italic">
                    📊 評分備注：{varData.scoringNote}
                  </div>
                )}
              </div>
            )
          })}

          {/* Pre-loaded variations from AI */}
          {mq.variations && mq.variations.length > 0 && Object.keys(generatedVariations).length === 0 && (
            <div className="space-y-3">
              <div className="text-xs text-ink-400 mb-2">（以下為預設變式，點擊上方按鈕重新生成）</div>
              {mq.variations.map((v) => {
                const typeInfo = VARIATION_TYPES.find(t => t.value === v.type)
                return (
                  <div key={v.variationId} className="bg-white border border-ink-200 rounded-lg p-3">
                    <span className="text-xs font-bold text-ink-500">
                      {typeInfo?.icon} {typeInfo?.label}
                    </span>
                    <p className="text-sm mt-1"><TeacherHTML html={v.content} /></p>
                    {v.scoringNote && (
                      <div className="text-xs text-ink-400 mt-1 italic">📊 {v.scoringNote}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PracticePage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showTeacher, setShowTeacher] = useState(false)

  const data = state.worksheetData.practiceData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先輸入篇章內容'); return }
    setLoading(true); setError(null)
    try {
      const prompt = buildPracticePrompt(state.textConfig)
      const result = await callAI({ ...state.aiConfig, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt, maxTokens: 6000 })
      const clean = result.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
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
        <p className="text-ink-500 mt-1">仿DSE題型練習、智能變式題庫</p>
        <div className="brush-divider" />
      </div>

      <div className="flex items-center gap-3 mb-6 no-print">
        <GenerateButton onClick={generate} loading={loading} hasData={!!data} />
        {data && (
          <button
            onClick={() => setShowTeacher(!showTeacher)}
            className={`text-sm px-4 py-2 rounded-lg border transition-all
              ${showTeacher
                ? 'bg-vermillion-600 text-white border-vermillion-600'
                : 'bg-white text-vermillion-600 border-vermillion-200 hover:bg-vermillion-50'}`}
          >
            {showTeacher ? '隱藏' : '顯示'}教師版答案
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

            {/* Questions */}
            <section className="mb-10">
              <h2 className="text-lg font-serif font-bold text-ink-800 mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">甲</span>
                閱讀理解
              </h2>

              <div className="space-y-8">
                {(data.questions || []).map((q, i) => (
                  <div key={q.id || i} className="border-b border-ink-100 pb-6 last:border-0">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-ink-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLORS[q.type] || 'bg-gray-100 text-gray-600'}`}>
                            {q.typeName || TYPE_LABELS[q.type] || q.type}
                          </span>
                          {q.marks && (
                            <span className="text-xs text-ink-400">（{q.marks}分）</span>
                          )}
                        </div>
                        <p className="text-sm text-ink-800 leading-relaxed">
                          <TeacherHTML html={q.question} />
                        </p>
                      </div>
                    </div>

                    {/* Answer lines */}
                    <div className="ml-11 space-y-1 mb-3">
                      {Array.from({ length: Math.max(3, (q.marks || 2) * 2) }).map((_, n) => (
                        <div key={n} className="border-b border-ink-200 h-7" />
                      ))}
                    </div>

                    {/* Teacher answers */}
                    {showTeacher && (
                      <div className="ml-11 space-y-2">
                        <div className="bg-vermillion-50 border border-vermillion-200 rounded-lg p-3 text-sm">
                          <div className="text-xs text-vermillion-600 font-bold mb-1">【答案】</div>
                          <TeacherHTML html={q.answer} />
                        </div>
                        {q.errorAnalysis && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                            ⚠️ 常見錯誤：{q.errorAnalysis}
                          </div>
                        )}
                        {q.leveledSamples && (
                          <div className="bg-ink-50 rounded-lg p-3 text-xs">
                            <div className="font-bold mb-2 text-ink-600">分級答案示例：</div>
                            <div className="space-y-2">
                              {q.leveledSamples.level5 && (
                                <div>
                                  <span className="text-green-600 font-bold">5**級：</span>
                                  <TeacherHTML html={q.leveledSamples.level5} />
                                </div>
                              )}
                              {q.leveledSamples.level3 && (
                                <div>
                                  <span className="text-yellow-600 font-bold">3級：</span>
                                  <TeacherHTML html={q.leveledSamples.level3} />
                                </div>
                              )}
                              {q.leveledSamples.level1 && (
                                <div>
                                  <span className="text-red-500 font-bold">1級：</span>
                                  <TeacherHTML html={q.leveledSamples.level1} />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Variation Question Bank */}
            {data.motherQuestions && data.motherQuestions.length > 0 && (
              <section>
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gold-500 text-white rounded text-xs flex items-center justify-center font-bold">乙</span>
                  智能變式題庫
                  <TrendingUp size={16} className="text-gold-500" />
                </h2>
                <div className="tips-box mb-4 text-sm">
                  <p className="text-gold-700">
                    <span className="font-bold">💡 智能變式：</span>
                    針對同一考點，系統可生成跨段比較、情境遷移、評價反思三類變式題，防止學生死記答案，確保真正理解。
                  </p>
                </div>
                <div className="space-y-4">
                  {data.motherQuestions.map((mq, i) => (
                    <MotherQuestionCard
                      key={mq.questionId || i}
                      mq={mq}
                      textConfig={state.textConfig}
                      aiConfig={state.aiConfig}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-ink-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">點擊「生成工作紙」開始生成練習題目</p>
        </div>
      )}
    </div>
  )
}
