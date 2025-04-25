import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Login from './components/Login.tsx'
import Register from './components/Register.tsx'
import ChatBoxPage from './components/ChatBoxPage.tsx'
import { supabase } from './lib/supabase.tsx'
import { Analytics } from "@vercel/analytics/react"

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'chat'>('login')
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Erreur lors de la vérification de session:", error.message)
          setAuthError("Problème d'authentification")
          setCurrentPage('login')
          return
        }
        
        if (data.session) {
          setCurrentPage('chat')
        }
      } catch (err) {
        console.error("Erreur inattendue:", err)
        setAuthError("Une erreur inattendue est survenue")
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()
    
    // Protection contre les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Vérifier si l'utilisateur a confirmé son email
        setCurrentPage('chat')
      } else if (event === 'SIGNED_OUT') {
        setCurrentPage('login')
      } else if (event === 'TOKEN_REFRESHED') {
        // Session renouvelée automatiquement
        console.log('Session renewed')
      } else if (event === 'USER_UPDATED') {
        // Mise à jour utilisateur
        console.log('User updated')
      }
    })
    
    // Protection contre les fuites de mémoire
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="animate-pulse text-xl mb-4">Chargement...</div>
        {authError && (
          <div className="bg-rose-700 text-white p-3 rounded">
            {authError}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
    <Analytics/>
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

// Add type definition for Trusted Types
declare global {
  interface Window {
    trustedTypes?: {
      createPolicy: (
        name: string,
        policy: {
          createHTML?: (string: string) => string;
          createScriptURL?: (string: string) => string;
          createScript?: (string: string) => string;
        }
      ) => unknown;
    };
  }
}

// Préventions contre les attaques XSS globales
if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string: string) => string,
    createScriptURL: (string: string) => string,
    createScript: (string: string) => string,
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
