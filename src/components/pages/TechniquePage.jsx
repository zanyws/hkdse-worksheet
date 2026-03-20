import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildTechniquePrompt } from '../../lib/prompts'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { PenTool, AlertTriangle, Clock, CheckSquare, Lightbulb, AlertCircle, BookOpen, GitCompare } from 'lucide-react'

function TeacherHTML({ html }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export default function TechniquePage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const data = state.worksheetData.techniqueData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先輸入篇章內容'); return }
    setLoading(true); setError(null)
    try {
      const prompt = buildTechniquePrompt(state.textConfig)
      const result = await callAI({ ...state.aiConfig, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt, maxTokens: 6000 })
      const clean = result.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      dispatch({ type: 'SET_PAGE_DATA', page: 'techniqueData', data: parsed })
    } catch (e) {
      setError('生成失敗：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const effectColors = [
    { key: 'literal', label: '字面效果', color: 'bg-sky-50 border-sky-200 text-sky-700' },
    { key: 'emotional', label: '情感效果', color: 'bg-rose-50 border-rose-200 text-rose-700' },
    { key: 'thematic', label: '主題效果', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-gold-600 text-sm font-medium mb-2">
          <PenTool size={14} /> 頁面五 · Technique
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">寫作手法分析</h1>
        <p className="text-ink-500 mt-1">三步曲效果分析、答題技巧指引、DSE答題鷹架</p>
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
          <DownloadBar pageId="technique-worksheet" pageName="寫作手法" />

          <div id="technique-worksheet" className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 animate-fadeIn">
            <PaperHeader pageTitle="文本細讀：寫作手法分析" />

            {/* Answer Tips Box */}
            {data.answerTips && (
              <div className="tips-box mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-gold-600" />
                  <span className="font-bold text-gold-700 text-sm">手法題四步答題法</span>
                  {data.answerTips.timeAllocation && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-ink-500">
                      <Clock size={12} />
                      建議作答時間：{data.answerTips.timeAllocation.total}
                      （閱讀{data.answerTips.timeAllocation.reading}·構思{data.answerTips.timeAllocation.planning}·書寫{data.answerTips.timeAllocation.writing}）
                    </span>
                  )}
                </div>

                {/* Four steps */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {(data.answerTips.fourSteps || []).map((step, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white border border-gold-200 rounded-lg px-3 py-1.5 text-xs">
                      <span className="w-5 h-5 bg-gold-400 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-ink-700">{step}</span>
                    </div>
                  ))}
                </div>

                {data.answerTips.mnemonic && (
                  <div className="bg-white border border-gold-300 rounded-lg px-3 py-2 text-sm text-ink-700 mb-3">
                    📝 <span className="font-bold text-gold-700">口訣：</span>{data.answerTips.mnemonic}
                  </div>
                )}

                {/* Scoring checklist */}
                <div className="flex flex-wrap gap-2">
                  {['□ 引用原句', '□ 點明手法', '□ 三層效果（字面/情感/主題）', '□ 扣緊主旨'].map(item => (
                    <span key={item} className="text-xs bg-white border border-gold-200 rounded px-2 py-1 text-ink-600">{item}</span>
                  ))}
                </div>

                {/* Sentence templates */}
                {data.answerTips.templates && data.answerTips.templates.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gold-200">
                    <div className="text-xs font-medium text-gold-700 mb-1">實用開頭模板：</div>
                    {data.answerTips.templates.map((t, i) => (
                      <div key={i} className="text-xs text-ink-600 italic bg-white rounded px-2 py-1 mb-1 border border-gold-100">
                        {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Frequency Table */}
            {data.frequencyTable && data.frequencyTable.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-ink-900 text-white rounded text-xs flex items-center justify-center font-bold">甲</span>
                  手法頻率統計表
                </h2>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-ink-100">
                      <th className="border border-ink-200 px-3 py-2 text-left">手法名稱</th>
                      <th className="border border-ink-200 px-3 py-2 text-center w-16">次數</th>
                      <th className="border border-ink-200 px-3 py-2 text-left">分佈段落</th>
                      <th className="border border-ink-200 px-3 py-2 text-left">趨勢分析</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.frequencyTable.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-ink-50'}>
                        <td className="border border-ink-200 px-3 py-2 font-medium">
                          <TeacherHTML html={row.technique} />
                        </td>
                        <td className="border border-ink-200 px-3 py-2 text-center">
                          <TeacherHTML html={String(row.count)} />
                        </td>
                        <td className="border border-ink-200 px-3 py-2">
                          <TeacherHTML html={row.paragraphs} />
                        </td>
                        <td className="border border-ink-200 px-3 py-2 text-xs text-ink-600">
                          <TeacherHTML html={row.trend} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Main Techniques — Three-Step Analysis */}
            {(data.mainTechniques || []).map((tech, ti) => (
              <section key={ti} className="mb-8">
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gold-500 text-white rounded text-xs flex items-center justify-center font-bold">
                    {['乙','丙','丁','戊','己'][ti] || ti + 1}
                  </span>
                  手法分析：{tech.name}
                  {tech.isCompound && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      複合手法 × {tech.compoundWith}
                    </span>
                  )}
                </h2>

                {/* Step 1: Text evidence */}
                <div className="mb-4">
                  <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">
                    第一步：文本根據
                  </div>
                  <div className="bg-ink-50 border-l-4 border-ink-400 px-4 py-3 font-serif text-sm italic text-ink-700 rounded-r-lg">
                    <TeacherHTML html={tech.textEvidence} />
                  </div>
                </div>

                {/* Step 2: Structure */}
                <div className="mb-4">
                  <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">
                    第二步：手法拆解（{tech.structure?.type}）
                  </div>
                  <div className="bg-ink-50 rounded-lg px-4 py-3 text-sm">
                    <TeacherHTML html={tech.structure?.components || ''} />
                  </div>
                </div>

                {/* Step 3: Three-tier effect */}
                <div className="mb-4">
                  <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">
                    第三步：效果三層次
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {effectColors.map(({ key, label, color }) => (
                      <div key={key} className={`rounded-lg p-3 border ${color}`}>
                        <div className="text-xs font-bold mb-2">{label}</div>
                        <div className="border-b border-current opacity-30 h-5 mb-1" />
                        <div className="border-b border-current opacity-30 h-5 mb-2" />
                        <div className="text-xs">
                          <TeacherHTML html={tech.effects?.[key] || ''} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Identification tip + Common errors */}
                {(tech.identificationTip || (tech.commonErrors && tech.commonErrors.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {tech.identificationTip && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-1 text-blue-700 text-xs font-bold mb-1">
                          <Lightbulb size={12} /> 辨識要訣
                        </div>
                        <p className="text-xs text-blue-700">{tech.identificationTip}</p>
                      </div>
                    )}
                    {tech.commonErrors && tech.commonErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-1 text-red-700 text-xs font-bold mb-1">
                          <AlertCircle size={12} /> 常見錯誤避雷區
                        </div>
                        {tech.commonErrors.map((err, i) => (
                          <p key={i} className="text-xs text-red-600 mb-0.5">⚠ {err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            ))}

            {/* Compound Analysis */}
            {data.compoundAnalysis?.synergy && (
              <section className="mb-8">
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-600 text-white rounded text-xs flex items-center justify-center font-bold">複</span>
                  複合手法協同分析：{data.compoundAnalysis.combination}
                </h2>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm">
                  <TeacherHTML html={data.compoundAnalysis.synergy} />
                </div>
              </section>
            )}

            {/* DSE Model Answer */}
            {data.dseModelAnswer && (
              <section className="mb-8">
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-vermillion-600 text-white rounded text-xs flex items-center justify-center font-bold">DSE</span>
                  仿DSE答題鷹架
                </h2>
                <div className="bg-ink-50 border border-ink-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-ink-700 mb-3">
                    <TeacherHTML html={data.dseModelAnswer.question} />
                  </p>

                  {/* Answer box */}
                  <div className="bg-white border-2 border-ink-200 rounded-lg p-4 min-h-24 mb-3 text-sm leading-relaxed">
                    <div className="space-y-1">
                      {[1,2,3,4,5].map(n => <div key={n} className="border-b border-ink-100 h-7" />)}
                    </div>
                  </div>

                  {/* Scoring points checklist */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(data.dseModelAnswer.scoringPoints || []).map((pt, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs bg-white border border-ink-200 rounded px-2 py-1">
                        <CheckSquare size={11} className="text-green-500" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>

                  {/* Model answer */}
                  <div className="bg-white border border-vermillion-200 rounded-lg p-3 text-sm">
                    <div className="text-xs text-vermillion-600 font-bold mb-2">【教師版範文答案】</div>
                    <TeacherHTML html={data.dseModelAnswer.answer} />
                  </div>
                </div>
              </section>
            )}

            {/* Comparison Table */}
            {data.comparisonTable?.relatedText && (
              <section className="mb-8">
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-3 flex items-center gap-2">
                  <GitCompare size={18} />
                  手法比較：《{state.textConfig.title}》vs《{data.comparisonTable.relatedText}》
                </h2>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-ink-100">
                      <th className="border border-ink-200 px-3 py-2 text-left w-24">比較項目</th>
                      <th className="border border-ink-200 px-3 py-2 text-left">《{state.textConfig.title}》</th>
                      <th className="border border-ink-200 px-3 py-2 text-left">《{data.comparisonTable.relatedText}》</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-ink-200 px-3 py-3 bg-ink-50 font-medium">相同點</td>
                      <td className="border border-ink-200 px-3 py-3" colSpan={2}>
                        <TeacherHTML html={data.comparisonTable.similarities || ''} />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-ink-200 px-3 py-3 bg-ink-50 font-medium">不同點</td>
                      <td className="border border-ink-200 px-3 py-3" colSpan={2}>
                        <TeacherHTML html={data.comparisonTable.differences || ''} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {/* Evaluation Question */}
            {data.evaluationQuestion && (
              <section>
                <h2 className="text-lg font-serif font-bold text-ink-800 mb-3 flex items-center gap-2">
                  <BookOpen size={18} />
                  評價與反思
                </h2>
                <div className="bg-ink-50 rounded-xl p-4">
                  <p className="text-sm font-medium mb-3"><TeacherHTML html={data.evaluationQuestion.question} /></p>
                  <div className="space-y-1 mb-3">
                    {[1,2,3,4].map(n => <div key={n} className="border-b border-ink-200 h-7" />)}
                  </div>
                  <div className="bg-white border border-ink-200 rounded-lg p-3 text-sm">
                    <div className="text-xs text-vermillion-600 font-bold mb-1">【教師參考】</div>
                    <TeacherHTML html={data.evaluationQuestion.answer} />
                  </div>
                </div>
              </section>
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
