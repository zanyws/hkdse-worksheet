import React from 'react'
import { useApp } from '../../context/AppContext'

export default function PaperHeader({ pageTitle }) {
  const { state } = useApp()
  const { title, author } = state.textConfig

  return (
    <div className="paper-header">
      <h1 className="font-serif">中國語文科 閱讀工作紙</h1>
      <div className="student-info font-sans">
        姓名：____________&nbsp;&nbsp;&nbsp;班別：_______（&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;）&nbsp;&nbsp;&nbsp;日期：____________
      </div>
      {title && (
        <div className="mt-2 text-sm font-serif text-ink-600">
          《{title}》{author && `— ${author}`}
          {pageTitle && <span className="ml-3 text-gold-600 font-bold">【{pageTitle}】</span>}
        </div>
      )}
    </div>
  )
}
