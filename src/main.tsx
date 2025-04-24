import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Login from './components/Login.tsx'
import Register from './components/Register.tsx'
import ChatBoxPage from './components/ChatBoxPage.tsx'
import { supabase } from './lib/supabase.tsx'

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'chat'>('login')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      
      if (data.session) {
        setCurrentPage('chat')
      }
      
      setLoading(false)
    }
    
    checkSession()
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setCurrentPage('chat')
      } else if (event === 'SIGNED_OUT') {
        setCurrentPage('login')
      }
    })
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  if (loading) {
    return <div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>
  }

  return (
    <>
      {currentPage === 'login' ? (
        <Login onRegister={() => setCurrentPage('register')} />
      ) : currentPage === 'register' ? (
        <Register onBackToLogin={() => setCurrentPage('login')} />
      ) : (
        <ChatBoxPage onLogout={() => setCurrentPage('login')} />
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
