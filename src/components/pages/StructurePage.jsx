import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildStructurePrompt } from '../../lib/prompts'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { LayoutList, AlertTriangle, ArrowRight } from 'lucide-react'

function TeacherHTML({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default function StructurePage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const data = state.worksheetData.structureData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先輸入篇章內容'); return }
    setLoading(true); setError(null)
    try {
      const prompt = buildStructurePrompt(state.textConfig)
      const result = await callAI({ ...state.aiConfig, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt, maxTokens: 4000 })
      const clean = result.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      dispatch({ type: 'SET_PAGE_DATA', page: 'structureData', data: parsed })
    } catch (e) {
      setError('生成失敗：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const layerColors = {
    content: 'bg-blue-50 border-blue-200 text-blue-800',
    emotion: 'bg-rose-50 border-rose-200 text-rose-800',
    culture: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gold-600 text-sm font-medium mb-2">
          <LayoutList size={14} /> 頁面四 · Structure
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">課文結構與主旨</h1>
        <p className="text-ink-500 mt-1">內容梳理、主旨三層模型、主旨句鷹架</p>
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
          <DownloadBar pageId="structure-worksheet" pageName="課文結構" />

          <div id="structure-worksheet" className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 animate-fadeIn">
            <PaperHeader pageTitle="課文結構與主旨分析" />

            {/* Structure Diagram */}
            <section className="mb-8">
              <h2 className="text-lg font-serif font-bold text-ink-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">甲</span>
                課文結構梳理
                {data.structureType && (
                  <span className="text-xs font-normal text-ink-400 ml-2">（{data.structureType}）</span>
                )}
              </h2>

              {/* Sections */}
              <div className="relative">
                {(data.sections || []).map((sec, i) => (
                  <div key={i} className="flex items-stretch gap-0 mb-2">
                    {/* Label */}
                    <div className="w-20 flex-shrink-0 bg-ink-900 text-white rounded-l-lg flex flex-col items-center justify-center px-2 py-3 text-center">
                      <div className="text-sm font-serif font-bold">{sec.label}</div>
                      <div className="text-xs opacity-60 mt-0.5">{sec.paragraphs}</div>
                    </div>

                    {/* Arrow */}
                    <div className="w-6 flex items-center justify-center bg-ink-100">
                      <ArrowRight size={12} className="text-ink-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 border border-ink-200 rounded-r-lg p-3">
                      <div className="text-xs text-ink-500 mb-1">段落大意</div>
                      <div className="text-sm text-ink-700 mb-2"><TeacherHTML html={sec.summary} /></div>

                      {/* Fill blank for key point */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-ink-400">關鍵詞：</span>
                        <span className="text-xs text-ink-400 italic">（{sec.fillHint}）</span>
                        <span className="inline-block border-b border-ink-400 min-w-20 ml-1 text-center">
                          <TeacherHTML html={sec.keyPoint} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Thesis Three Layers */}
            <section className="mb-8">
              <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">乙</span>
                主旨三層分析
              </h2>

              {data.thesisThreeLayers && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'content', label: '內容層（What）', emoji: '📋', color: layerColors.content },
                    { key: 'emotion', label: '情感層（How）', emoji: '💭', color: layerColors.emotion },
                    { key: 'culture', label: '文化層（Why）', emoji: '🌏', color: layerColors.culture },
                  ].map(({ key, label, emoji, color }) => {
                    const layer = data.thesisThreeLayers[key]
                    return (
                      <div key={key} className={`rounded-xl p-4 border ${color}`}>
                        <div className="font-bold text-sm mb-2">{emoji} {label}</div>
                        <p className="text-xs mb-3 opacity-80">{layer?.question}</p>
                        <div className="border-b border-current opacity-30 h-6 mb-1" />
                        <div className="border-b border-current opacity-30 h-6 mb-1" />
                        <div className="text-xs mt-2">
                          <TeacherHTML html={layer?.answer || ''} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Thesis Sentence Scaffold */}
            <section className="mb-8">
              <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">丙</span>
                主旨句寫作鷹架
              </h2>

              {data.thesisSentence && (
                <div>
                  <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-4">
                    <div className="text-xs font-medium text-gold-700 mb-2">句式框架</div>
                    <p className="text-sm font-serif leading-relaxed text-ink-700">
                      {data.thesisSentence.scaffold}
                    </p>
                  </div>

                  <div className="text-xs font-medium text-ink-500 mb-2">試按上述框架，寫出本文主旨：</div>
                  <div className="space-y-1 mb-4">
                    {[1,2,3].map(n => <div key={n} className="border-b border-ink-200 h-7" />)}
                  </div>

                  <div className="bg-ink-50 rounded-lg p-4 text-sm">
                    <div className="text-xs text-vermillion-600 font-bold mb-2">【教師版參考答案】</div>
                    <p className="mb-2"><TeacherHTML html={data.thesisSentence.sampleAnswer1 || ''} /></p>
                    {data.thesisSentence.sampleAnswer2 && (
                      <p><TeacherHTML html={data.thesisSentence.sampleAnswer2} /></p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Structure Questions */}
            {data.structureQuestions && data.structureQuestions.length > 0 && (
              <section>
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">丁</span>
                  結構分析練習
                </h2>
                <div className="space-y-5">
                  {data.structureQuestions.map((q, i) => (
                    <div key={i} className="bg-ink-50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-3">
                        <span className="font-bold mr-2">{i + 1}.</span>
                        <TeacherHTML html={q.question} />
                      </p>
                      <div className="space-y-1 mb-3">
                        {[1,2,3,4].map(n => <div key={n} className="border-b border-ink-200 h-7" />)}
                      </div>
                      <div className="text-sm">
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
          <LayoutList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">點擊「生成工作紙」開始生成結構分析內容</p>
        </div>
      )}
    </div>
  )
}
