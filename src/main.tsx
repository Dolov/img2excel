import React from 'react'
import ReactDOM from 'react-dom/client'
// @ts-ignore
import * as buildInfo from '~build/info'
import App from './App.tsx'
import './index.less'

// @ts-ignore
window.buildInfo = buildInfo

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
