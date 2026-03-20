import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { savePreference, getPreference } from '../lib/db'

const AppContext = createContext(null)

const initialState = {
  textConfig: {
    title: '',
    author: '',
    dynasty: '',
    genre: '',
    content: '',
    analysis: '',
    ocrSource: 'manual',
  },
  aiConfig: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    baseUrl: '',
  },
  worksheetData: {
    authorData: null,
    translationData: null,
    structureData: null,
    techniqueData: null,
    practiceData: null,
    lastUpdated: null,
  },
  generatingPage: null,
  currentWorksheetId: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TEXT_CONFIG':
      return { ...state, textConfig: { ...state.textConfig, ...action.payload } }
    case 'SET_AI_CONFIG':
      return { ...state, aiConfig: { ...state.aiConfig, ...action.payload } }
    case 'SET_PAGE_DATA':
      return {
        ...state,
        worksheetData: {
          ...state.worksheetData,
          [action.page]: action.data,
          lastUpdated: new Date(),
        }
      }
    case 'SET_GENERATING':
      return { ...state, generatingPage: action.page }
    case 'SET_WORKSHEET_ID':
      return { ...state, currentWorksheetId: action.id }
    case 'LOAD_WORKSHEET':
      return { ...state, ...action.payload }
    case 'RESET':
      return { ...initialState, aiConfig: state.aiConfig }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load saved API config on mount
  useEffect(() => {
    async function loadSaved() {
      try {
        const savedApiConfig = await getPreference('aiConfig')
        if (savedApiConfig) {
          dispatch({ type: 'SET_AI_CONFIG', payload: savedApiConfig })
        }
      } catch (e) {
        console.error('Failed to load preferences:', e)
      }
    }
    loadSaved()
  }, [])

  // Save API config when changed
  useEffect(() => {
    if (state.aiConfig.apiKey) {
      savePreference('aiConfig', state.aiConfig).catch(console.error)
    }
  }, [state.aiConfig])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
