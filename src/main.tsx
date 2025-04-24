import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Login from './Login.tsx'
import Register from './components/Register.tsx'

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login')

  return (
    <>
      {currentPage === 'login' ? (
        <Login onRegister={() => setCurrentPage('register')} />
      ) : (
        <Register onBackToLogin={() => setCurrentPage('login')} />
      )}
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
