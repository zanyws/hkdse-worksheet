import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildAuthorPrompt } from '../../lib/prompts'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { User, Clock, BookOpen, Brain, AlertTriangle } from 'lucide-react'

function TeacherHTML({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function FillBlank({ answer }) {
  return (
    <span className="inline-block border-b border-ink-400 min-w-24 mx-1 text-center">
      <TeacherHTML html={answer} />
    </span>
  )
}

export default function AuthorPage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const data = state.worksheetData.authorData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先在「篇章設定」頁面設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先在「篇章設定」頁面輸入篇章內容'); return }
    setLoading(true); setError(null)
    dispatch({ type: 'SET_GENERATING', page: 'author' })
    try {
      const prompt = buildAuthorPrompt(state.textConfig)
      const result = await callAI({ ...state.aiConfig, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt, maxTokens: 4000 })
      const clean = result.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      dispatch({ type: 'SET_PAGE_DATA', page: 'authorData', data: parsed })
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
          <User size={14} /> 頁面二 · Author & Context
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">知人論世</h1>
        <p className="text-ink-500 mt-1">作者背景、寫作背景、批判視角</p>
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
          <DownloadBar pageId="author-worksheet" pageName="知人論世" />

          <div id="author-worksheet" className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 animate-fadeIn">
            <PaperHeader pageTitle="知人論世" />

            {/* Author Profile */}
            <section className="mb-8">
              <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">甲</span>
                作者人物檔案
              </h2>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {[
                    ['姓名', data.authorProfile?.name],
                    ['朝代', data.authorProfile?.dynasty],
                    ['身份', data.authorProfile?.identity],
                    ['文學風格', data.authorProfile?.style],
                    ['思想特色', data.authorProfile?.ideology],
                  ].map(([label, val]) => val && (
                    <tr key={label}>
                      <td className="border border-ink-200 bg-ink-50 px-4 py-2 font-medium w-28">{label}</td>
                      <td className="border border-ink-200 px-4 py-2">
                        <TeacherHTML html={String(val)} />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-ink-200 bg-ink-50 px-4 py-2 font-medium">代表作</td>
                    <td className="border border-ink-200 px-4 py-2">
                      <TeacherHTML html={(data.authorProfile?.majorWorks || []).join('、')} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Timeline */}
            {data.timeline && data.timeline.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">乙</span>
                  人生時間軸
                </h2>
                <div className="relative pl-6 border-l-2 border-gold-300 space-y-4">
                  {data.timeline.map((item, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[27px] w-4 h-4 bg-gold-400 rounded-full border-2 border-white" />
                      <div className="bg-ink-50 rounded-lg px-4 py-3">
                        <div className="text-xs font-bold text-gold-600 mb-1"><TeacherHTML html={item.year} /></div>
                        <div className="text-sm font-medium text-ink-800"><TeacherHTML html={item.event} /></div>
                        {item.significance && (
                          <div className="text-xs text-ink-500 mt-1"><TeacherHTML html={item.significance} /></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-gold-50 rounded-lg border border-gold-200 text-sm">
                  <span className="font-medium text-gold-700">試根據以上時間軸，概述作者一生的仕途起伏：</span>
                  <div className="mt-2 border-b border-ink-300 h-6 w-full" />
                  <div className="mt-2 border-b border-ink-300 h-6 w-full" />
                </div>
              </section>
            )}

            {/* Writing Context */}
            <section className="mb-8">
              <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">丙</span>
                寫作背景
              </h2>
              <div className="bg-ink-50 rounded-lg p-4 text-sm leading-relaxed font-serif">
                <TeacherHTML html={data.writingContext || ''} />
              </div>
              {data.expectedReader && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <span className="font-medium text-blue-700">預期讀者分析：</span>
                  <TeacherHTML html={data.expectedReader} />
                </div>
              )}
            </section>

            {/* Causal Chain */}
            {data.causalChain && (
              <section className="mb-8">
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">丁</span>
                  因果鏈分析
                </h2>
                <div className="flex items-stretch gap-2 text-sm">
                  {[
                    { label: '因（寫作動機）', val: data.causalChain.cause, color: 'bg-blue-50 border-blue-200' },
                    { label: '→', val: null, arrow: true },
                    { label: '果（情感表達）', val: data.causalChain.effect, color: 'bg-green-50 border-green-200' },
                    { label: '→', val: null, arrow: true },
                    { label: '用字/語氣', val: data.causalChain.language, color: 'bg-gold-50 border-gold-200' },
                  ].map((item, i) => item.arrow ? (
                    <div key={i} className="self-center text-ink-400 font-bold text-xl">→</div>
                  ) : (
                    <div key={i} className={`flex-1 rounded-lg p-3 border ${item.color}`}>
                      <div className="text-xs font-bold text-ink-600 mb-1">{item.label}</div>
                      <TeacherHTML html={item.val || ''} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Fill Blanks */}
            {data.fillBlanks && data.fillBlanks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">戊</span>
                  知識鞏固填空
                </h2>
                <div className="space-y-3">
                  {data.fillBlanks.map((item, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium mr-2">{i + 1}.</span>
                      <TeacherHTML html={item.question} />
                      <FillBlank answer={item.answer} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Critical Questions */}
            {data.criticalQuestions && data.criticalQuestions.length > 0 && (
              <section className="mb-4">
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-vermillion-600 text-white rounded text-xs flex items-center justify-center font-bold">己</span>
                  明辨性思維
                </h2>
                <div className="space-y-4">
                  {data.criticalQuestions.map((item, i) => (
                    <div key={i} className="bg-ink-50 rounded-lg p-4">
                      <p className="text-sm font-medium mb-3 text-ink-800">
                        <span className="text-vermillion-600 font-bold mr-2">思考：</span>
                        <TeacherHTML html={item.question} />
                      </p>
                      <div className="space-y-1">
                        {[1,2,3].map(n => (
                          <div key={n} className="border-b border-ink-200 h-7" />
                        ))}
                      </div>
                      <div className="mt-3 text-sm">
                        <span className="text-vermillion-600 font-bold text-xs">【教師參考答案】</span>
                        <div className="mt-1"><TeacherHTML html={item.answer} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Intertextuality */}
            {data.intertextuality && data.intertextuality.length > 0 && (
              <section>
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">庚</span>
                  互文比較
                </h2>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-ink-100">
                      <th className="border border-ink-200 px-3 py-2 text-left">相關篇章</th>
                      <th className="border border-ink-200 px-3 py-2 text-left">作者</th>
                      <th className="border border-ink-200 px-3 py-2 text-left">關聯說明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.intertextuality.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-ink-200 px-3 py-2 font-serif">《<TeacherHTML html={item.title} />》</td>
                        <td className="border border-ink-200 px-3 py-2"><TeacherHTML html={item.author} /></td>
                        <td className="border border-ink-200 px-3 py-2"><TeacherHTML html={item.connection} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
