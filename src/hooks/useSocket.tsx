import React, { Context } from 'react'

export interface SocketState {
    error: boolean,
    connected: boolean,
    data: Object,
    sendMessage(message: Object): any,
}

const initState: SocketState = {
  error: false,
  connected: false,
  data: {},
  sendMessage: () => {}
}

const SocketContext: Context<SocketState> = React.createContext(initState)

export const useSocket = () => React.useContext(SocketContext)

export interface SocketProviderProps {
  children: React.ReactNode,
  url: string
}

export const SocketProvider = ({ children, url }: SocketProviderProps) => {
  const socket = React.useRef<WebSocket>(new WebSocket(url))
  const [data, setData] = React.useState({})
  const [error, setError] = React.useState(false)
  const [connected, setConnected] = React.useState(false)

  const sendMessage = React.useCallback(async (message: Object) => {
    return socket.current.send(JSON.stringify(message))
  }, [])

  React.useEffect(() => {
    if (!url) return
    socket.current.onopen = (ev) => {
      setConnected(true)
      console.log('open: ', ev)
    }
    socket.current.onmessage = (em) => {
      const message = JSON.parse(em.data)
      // console.log('message: ', JSON.stringify(message, null, 2))
      setData(message)
    }
    socket.current.onclose = (ec) => {
      console.log('close: ', ec)
      setConnected(false)
    }
    socket.current.onerror = (err) => {
      console.error('error: ', err)
      setConnected(false)
      setError(true)
    }
    return () => {
      socket.current.close()
    }
  }, [url])

  return (
    <SocketContext.Provider value={{
      error,
      connected,
      data,
      sendMessage
    }}>
      {children}
    </SocketContext.Provider>
  )
}
