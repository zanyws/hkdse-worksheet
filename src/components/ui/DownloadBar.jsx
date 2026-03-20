import React, { useState } from 'react'
import { Download, FileText, Globe } from 'lucide-react'
import { generatePDF } from '../../lib/pdf'
import { useApp } from '../../context/AppContext'

export default function DownloadBar({ pageId, pageName }) {
  const { state } = useApp()
  const [loading, setLoading] = useState(null)

  async function handlePDF(isTeacher) {
    const key = isTeacher ? 'pdfT' : 'pdfS'
    setLoading(key)
    try {
      await generatePDF(pageId, `${state.textConfig.title}_${pageName}`, isTeacher)
    } catch (e) {
      alert('PDF生成失敗：' + e.message)
    } finally {
      setLoading(null)
    }
  }

  function handleHTML(isTeacher) {
    const element = document.getElementById(pageId)
    if (!element) return
    
    const teacherSpans = element.querySelectorAll('.teacher-answer')
    if (!isTeacher) teacherSpans.forEach(s => s.style.display = 'none')
    
    const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${state.textConfig.title} — ${pageName}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@400;700&display=swap" rel="stylesheet">
<style>
  body { font-family: "Noto Sans TC", sans-serif; margin: 2cm; background: white; color: #221e14; }
  .paper-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  .paper-header h1 { font-family: "Noto Serif TC", serif; font-size: 1.4rem; font-weight: 700; }
  .teacher-answer { color: #dc2626; font-weight: bold; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #d9d0b8; padding: 8px 12px; }
  .fill-blank { display: inline-block; min-width: 80px; border-bottom: 1.5px solid #3a3222; }
</style>
</head>
<body>${element.outerHTML}</body>
</html>`

    if (!isTeacher) teacherSpans.forEach(s => s.style.display = '')
    
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.textConfig.title}_${pageName}_${isTeacher ? '教師版' : '學生版'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const btn = (label, icon, onClick, loadKey, color = 'ink') => (
    <button
      onClick={onClick}
      disabled={loading !== null}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${color === 'red' 
          ? 'bg-vermillion-50 text-vermillion-700 border border-vermillion-200 hover:bg-vermillion-100' 
          : 'bg-ink-50 text-ink-700 border border-ink-200 hover:bg-ink-100'}
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading === loadKey ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {label}
    </button>
  )

  return (
    <div className="no-print flex flex-wrap gap-2 p-3 bg-ink-50 border border-ink-100 rounded-xl mb-4">
      <span className="text-xs text-ink-500 self-center mr-1">📥 下載工作紙：</span>
      {btn('PDF（學生版）', <Download size={14} />, () => handlePDF(false), 'pdfS')}
      {btn('PDF（教師版）', <Download size={14} />, () => handlePDF(true), 'pdfT', 'red')}
      {btn('HTML（學生版）', <Globe size={14} />, () => handleHTML(false), null)}
      {btn('HTML（教師版）', <Globe size={14} />, () => handleHTML(true), null, 'red')}
    </div>
  )
}
