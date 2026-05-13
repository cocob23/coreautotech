import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Error desconocido',
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', padding: 24, background: '#0a0a0a', color: '#fff' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Se produjo un error en la app</h1>
          <p style={{ opacity: 0.9, marginBottom: 8 }}>Revisa la consola del navegador para ver el stack.</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#111', padding: 12, borderRadius: 8 }}>
            {this.state.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
)
