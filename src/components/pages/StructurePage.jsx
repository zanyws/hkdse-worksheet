import React, { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { callAI } from '../../lib/api'
import { SYSTEM_PROMPT, buildStructurePrompt } from '../../lib/prompts'
import { parseAIJson } from '../../lib/parseJSON'
import PaperHeader from '../ui/PaperHeader'
import DownloadBar from '../ui/DownloadBar'
import GenerateButton from '../ui/GenerateButton'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import { LayoutList, AlertTriangle } from 'lucide-react'

function HTML({ html }) {
  if (!html) return null
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// ── Build adjacency map from edges ──────────────────────────────
function buildGraph(nodes, edges) {
  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = n })
  const children = {}
  const parents = {}
  const edgeLabels = {}
  nodes.forEach(n => { children[n.id] = []; parents[n.id] = [] })
  edges.forEach(e => {
    if (children[e.from]) children[e.from].push(e.to)
    if (parents[e.to])   parents[e.to].push(e.from)
    edgeLabels[`${e.from}-${e.to}`] = e.label || ''
  })
  return { nodeMap, children, parents, edgeLabels }
}

// ── Node styles by type ──────────────────────────────────────────
const NODE_STYLES = {
  main: 'bg-ink-900 text-white border-ink-900 font-bold text-sm px-4 py-3 min-w-28',
  sub:  'bg-white text-ink-800 border-ink-300 text-sm px-4 py-2.5 min-w-24',
  key:  'bg-gold-500 text-ink-950 border-gold-500 font-bold text-sm px-4 py-2.5 min-w-24',
}

function ChartNode({ node, edgeLabel }) {
  return (
    <div className="flex flex-col items-center">
      {edgeLabel && (
        <div className="text-xs text-ink-400 mb-1 px-2 py-0.5 bg-ink-50 rounded-full border border-ink-100">
          {edgeLabel}
        </div>
      )}
      <div className={`rounded-xl border-2 text-center shadow-sm ${NODE_STYLES[node.type] || NODE_STYLES.sub}`}>
        <HTML html={node.label} />
        {node.hint && (
          <div className="text-xs opacity-60 mt-1 font-normal">（{node.hint}）</div>
        )}
      </div>
    </div>
  )
}

