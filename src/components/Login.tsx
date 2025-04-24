import '../App.css'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

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
    <>
      <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center bg-gray-900">
        <div className="w-[30vw] h-[55vh] flex flex-col items-center justify-evenly bg-gray-800 p-4 rounded-lg shadow-lg">

          {/* Box Title */}
          <div className="w-[15vw] h-[5vh] flex items-center justify-center bg-gray-700 rounded-lg shadow-md"> 
            <h1 className="text-white text-4xl font-bold">ChatBox Login</h1>
          </div>

          {error && (
            <div className="w-[80%] p-2 bg-rose-700 text-white rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Box Email */}
          <div className="w-[80%] h-[15vh] flex flex-col items-center justify-evenly bg-gray-700 rounded-lg shadow-md">
            <h2 className='text-white text-2xl font-bold'>Email</h2>
            <input  
              type="email" 
              placeholder="Enter your email" 
              className="mt-2 p-2 rounded bg-gray-200 text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Box Password */}
          <div className="w-[80%] h-[15vh] flex flex-col items-center justify-evenly bg-gray-700 rounded-lg shadow-md">
            <h2 className='text-white text-2xl font-bold'>Password</h2>
            <input 
              type="password" 
              placeholder='*******' 
              className="mt-2 p-2 rounded bg-gray-200 text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Login Button */}
          <button 
            onClick={handleLogin}
            disabled={!isFormValid || loading}
            className={`w-[40%] py-2 text-white font-bold rounded-lg cursor-not-allowed transition duration-300 ${
              isFormValid ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' : 'bg-rose-600 hover:bg-rose-700'
            }`}>
            {loading ? 'Loading...' : 'Login'}
          </button>

          {/* Box AskToRegister */}
          <div className='w-[45%] h-[3vh] flex items-center justify-center bg-gray-800 rounded-lg shadow-md'>
            <h3 className='text-white font-bold'>Don't have an account ?</h3> &nbsp;
            <button onClick={onRegister} className="mt-2 p-2 rounded text-white cursor-pointer">Register</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
