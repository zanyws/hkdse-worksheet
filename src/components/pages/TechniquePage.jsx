import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildTechniquePrompt } from '../../lib/prompts'
import { parseAIJson } from '../../lib/parseJSON'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { PenTool, AlertTriangle, Lightbulb, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

function HTML({ html }) {
  if (!html) return null
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

const LEVEL_STYLES = {
  '入門': { bg: 'bg-blue-600',    badge: 'bg-blue-100 text-blue-700' },
  '鞏固': { bg: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  '延伸': { bg: 'bg-purple-600',  badge: 'bg-purple-100 text-purple-700' },
  '綜合': { bg: 'bg-vermillion-600', badge: 'bg-red-100 text-red-700' },
}

function QuestionCard({ q, index }) {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const level = LEVEL_STYLES[q.level] || LEVEL_STYLES['入門']
  const lines = q.answerLines || 6

  return (
    <div className="border-2 border-ink-100 rounded-2xl overflow-hidden mb-8">

      {/* ── 題目標題列 ── */}
      <div className={`px-5 py-3 ${level.bg} text-white flex items-center gap-3`}>
        <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-sm">
          題{index}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${level.badge} bg-white/20 text-white border border-white/30`}>
          {q.level}
        </span>
        <span className="text-sm font-medium ml-1">{q.techName}</span>
        {q.marks && (
          <span className="ml-auto text-xs opacity-80">（{q.marks}分）</span>
        )}
      </div>

      <div className="p-5 space-y-5">

        {/* ── 步驟一：題目 ── */}
        <div>
          <div className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">
            📋 題目
          </div>
          <div className="bg-ink-50 rounded-xl px-4 py-3 text-sm font-medium text-ink-800 leading-relaxed border border-ink-200">
            {q.question}
          </div>
        </div>

        {/* ── 步驟二：審題引導 ── */}
        {q.examSkills && (
          <div>
            <div className="text-xs font-bold text-gold-600 uppercase tracking-wider mb-2">
              🔍 審題引導
            </div>
            <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 space-y-2">
              {[
                ['題目要求我做什麼？', q.examSkills.requirement],
                ['手法在哪裡？',       q.examSkills.locate],
                ['需要幾個得分點？',   q.examSkills.scoreEstimate],
                ['答案結構：',         q.examSkills.structure],
              ].map(([label, val]) => val && (
                <div key={label} className="flex gap-2 text-sm">
                  <span className="text-gold-600 font-medium flex-shrink-0 w-32">{label}</span>
                  <span className="text-ink-600 border-b border-gold-200 flex-1 pb-0.5">
                    <HTML html={val} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 步驟三：學生填寫區 ── */}
        <div>
          <div className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">
            ✏️ 作答
          </div>
          <div className="space-y-1">
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="border-b border-ink-200 h-7" />
            ))}
          </div>
        </div>

        {/* ── 步驟四：答題技巧 ── */}
        {q.tips && (
          <div className="tips-box">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-gold-600" />
              <span className="font-bold text-gold-700 text-sm">答題技巧提示</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(q.tips.steps || []).map((step, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white border border-gold-200 rounded-lg px-2.5 py-1 text-xs">
                  <span className="w-4 h-4 bg-gold-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-ink-700">{step}</span>
                </div>
              ))}
            </div>
            {q.tips.template && (
              <div className="bg-white border border-gold-200 rounded-lg px-3 py-2 text-xs text-ink-700 mb-2 italic">
                📝 模板：{q.tips.template}
              </div>
            )}
            {q.tips.avoid && (
              <div className="flex items-start gap-1.5 text-xs text-red-600">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                {q.tips.avoid}
              </div>
            )}
          </div>
        )}

        {/* ── 步驟五：手法分析（教師版，可展開） ── */}
        <div>
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="no-print flex items-center gap-2 text-xs font-bold text-vermillion-600 hover:text-vermillion-700 transition-colors"
          >
            {showAnalysis ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showAnalysis ? '收起' : '展開'}手法分析（教師版）
          </button>

          {/* Always visible in print/teacher mode */}
          <div className={`mt-3 ${showAnalysis ? 'block' : 'hidden'} teacher-section`}>
            <div className="bg-ink-50 rounded-xl p-4 space-y-3 border border-ink-200">
              <div className="text-xs font-bold text-vermillion-600 mb-1">【教師版手法分析】</div>

              {q.textEvidence && (
                <div className="flex gap-2">
                  <span className="text-xs font-bold text-ink-500 w-20 flex-shrink-0 pt-0.5">文本根據</span>
                  <div className="flex-1 bg-white border-l-4 border-ink-400 px-3 py-2 rounded-r-lg text-sm font-serif italic text-ink-700">
                    <HTML html={q.textEvidence} />
                  </div>
                </div>
              )}

              {q.analysis && (
                <>
                  {q.analysis.structure && (
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-ink-500 w-20 flex-shrink-0 pt-0.5">手法結構</span>
                      <div className="flex-1 text-sm bg-white rounded-lg px-3 py-2 border border-ink-200">
                        <HTML html={q.analysis.structure} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[
                      { key: 'literal',   label: '字面效果', color: 'bg-sky-50 border-sky-200 text-sky-700' },
                      { key: 'emotional', label: '情感效果', color: 'bg-rose-50 border-rose-200 text-rose-700' },
                      { key: 'thematic',  label: '主題效果', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                    ].map(({ key, label, color }) => q.analysis[key] && (
                      <div key={key} className={`rounded-lg p-3 border ${color}`}>
                        <div className="text-xs font-bold mb-1">{label}</div>
                        <div className="text-xs"><HTML html={q.analysis[key]} /></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── 步驟六：範文答案 ── */}
          {q.modelAnswer && (
            <div className="mt-3 bg-vermillion-50 border border-vermillion-200 rounded-xl p-4">
              <div className="text-xs font-bold text-vermillion-600 mb-2">【教師版範文答案】</div>
              <div className="text-sm leading-relaxed">
                <HTML html={q.modelAnswer} />
              </div>
            </div>
          )}

          {/* ── 評價題（題四專用） ── */}
          {q.evaluationQuestion && (
            <div className="mt-4 bg-white border-2 border-dashed border-ink-200 rounded-xl p-4">
              <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">
                💭 延伸評價題
              </div>
              <p className="text-sm font-medium text-ink-800 mb-3">
                {q.evaluationQuestion.question}
              </p>
              <div className="space-y-1 mb-3">
                {[1,2,3,4].map(n => <div key={n} className="border-b border-ink-200 h-7" />)}
              </div>
              <div className="bg-ink-50 rounded-lg p-3 text-sm">
                <div className="text-xs text-vermillion-600 font-bold mb-1">【教師參考答案】</div>
                <HTML html={q.evaluationQuestion.answer} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TechniquePage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)
  const [error, setError]     = useState(null)
  const data = state.worksheetData.techniqueData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先輸入篇章內容'); return }
    setLoading(true); setError(null)
    try {
      const result = await callAI({
        ...state.aiConfig,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildTechniquePrompt(state.textConfig),
        maxTokens: 65536,
      })
      const parsed = parseAIJson(result)
      dispatch({ type: 'SET_PAGE_DATA', page: 'techniqueData', data: parsed })
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
          <PenTool size={14} /> 頁面五 · Technique
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">寫作手法分析</h1>
        <p className="text-ink-500 mt-1">四題遞進式設計：入門 → 鞏固 → 延伸 → 綜合</p>
        <div className="brush-divider" />
      </div>

      <div className="flex items-center gap-3 mb-6 no-print">
        <GenerateButton onClick={generate} loading={loading} hasData={!!data} />
        {data && (
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border transition-all font-medium
              ${showAnswers
                ? 'bg-vermillion-600 text-white border-vermillion-600'
                : 'bg-white text-vermillion-600 border-vermillion-200 hover:bg-vermillion-50'}`}
          >
            {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
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
          <DownloadBar pageId="technique-worksheet" pageName="寫作手法" />

          <div id="technique-worksheet" className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 animate-fadeIn">
            <PaperHeader pageTitle="文本細讀：寫作手法分析" />

            {/* Questions */}
            {(data.questions || []).map((q, i) => (
              <QuestionCard key={q.id || i} q={q} index={i + 1} />
            ))}

            {/* Compound Analysis */}
            {data.compoundAnalysis?.synergy && (
              <div className="mt-6 border-t border-ink-100 pt-6">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-ink-100">
                  <span className="w-7 h-7 bg-purple-600 text-white rounded-lg text-sm flex items-center justify-center font-serif font-bold">複</span>
                  <h2 className="text-lg font-serif font-bold text-ink-800">
                    複合手法協同分析：{data.compoundAnalysis.combination}
                  </h2>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm leading-relaxed">
                  <HTML html={data.compoundAnalysis.synergy} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-ink-400">
          <PenTool size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">點擊「生成工作紙」開始生成寫作手法分析內容</p>
        </div>
      )}
    </div>
  )
}
