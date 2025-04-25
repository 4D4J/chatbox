import '../App.css'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import AnimatedBackground from './AnimatedBackground'

function Login({ onRegister }: { onRegister: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const isFormValid = email.trim() !== '' && password.trim() !== '' && validateEmail(email)
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      if (!validateEmail(email)) {
        setError("Format d'email invalide")
        return
      }
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), 
        password: password,
      })
      
      if (error) throw error
      
      console.log('User logged in successfully')
    } catch (error) {
      if (error instanceof Error) {
        setError("Échec de connexion. Vérifiez vos identifiants.")
        console.error(error.message) 
      } else {
        setError('Une erreur inattendue est survenue')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center">
      {/* Fond animé */}
      <AnimatedBackground />
      
      <div className="max-w-[35vw] w-[30vw] min-w-[350px] max-h-[70vh] h-[auto] min-h-[50vh] flex flex-col items-center justify-evenly auth-container p-8 bg-purple-900/40">
        {/* Box Title */}
        <div className="mb-6 text-center"> 
          <h1 className="text-white text-4xl font-bold">ChatBox Login</h1>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-rose-700/80 text-white rounded-lg text-center">
            {error}
          </div>
        )}

        <form className='p-4 w-[auto] flex flex-col items-center justify-around min-h-[25vh]' onSubmit={handleLogin}>
          {/* Box Email */}
          <div className="flex flex-col items-center justify-evenly w-full min-h-[10vh]">
            <label htmlFor="email" className="block text-white text-xl font-bold mb-2">Email</label>
            <input
              id="email"  
              type="email" 
              placeholder="" 
              className="w-full rounded-lg auth-input focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Box Password */}
          <div className="mb-8 flex flex-col items-center justify-evenly w-full min-h-[10vh]">
            <label htmlFor="password" className="block text-white text-xl font-bold mb-2">Password</label>
            <input
              id="password" 
              type="password" 
              placeholder="" 
              className="w-full rounded-lg auth-input focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Login Button */}
          <button 
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full rounded-lg font-bold text-white auth-button cursor-pointer "
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
          
          <div className='text-center text-white'>
            <button
            onClick={onRegister} 
            className="ml-2 auth-link p-1 cursor-pointer rounded"
            >
            Forgot Password ?
            </button>
          </div>

        </form>

        {/* Box AskToRegister */}
        <div className="mt-6 text-center text-white">
          <span className="font-bold">Don't have an account ? </span> 
          <button 
            onClick={onRegister} 
            className="ml-2 auth-link p-1 cursor-pointer rounded"
          >
          Register
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
