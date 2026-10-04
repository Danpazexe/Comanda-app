import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Login from './Login.tsx'
import './index.css'
import './services/firebase' // Initialize Firebase

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Login>
      <App />
    </Login>
  </React.StrictMode>,
)
