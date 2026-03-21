import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildTranslationPrompt } from '../../lib/prompts'
import { parseAIJson } from '../../lib/parseJSON'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { FileText, AlertTriangle, BookOpen, AlignLeft, Layers } from 'lucide-react'

function HTML({ html }) {
  if (!html) return null
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function SectionTitle({ badge, badgeColor = 'bg-ink-900', icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-2 mb-5 mt-8 pb-2 border-b border-ink-100">
      <span className={`w-7 h-7 ${badgeColor} text-white rounded-lg text-sm flex items-center justify-center font-serif font-bold flex-shrink-0`}>
        {badge}
      </span>
      {Icon && <Icon size={16} className="text-ink-500" />}
      <h2 className="text-lg font-serif font-bold text-ink-800">{title}</h2>
      {sub && <span className="text-xs text-ink-400 font-normal">{sub}</span>}
    </div>
  )
}

export default function TranslationPage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)
  const [error, setError] = useState(null)
  const data = state.worksheetData.translationData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先輸入篇章內容'); return }
    setLoading(true); setError(null)
    try {
      const prompt = buildTranslationPrompt(state.textConfig)
      const result = await callAI({ ...state.aiConfig, systemPrompt: SYSTEM_PROMPT, userPrompt: prompt, maxTokens: 65536 })
      const parsed = parseAIJson(result)
      dispatch({ type: 'SET_PAGE_DATA', page: 'translationData', data: parsed })
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
          <FileText size={14} /> 頁面三 · Translation
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">篇章語譯</h1>
        <p className="text-ink-500 mt-1">雙欄對照語譯、字詞辨析、句式分析與語譯技巧</p>
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
          <DownloadBar pageId="translation-worksheet" pageName="篇章語譯" />

          <div id="translation-worksheet" className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 animate-fadeIn">
            <PaperHeader pageTitle="篇章語譯" />

            {/* ── 甲：雙欄對照語譯 ── */}
            <SectionTitle badge="甲" icon={AlignLeft} title="雙欄對照語譯" sub="左欄原文 · 右欄語譯填空" />

            <div className="tips-box mb-6 text-sm">
              <span className="font-medium text-gold-700">📖 填寫說明：</span>
              右欄語譯中，數字標記位置（如 ___1___）對應左欄原文的重點字詞，請根據上下文填入適當語譯。
            </div>

            {(data.paragraphs || []).map((para, pi) => (
              <div key={pi} className="mb-8">
                <div className="text-xs font-medium text-ink-400 mb-2 uppercase tracking-wider">
                  第 {pi + 1} 段
                </div>

                {/* Two-column */}
                <div className="translation-grid text-sm mb-3">
                  <div className="translation-original">
                    <div className="text-xs font-bold text-ink-400 mb-2 tracking-wider">【原文】</div>
                    <p className="leading-loose font-serif" dangerouslySetInnerHTML={{
                      __html: (para.markedOriginal || para.original || '')
                        .replace(/\*\*(\d+)\.\s*([^*]+)\*\*/g,
                          '<strong class="text-gold-700 border-b border-gold-400">$1. $2</strong>')
                    }} />
                  </div>
                  <div className="translation-modern">
                    <div className="text-xs font-bold text-ink-400 mb-2 tracking-wider">【語譯】</div>
                    <p className="leading-loose" dangerouslySetInnerHTML={{
                      __html: (para.markedTranslation || para.translation || '')
                        .replace(/___(\d+)___/g,
                          '<span class="teacher-answer" style="display:inline-block;min-width:64px;border-bottom:1.5px solid #ccc;text-align:center;margin:0 2px;"></span>')
                    }} />
                  </div>
                </div>

                {/* Keywords table */}
                {para.keyWords && para.keyWords.length > 0 && (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gold-50">
                        <th className="border border-gold-200 px-3 py-1.5 text-left w-8 text-gold-700">序</th>
                        <th className="border border-gold-200 px-3 py-1.5 text-left w-28 text-gold-700">字詞</th>
                        <th className="border border-gold-200 px-3 py-1.5 text-left text-gold-700">解釋</th>
                      </tr>
                    </thead>
                    <tbody>
                      {para.keyWords.map((kw, ki) => (
                        <tr key={ki} className={ki % 2 === 0 ? 'bg-white' : 'bg-ink-50'}>
                          <td className="border border-ink-200 px-3 py-2 text-center text-ink-400">{kw.index}</td>
                          <td className="border border-ink-200 px-3 py-2 font-serif font-bold text-ink-800">{kw.word}</td>
                          <td className="border border-ink-200 px-3 py-2"><HTML html={kw.meaning} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}

            {/* ── 乙：字詞辨析 ── */}
            {data.wordStudy && (
              <>
                <SectionTitle badge="乙" icon={BookOpen} title="字詞辨析" badgeColor="bg-gold-500" />

                {/* 一、虛詞辨析 */}
                {data.wordStudy.functionalWords?.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">一、虛詞辨析</span>
                      <span className="text-xs text-ink-400">同一虛詞，不同意義</span>
                    </div>
                    <div className="space-y-5">
                      {data.wordStudy.functionalWords.map((fw, i) => (
                        <div key={i} className="bg-ink-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-8 h-8 bg-ink-900 text-white rounded-lg flex items-center justify-center font-serif font-bold text-base">
                              {fw.word}
                            </span>
                            <span className="text-sm font-medium text-ink-600">「{fw.word}」字在不同語境的意義</span>
                          </div>
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-white">
                                <th className="border border-ink-200 px-3 py-2 text-left w-8">#</th>
                                <th className="border border-ink-200 px-3 py-2 text-left">原文例句</th>
                                <th className="border border-ink-200 px-3 py-2 text-left w-36">此處意義</th>
                                <th className="border border-ink-200 px-3 py-2 text-left">語譯</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(fw.examples || []).map((ex, ei) => (
                                <tr key={ei} className={ei % 2 === 0 ? 'bg-white' : 'bg-ink-50'}>
                                  <td className="border border-ink-200 px-3 py-2 text-center text-ink-400">{ei + 1}</td>
                                  <td className="border border-ink-200 px-3 py-2 font-serif">{ex.sentence}</td>
                                  <td className="border border-ink-200 px-3 py-2"><HTML html={ex.meaning} /></td>
                                  <td className="border border-ink-200 px-3 py-2 text-xs text-ink-600"><HTML html={ex.translation} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 二、古今義不同 */}
                {data.wordStudy.classicalModernDiff?.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">二、古今義不同</span>
                      <span className="text-xs text-ink-400">小心以今義套古義</span>
                    </div>
                    <div className="space-y-4">
                      {data.wordStudy.classicalModernDiff.map((item, i) => (
                        <div key={i} className="bg-white border border-ink-200 rounded-xl overflow-hidden">
                          <div className="flex items-center gap-3 px-4 py-2 bg-ink-50 border-b border-ink-200">
                            <span className="font-serif font-bold text-base text-ink-800">「{item.word}」</span>
                            <span className="text-xs text-ink-400 font-serif italic">{item.sentence}</span>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-ink-200">
                            <div className="p-3">
                              <div className="text-xs font-bold text-gold-600 mb-1">古義（文中意思）</div>
                              <div className="text-sm"><HTML html={item.classicalMeaning} /></div>
                            </div>
                            <div className="p-3">
                              <div className="text-xs font-bold text-ink-500 mb-1">今義（現代意思）</div>
                              <div className="text-sm"><HTML html={item.modernMeaning} /></div>
                            </div>
                          </div>
                          {item.warning && (
                            <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 flex items-center gap-1">
                              ⚠️ {item.warning}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 三、一字多義 */}
                {data.wordStudy.multiMeaning?.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">三、一字多義</span>
                      <span className="text-xs text-ink-400">根據上下文判斷字義</span>
                    </div>
                    <div className="space-y-5">
                      {data.wordStudy.multiMeaning.map((item, i) => (
                        <div key={i} className="bg-ink-50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-8 h-8 bg-gold-500 text-white rounded-lg flex items-center justify-center font-serif font-bold text-base">
                              {item.word}
                            </span>
                            <span className="text-sm font-medium text-ink-600">「{item.word}」字的不同用法</span>
                          </div>
                          <table className="w-full border-collapse text-sm">
                            <thead>
                              <tr className="bg-white">
                                <th className="border border-ink-200 px-3 py-2 text-left w-8">#</th>
                                <th className="border border-ink-200 px-3 py-2 text-left">原文例句</th>
                                <th className="border border-ink-200 px-3 py-2 text-left w-20">詞性</th>
                                <th className="border border-ink-200 px-3 py-2 text-left w-36">字義</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(item.usages || []).map((u, ui) => (
                                <tr key={ui} className={ui % 2 === 0 ? 'bg-white' : 'bg-ink-50'}>
                                  <td className="border border-ink-200 px-3 py-2 text-center text-ink-400">{ui + 1}</td>
                                  <td className="border border-ink-200 px-3 py-2 font-serif">{u.sentence}</td>
                                  <td className="border border-ink-200 px-3 py-2 text-xs text-ink-500">{u.pos}</td>
                                  <td className="border border-ink-200 px-3 py-2"><HTML html={u.meaning} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── 丙：句式分析 + 語譯技巧 ── */}
            {data.sentencePatterns?.length > 0 && (
              <>
                <SectionTitle badge="丙" icon={Layers} title="句式分析與語譯技巧" badgeColor="bg-vermillion-600" />

                <div className="space-y-6">
                  {data.sentencePatterns.map((sp, i) => (
                    <div key={i} className="border border-ink-200 rounded-2xl overflow-hidden">

                      {/* Header */}
                      <div className="px-5 py-3 bg-ink-900 text-white flex items-center gap-3">
                        <span className="w-6 h-6 bg-gold-500 text-ink-950 rounded font-bold text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="font-serif font-bold text-base">
                          <HTML html={sp.patternName} />
                        </span>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Sentence feature */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 text-xs font-bold text-ink-500 w-20 pt-0.5 uppercase tracking-wider">句式特徵</div>
                          <div className="flex-1 text-sm bg-ink-50 rounded-lg px-3 py-2">
                            <HTML html={sp.feature} />
                          </div>
                        </div>

                        {/* Example */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 text-xs font-bold text-ink-500 w-20 pt-0.5 uppercase tracking-wider">文中例句</div>
                          <div className="flex-1 text-sm font-serif bg-gold-50 border-l-4 border-gold-400 px-3 py-2 rounded-r-lg italic text-ink-700">
                            {sp.example}
                          </div>
                        </div>

                        {/* Translation technique */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 text-xs font-bold text-gold-600 w-20 pt-0.5 uppercase tracking-wider">語譯技巧</div>
                          <div className="flex-1 text-sm tips-box py-2">
                            <HTML html={sp.technique} />
                          </div>
                        </div>

                        {/* Model answer */}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 text-xs font-bold text-vermillion-600 w-20 pt-0.5 uppercase tracking-wider">示範語譯</div>
                          <div className="flex-1 text-sm bg-vermillion-50 border border-vermillion-200 rounded-lg px-3 py-2">
                            <HTML html={sp.modelAnswer} />
                          </div>
                        </div>

                        {/* Practice */}
                        {sp.practice && (
                          <div className="bg-white border-2 border-dashed border-ink-200 rounded-xl p-4">
                            <div className="text-xs font-bold text-ink-600 mb-2 uppercase tracking-wider">
                              ✏️ 實踐練習
                            </div>
                            <p className="text-sm text-ink-800 mb-3 font-medium">
                              {sp.practice.question}
                            </p>
                            <div className="space-y-1 mb-3">
                              {[1,2].map(n => <div key={n} className="border-b border-ink-200 h-7" />)}
                            </div>
                            <div className="bg-ink-50 rounded-lg px-3 py-2 text-sm">
                              <span className="text-xs text-vermillion-600 font-bold mr-2">【參考答案】</span>
                              <HTML html={sp.practice.answer} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
