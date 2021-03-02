import React from 'react'
import ReactDOM from 'react-dom'
import { SocketProvider } from './hooks/useSocket'
import './index.css'
import App from './App'

ReactDOM.render(
  <React.StrictMode>
    <SocketProvider url="ws://localhost:3030/ws">
      <App/>
    </SocketProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
