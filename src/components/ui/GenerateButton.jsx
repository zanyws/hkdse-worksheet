import React from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

export default function GenerateButton({ onClick, loading, hasData, label = '生成工作紙' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`group flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm
        transition-all duration-200 shadow-sm
        ${loading 
          ? 'bg-gold-100 text-gold-600 cursor-not-allowed' 
          : hasData 
            ? 'bg-ink-100 text-ink-700 hover:bg-ink-200 border border-ink-200' 
            : 'bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700 shadow-gold-200'
        }`}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          正在生成中…
        </>
      ) : hasData ? (
        <>
          <RefreshCw size={15} className="group-hover:rotate-180 transition-transform duration-300" />
          重新生成
        </>
      ) : (
        <>
          <Sparkles size={15} />
          {label}
        </>
      )}
    </button>
  )
}
