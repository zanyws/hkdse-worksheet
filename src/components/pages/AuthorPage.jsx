import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildAuthorPrompt } from '../../lib/prompts'
import { parseAIJson } from '../../lib/parseJSON'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { User, AlertTriangle, Eye, EyeOff } from 'lucide-react'

function HTML({ html }) {
  if (!html) return null
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default function AuthorPage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAnswers, setShowAnswers] = useState(false)

  const data = state.worksheetData.authorData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先輸入篇章內容'); return }
    setLoading(true); setError(null)
    try {
      const prompt = buildAuthorPrompt(state.textConfig)
      const result = await callAI({ ...state.aiConfig, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt, maxTokens: 65536 })
      const parsed = parseAIJson(result)
      dispatch({ type: 'SET_PAGE_DATA', page: 'authorData', data: parsed })
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
          <User size={14} /> 頁面二 · Author & Context
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">知人論世</h1>
        <p className="text-ink-500 mt-1">作者生平、寫作背景、解題、代入情境</p>
        <div className="brush-divider" />
      </div>

      <div className="flex items-center gap-3 mb-6 no-print flex-wrap">
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
          <DownloadBar pageId="author-worksheet" pageName="知人論世" />
          <div id="author-worksheet" className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 animate-fadeIn">
            <PaperHeader pageTitle="知人論世" />

            {/* ── 甲：作者生平 ── */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-5 pb-2 border-b border-ink-100">
                <span className="w-7 h-7 bg-ink-900 text-white rounded-lg text-sm flex items-center justify-center font-serif font-bold">甲</span>
                <h2 className="text-lg font-serif font-bold text-ink-800">作者生平</h2>
              </div>

              {/* Profile table - always show full content */}
              <table className="w-full border-collapse text-sm mb-6">
                <tbody>
                  {[
                    ['姓名', data.authorProfile?.name],
                    ['朝代', data.authorProfile?.dynasty],
                    ['身份', data.authorProfile?.identity],
                    ['文學風格', data.authorProfile?.style],
                    ['思想特色', data.authorProfile?.ideology],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <tr key={label}>
                      <td className="border border-ink-200 bg-ink-50 px-4 py-2.5 font-medium w-28 text-ink-700">{label}</td>
                      <td className="border border-ink-200 px-4 py-2.5"><HTML html={String(val)} /></td>
                    </tr>
                  ))}
                  {data.authorProfile?.majorWorks?.length > 0 && (
                    <tr>
                      <td className="border border-ink-200 bg-ink-50 px-4 py-2.5 font-medium text-ink-700">代表作</td>
                      <td className="border border-ink-200 px-4 py-2.5">{data.authorProfile.majorWorks.join('、')}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Timeline - always show full content */}
              {data.timeline?.length > 0 && (
                <div className="relative pl-6 border-l-2 border-gold-300 space-y-3">
                  {data.timeline.map((item, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[27px] w-4 h-4 bg-gold-400 rounded-full border-2 border-white" />
                      <div className="bg-ink-50 rounded-lg px-4 py-3">
                        <div className="text-xs font-bold text-gold-600 mb-1">{item.year}</div>
                        <div className="text-sm font-medium text-ink-800 mb-1"><HTML html={item.event} /></div>
                        {item.significance && (
                          <div className="text-xs text-ink-500"><HTML html={item.significance} /></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── 乙：寫作背景 ── */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-5 pb-2 border-b border-ink-100">
                <span className="w-7 h-7 bg-ink-900 text-white rounded-lg text-sm flex items-center justify-center font-serif font-bold">乙</span>
                <h2 className="text-lg font-serif font-bold text-ink-800">寫作背景</h2>
              </div>
              <div className="space-y-4">
                {data.writingContext && (
                  <div className="bg-ink-50 rounded-xl p-4 text-sm leading-relaxed font-serif border border-ink-100">
                    <HTML html={data.writingContext} />
                  </div>
                )}
                {data.expectedReader && (
                  <div className="bg-blue-50 rounded-xl p-4 text-sm leading-relaxed border border-blue-100">
                    <div className="text-xs font-bold text-blue-600 mb-1">預期讀者分析</div>
                    <HTML html={data.expectedReader} />
                  </div>
                )}
              </div>
            </section>

            {/* ── 丙：解題 ── */}
            {data.titleAnalysis && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-5 pb-2 border-b border-ink-100">
                  <span className="w-7 h-7 bg-ink-900 text-white rounded-lg text-sm flex items-center justify-center font-serif font-bold">丙</span>
                  <h2 className="text-lg font-serif font-bold text-ink-800">解題</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-ink-50 rounded-xl p-4 border border-ink-100">
                    <div className="text-xs font-bold text-ink-500 mb-2">字面義</div>
                    <div className="text-sm leading-relaxed"><HTML html={data.titleAnalysis.literal} /></div>
                  </div>
                  <div className="bg-gold-50 rounded-xl p-4 border border-gold-100">
                    <div className="text-xs font-bold text-gold-600 mb-2">深層義</div>
                    <div className="text-sm leading-relaxed"><HTML html={data.titleAnalysis.deep} /></div>
                  </div>
                </div>
                {/* Student prediction */}
                <div className="bg-white border-2 border-dashed border-ink-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-ink-700 mb-3">
                    💭 {data.titleAnalysis.question || '根據篇名，你預測文章會討論什麼主題？'}
                  </p>
                  <div className="space-y-1">
                    {[1,2,3].map(n => <div key={n} className="border-b border-ink-200 h-7" />)}
                  </div>
                </div>
              </section>
            )}

            {/* ── 丁：代入情境 ── */}
            {data.scenario && (
              <section>
                <div className="flex items-center gap-2 mb-5 pb-2 border-b border-ink-100">
                  <span className="w-7 h-7 bg-gold-500 text-white rounded-lg text-sm flex items-center justify-center font-serif font-bold">丁</span>
                  <h2 className="text-lg font-serif font-bold text-ink-800">代入情境</h2>
                  <span className="text-xs text-ink-400 font-normal">讀文前先思考，讀文後再對比</span>
                </div>

                {/* Situation */}
                <div className="bg-gradient-to-br from-gold-50 to-ink-50 rounded-2xl p-5 border border-gold-200 mb-5">
                  <div className="text-xs font-bold text-gold-700 mb-3 uppercase tracking-wider">
                    📖 {data.scenario.setup || '情境設定'}
                  </div>
                  <p className="text-sm leading-relaxed text-ink-800 font-serif">
                    <HTML html={data.scenario.situation} />
                  </p>
                </div>

                {/* Guiding questions - student answer area */}
                <div className="space-y-5 mb-6">
                  {(data.scenario.guidingQuestions || []).map((q, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-ink-800 mb-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-ink-900 text-white rounded text-xs font-bold mr-2">
                          {i + 1}
                        </span>
                        <HTML html={q} />
                      </p>
                      <div className="ml-7 space-y-1">
                        {[1,2,3].map(n => <div key={n} className="border-b border-ink-200 h-7" />)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* After reading */}
                {data.scenario.afterReading && (
                  <div className="border-2 border-dashed border-ink-200 rounded-xl p-4 mb-4">
                    <div className="text-xs font-bold text-ink-500 mb-2 uppercase tracking-wider">
                      📝 讀後對比（閱讀全文後回答）
                    </div>
                    <p className="text-sm text-ink-800 mb-3">
                      <HTML html={data.scenario.afterReading} />
                    </p>
                    <div className="space-y-1">
                      {[1,2,3,4].map(n => <div key={n} className="border-b border-ink-200 h-7" />)}
                    </div>
                  </div>
                )}

                {/* Teacher answers for scenario - only shown when toggled */}
                {showAnswers && (
                  <div className="bg-vermillion-50 border border-vermillion-200 rounded-xl p-4 mt-4">
                    <div className="text-xs font-bold text-vermillion-600 mb-3">【教師版：代入情境參考答案】</div>
                    {(data.scenario.guidingQuestions || []).map((q, i) => (
                      <div key={i} className="mb-3">
                        <div className="text-xs font-medium text-ink-600 mb-1">問題 {i + 1}：</div>
                        <div className="text-sm text-ink-700 pl-3 border-l-2 border-vermillion-300">
                          <HTML html={q} />
                        </div>
                        <div className="text-sm mt-1 pl-3">
                          <span className="text-vermillion-600 font-bold text-xs">參考方向：</span>
                          <span className="text-ink-600 text-xs">（引導學生結合自身經歷，回應篇章主題，無固定答案）</span>
                        </div>
                      </div>
                    ))}
                    {data.scenario.afterReading && (
                      <div className="mt-3 pt-3 border-t border-vermillion-200">
                        <div className="text-xs font-bold text-vermillion-600 mb-1">讀後對比參考：</div>
                        <div className="text-sm text-ink-700">
                          引導學生比較自己的做法與作者的做法，分析兩者的異同及原因，並評價哪種方式更有效，言之成理即可。
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-20 text-ink-400">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">點擊「生成工作紙」開始生成知人論世內容</p>
        </div>
      )}
    </div>
  )
}
