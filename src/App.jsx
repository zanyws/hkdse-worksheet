import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import MainLayout from './components/layout/MainLayout'
import SetupPage from './components/pages/SetupPage'
import AuthorPage from './components/pages/AuthorPage'
import TranslationPage from './components/pages/TranslationPage'
import StructurePage from './components/pages/StructurePage'
import TechniquePage from './components/pages/TechniquePage'
import PracticePage from './components/pages/PracticePage'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/setup" replace />} />
            <Route path="setup"       element={<SetupPage />} />
            <Route path="author"      element={<AuthorPage />} />
            <Route path="translation" element={<TranslationPage />} />
            <Route path="structure"   element={<StructurePage />} />
            <Route path="technique"   element={<TechniquePage />} />
            <Route path="practice"    element={<PracticePage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