// ── Flowchart: linear left-to-right chain ────────────────────────
function FlowChart({ nodes, edges }) {
  const { nodeMap, children, edgeLabels } = buildGraph(nodes, edges)
  // Find root nodes (no parents)
  const parentSet = new Set(edges.map(e => e.to))
  const roots = nodes.filter(n => !parentSet.has(n.id))

  // Traverse and build ordered list
  const visited = new Set()
  const ordered = []
  function traverse(id) {
    if (visited.has(id)) return
    visited.add(id)
    ordered.push(id)
    ;(children[id] || []).forEach(traverse)
  }
  roots.forEach(r => traverse(r.id))
  nodes.forEach(n => traverse(n.id))

  return (
    <div className="flex flex-wrap items-center gap-2 justify-center py-4">
      {ordered.map((id, i) => {
        const node = nodeMap[id]
        if (!node) return null
        const prevId = ordered[i - 1]
        const edgeLabel = prevId ? edgeLabels[`${prevId}-${id}`] : null
        return (
          <React.Fragment key={id}>
            {i > 0 && (
              <div className="flex flex-col items-center">
                {edgeLabel && <div className="text-xs text-ink-400 mb-1">{edgeLabel}</div>}
                <div className="text-2xl text-ink-300">→</div>
              </div>
            )}
            <ChartNode node={node} />
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Tree chart: vertical hierarchy ──────────────────────────────
function TreeChart({ nodes, edges }) {
  const { nodeMap, children } = buildGraph(nodes, edges)
  const parentSet = new Set(edges.map(e => e.to))
  const roots = nodes.filter(n => !parentSet.has(n.id))

  function renderNode(id, depth = 0) {
    const node = nodeMap[id]
    if (!node) return null
    const kids = children[id] || []
    return (
      <div key={id} className="flex flex-col items-center">
        <ChartNode node={node} />
        {kids.length > 0 && (
          <>
            <div className="w-px h-4 bg-ink-300" />
            <div className="flex items-start gap-6 relative">
              {kids.length > 1 && (
                <div className="absolute top-0 left-0 right-0 h-px bg-ink-300" style={{ top: 0 }} />
              )}
              {kids.map(kid => (
                <div key={kid} className="flex flex-col items-center">
                  <div className="w-px h-4 bg-ink-300" />
                  {renderNode(kid, depth + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 py-4 overflow-x-auto">
      {roots.map(r => renderNode(r.id))}
    </div>
  )
}

// ── Timeline: horizontal with dots ──────────────────────────────
function TimelineChart({ nodes, edges }) {
  const { nodeMap, children, edgeLabels } = buildGraph(nodes, edges)
  const parentSet = new Set(edges.map(e => e.to))
  const roots = nodes.filter(n => !parentSet.has(n.id))
  const visited = new Set()
  const ordered = []
  function traverse(id) {
    if (visited.has(id)) return
    visited.add(id); ordered.push(id)
    ;(children[id] || []).forEach(traverse)
  }
  roots.forEach(r => traverse(r.id))
  nodes.forEach(n => traverse(n.id))

  return (
    <div className="relative py-8">
      {/* Horizontal line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gold-300" />
      <div className="flex justify-around relative">
        {ordered.map((id, i) => {
          const node = nodeMap[id]
          if (!node) return null
          return (
            <div key={id} className="flex flex-col items-center gap-2" style={{ maxWidth: '130px' }}>
              <div className={`text-center ${i % 2 === 0 ? 'order-first mb-2' : 'order-last mt-2'}`}>
                <ChartNode node={node} />
              </div>
              <div className="w-4 h-4 bg-gold-400 rounded-full border-2 border-white shadow z-10 relative" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Contrast: two-column comparison ─────────────────────────────
function ContrastChart({ nodes, edges }) {
  const mid = Math.ceil(nodes.length / 2)
  const leftNodes  = nodes.slice(0, mid)
  const rightNodes = nodes.slice(mid)

  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      <div className="space-y-2">
        {leftNodes.map(n => <ChartNode key={n.id} node={n} />)}
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <div className="text-3xl text-ink-300">⟺</div>
      </div>
      <div className="space-y-2 -mt-10">
        {rightNodes.map(n => <ChartNode key={n.id} node={n} />)}
      </div>
    </div>
  )
}

// ── Cycle chart ──────────────────────────────────────────────────
function CycleChart({ nodes }) {
  const count = nodes.length
  const radius = 120
  const cx = 160, cy = 160

  return (
    <div className="relative mx-auto" style={{ width: 320, height: 320 }}>
      {nodes.map((node, i) => {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2
        const x = cx + radius * Math.cos(angle)
        const y = cy + radius * Math.sin(angle)
        return (
          <div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y, maxWidth: 110 }}
          >
            <ChartNode node={node} />
          </div>
        )
      })}
      {/* Center circle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-ink-100 border-2 border-ink-300 flex items-center justify-center">
        <span className="text-ink-400 text-lg">↺</span>
      </div>
    </div>
  )
}

// ── Freeform: fallback to flowchart ─────────────────────────────
function FreeformChart({ nodes, edges }) {
  return <FlowChart nodes={nodes} edges={edges} />
}

// ── Main chart dispatcher ────────────────────────────────────────
function StructureChart({ chart }) {
  const { chartType, nodes = [], edges = [] } = chart
  const props = { nodes, edges }

  const ChartComponent = {
    flowchart: FlowChart,
    tree:      TreeChart,
    timeline:  TimelineChart,
    contrast:  ContrastChart,
    cycle:     CycleChart,
    freeform:  FreeformChart,
  }[chartType] || FlowChart

  return (
    <div className="border-2 border-ink-100 rounded-2xl bg-ink-50 p-6 overflow-x-auto">
      {chart.title && (
        <div className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-4 text-center">
          {chart.title}
        </div>
      )}
      <ChartComponent {...props} />
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────
export default function StructurePage() {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)
  const [error, setError]     = useState(null)
  const data = state.worksheetData.structureData

  async function generate() {
    if (!state.aiConfig.apiKey) { setError('請先設定 API Key'); return }
    if (!state.textConfig.content) { setError('請先輸入篇章內容'); return }
    setLoading(true); setError(null)
    try {
      const result = await callAI({
        ...state.aiConfig,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: buildStructurePrompt(state.textConfig),
        maxTokens: 65536,
      })
      const parsed = parseAIJson(result)
      dispatch({ type: 'SET_PAGE_DATA', page: 'structureData', data: parsed })
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
          <LayoutList size={14} /> 頁面四 · Structure
        </div>
        <h1 className="text-3xl font-serif font-bold text-ink-900">課文結構與主旨</h1>
        <p className="text-ink-500 mt-1">視覺化結構圖、表層意思、深層意思、主旨句鷹架</p>
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
          <DownloadBar pageId="structure-worksheet" pageName="課文結構" />

          <div id="structure-worksheet" className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 animate-fadeIn">
            <PaperHeader pageTitle="課文結構與主旨分析" />

            {/* ── 甲：視覺化結構圖 ── */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-5 pb-2 border-b border-ink-100">
                <span className="w-7 h-7 bg-ink-900 text-white rounded-lg text-sm flex items-center justify-center font-serif font-bold">甲</span>
                <h2 className="text-lg font-serif font-bold text-ink-800">課文結構圖</h2>
                {data.structureChart?.chartType && (
                  <span className="text-xs text-ink-400 bg-ink-50 border border-ink-200 px-2 py-0.5 rounded-full ml-1">
                    {{
                      flowchart: '流程圖',
                      tree:      '樹狀圖',
                      timeline:  '時間線',
                      contrast:  '對比圖',
                      cycle:     '循環圖',
                      freeform:  '結構圖',
                    }[data.structureChart.chartType] || '結構圖'}
                  </span>
                )}
              </div>

              {data.structureChart && (
                <StructureChart chart={data.structureChart} />
              )}

              {/* Fill-in hint table */}
              {data.structureChart?.nodes?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-ink-500 mb-2 uppercase tracking-wider">填寫提示</div>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-ink-50">
                        <th className="border border-ink-200 px-3 py-2 text-left w-8">#</th>
                        <th className="border border-ink-200 px-3 py-2 text-left">提示</th>
                        <th className="border border-ink-200 px-3 py-2 text-left">答案</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.structureChart.nodes.map((node, i) => (
                        <tr key={node.id} className={i % 2 === 0 ? 'bg-white' : 'bg-ink-50'}>
                          <td className="border border-ink-200 px-3 py-2 text-center text-ink-400">{i + 1}</td>
                          <td className="border border-ink-200 px-3 py-2 text-ink-500 text-xs">{node.hint}</td>
                          <td className="border border-ink-200 px-3 py-2"><HTML html={node.label} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── 乙：主旨分析（表層 + 深層） ── */}
            {data.thesis && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-5 pb-2 border-b border-ink-100">
                  <span className="w-7 h-7 bg-gold-500 text-white rounded-lg text-sm flex items-center justify-center font-serif font-bold">乙</span>
                  <h2 className="text-lg font-serif font-bold text-ink-800">主旨分析</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  {/* Surface */}
                  <div className="rounded-2xl border-2 border-blue-200 overflow-hidden">
                    <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      <div>
                        <div className="font-bold text-sm">表層意思</div>
                        <div className="text-xs opacity-80">這篇文章說了什麼？</div>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50">

                      <div className="bg-white rounded-lg p-3 text-sm border border-blue-200">
                        <div className="text-xs text-vermillion-600 font-bold mb-1">【答案】</div>
                        <HTML html={data.thesis.surface?.answer} />
                      </div>
                    </div>
                  </div>

                  {/* Deep */}
                  <div className="rounded-2xl border-2 border-emerald-200 overflow-hidden">
                    <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center gap-2">
                      <span className="text-lg">💡</span>
                      <div>
                        <div className="font-bold text-sm">深層意思</div>
                        <div className="text-xs opacity-80">
                          {data.thesis.deep?.type
                            ? `作者想表達的${data.thesis.deep.type}`
                            : '作者真正想表達什麼？'}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50">

                      <div className="bg-white rounded-lg p-3 text-sm border border-emerald-200">
                        <div className="text-xs text-vermillion-600 font-bold mb-1">【答案】</div>
                        <HTML html={data.thesis.deep?.answer} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── 丙：主旨句鷹架 ── */}
            {data.thesis?.scaffold && (
              <section>
                <div className="flex items-center gap-2 mb-5 pb-2 border-b border-ink-100">
                  <span className="w-7 h-7 bg-vermillion-600 text-white rounded-lg text-sm flex items-center justify-center font-serif font-bold">丙</span>
                  <h2 className="text-lg font-serif font-bold text-ink-800">主旨句寫作鷹架</h2>
                </div>

                {/* Scaffold template */}
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-4">
                  <div className="text-xs font-bold text-gold-700 mb-2 uppercase tracking-wider">句式框架</div>
                  <p className="text-sm font-serif leading-relaxed text-ink-700">
                    {data.thesis.scaffold.template}
                  </p>
                </div>

                {/* Student writing area */}
                <div className="text-xs font-medium text-ink-500 mb-2 uppercase tracking-wider">
                  試按上述框架，寫出本文主旨：
                </div>
                <div className="space-y-1 mb-5">
                  {[1,2,3,4].map(n => (
                    <div key={n} className="border-b border-ink-200 h-7" />
                  ))}
                </div>

                {/* Sample answers */}
                <div className="bg-ink-50 rounded-xl p-4 text-sm">
                  <div className="text-xs text-vermillion-600 font-bold mb-3">【教師版參考答案】</div>
                  <div className="space-y-3">
                    {data.thesis.scaffold.sampleAnswer1 && (
                      <div className="flex gap-2">
                        <span className="text-xs text-ink-400 flex-shrink-0 mt-0.5">範例一</span>
                        <p><HTML html={data.thesis.scaffold.sampleAnswer1} /></p>
                      </div>
                    )}
                    {data.thesis.scaffold.sampleAnswer2 && (
                      <div className="flex gap-2">
                        <span className="text-xs text-ink-400 flex-shrink-0 mt-0.5">範例二</span>
                        <p><HTML html={data.thesis.scaffold.sampleAnswer2} /></p>
                      </div>
                    )}
                  </div>
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
