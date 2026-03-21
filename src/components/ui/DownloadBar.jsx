import React, { useState } from 'react'
import { Download, Globe, Printer } from 'lucide-react'
import { downloadHTML, printPDF, printCurrentPage } from '../../lib/download'
import { useApp } from '../../context/AppContext'

export default function DownloadBar({ pageId, pageName }) {
  const { state } = useApp()
  const [loading, setLoading] = useState(null)
  const filename = `${state.textConfig.title}_${pageName}`

  async function handle(fn, key) {
    setLoading(key)
    try { await fn() }
    catch (e) { alert('下載失敗：' + e.message) }
    finally { setLoading(null) }
  }

  const Btn = ({ label, icon: Icon, onClick, loadKey, variant = 'default', title }) => (
    <button
      onClick={() => handle(onClick, loadKey)}
      disabled={loading !== null}
      title={title}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border
        ${variant === 'red'
          ? 'bg-vermillion-50 text-vermillion-700 border-vermillion-200 hover:bg-vermillion-100'
          : variant === 'print'
            ? 'bg-ink-900 text-white border-ink-900 hover:bg-ink-800'
            : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'}
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {loading === loadKey
        ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        : <Icon size={13} />}
      {label}
    </button>
  )

  return (
    <div className="no-print flex flex-wrap items-center gap-2 p-3 bg-ink-50 border border-ink-100 rounded-xl mb-4">
      <span className="text-xs text-ink-500 mr-1">📥 下載工作紙：</span>

      {/* Print buttons — uses browser print dialog, best quality */}
      <Btn
        label="列印／PDF（學生版）"
        icon={Printer}
        onClick={() => printCurrentPage(false)}
        loadKey="printS"
        variant="print"
        title="使用瀏覽器列印對話框，選擇『另存為PDF』可獲最佳效果"
      />
      <Btn
        label="列印／PDF（教師版）"
        icon={Printer}
        onClick={() => printCurrentPage(true)}
        loadKey="printT"
        variant="red"
        title="教師版含紅色答案"
      />

      <div className="w-px h-5 bg-ink-200 mx-1" />

      {/* HTML download — uses Tailwind CDN */}
      <Btn
        label="HTML（學生版）"
        icon={Globe}
        onClick={() => downloadHTML(pageId, filename, false)}
        loadKey="htmlS"
        title="下載HTML檔案，需要網絡連接才能正確顯示排版"
      />
      <Btn
        label="HTML（教師版）"
        icon={Globe}
        onClick={() => downloadHTML(pageId, filename, true)}
        loadKey="htmlT"
        variant="red"
        title="教師版HTML，含紅色答案"
      />

      {/* Print tip */}
      <span className="text-xs text-ink-400 ml-auto hidden lg:block">
        💡 列印按鈕排版最佳，選「另存為PDF」即可
      </span>
    </div>
  )
}
