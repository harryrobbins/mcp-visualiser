import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Check this import path
import './style.css' // Or your main CSS file

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)