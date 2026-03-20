import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import {
  Settings, User, FileText, LayoutList,
  PenTool, BookOpen, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/setup',      icon: Settings,    label: '篇章設定',     sub: 'Setup',       num: '一' },
  { path: '/author',     icon: User,        label: '知人論世',     sub: 'Author',      num: '二' },
  { path: '/translation',icon: FileText,    label: '篇章語譯',     sub: 'Translation', num: '三' },
  { path: '/structure',  icon: LayoutList,  label: '課文結構',     sub: 'Structure',   num: '四' },
  { path: '/technique',  icon: PenTool,     label: '寫作手法',     sub: 'Technique',   num: '五' },
  { path: '/practice',   icon: BookOpen,    label: '鞏固練習',     sub: 'Practice',    num: '六' },
]

export default function Sidebar() {
  const { state } = useApp()
  const { title, author } = state.textConfig
  const location = useLocation()

  const hasContent = !!title

  return (
    <aside className="no-print w-64 min-h-screen bg-ink-950 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-ink-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
            <span className="text-ink-950 font-serif font-bold text-sm">文</span>
          </div>
          <div>
            <div className="text-white font-serif font-bold text-sm leading-tight">中文科工作紙</div>
            <div className="text-ink-400 text-xs">HKDSE Reading Worksheet</div>
          </div>
        </div>
      </div>

      {/* Current text info */}
      {hasContent && (
        <div className="mx-3 mt-3 p-3 bg-ink-900 rounded-lg border border-ink-700">
          <div className="text-gold-400 font-serif text-sm font-bold truncate">《{title}》</div>
          {author && <div className="text-ink-400 text-xs mt-0.5">{author}</div>}
          {state.textConfig.dynasty && (
            <div className="text-ink-500 text-xs">{state.textConfig.dynasty}</div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ path, icon: Icon, label, sub, num }) => {
          const isActive = location.pathname === path
          const isDisabled = path !== '/setup' && !hasContent

          return (
            <NavLink
              key={path}
              to={isDisabled ? '/setup' : path}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                ${isActive 
                  ? 'bg-gold-500 text-ink-950' 
                  : isDisabled 
                    ? 'text-ink-600 cursor-not-allowed opacity-50' 
                    : 'text-ink-300 hover:bg-ink-800 hover:text-white'
                }`}
              onClick={e => isDisabled && e.preventDefault()}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-serif font-bold flex-shrink-0
                ${isActive ? 'bg-ink-950/20' : 'bg-ink-800'}`}>
                {num}
              </div>
              <Icon size={14} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight">{label}</div>
                <div className={`text-xs ${isActive ? 'text-ink-800' : 'text-ink-600'}`}>{sub}</div>
              </div>
              {isActive && <ChevronRight size={12} />}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-ink-800">
        <div className="text-ink-600 text-xs leading-relaxed">
          所有資料僅儲存於您的瀏覽器
        </div>
        <div className="text-ink-700 text-xs mt-1">v1.0.0</div>
      </div>
    </aside>
  )
}
