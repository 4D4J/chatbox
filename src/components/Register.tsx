import '../App.css'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Register({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validations de sécurité améliorées
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  };
  
  const validateUsername = (username: string) => {
    // Alphanumériques et underscore/tiret, 3-30 caractères
    return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
  };
  
  const getFormValidationError = () => {
    if (!email.trim()) return "L'email est requis";
    if (!validateEmail(email)) return "Format d'email invalide";
    if (!username.trim()) return "Le nom d'utilisateur est requis";
    if (!validateUsername(username)) return "Le nom d'utilisateur doit contenir 3-30 caractères alphanumériques, tirets ou underscores";
    if (!password) return "Le mot de passe est requis";
    if (!validatePassword(password)) return "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre";
    if (password !== confirmPassword) return "Les mots de passe ne correspondent pas";
    return null;
  };
  
  const isFormValid = !getFormValidationError();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = getFormValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Store display_name in user metadata
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), 
        password: password,
        options: {
          data: {
            display_name: username.trim()
          }
        }
      })
      
      if (error) throw error
      
      // Éviter de logger les informations sensibles
      console.log('User registration successful')
      alert('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.')
      onBackToLogin()
      
    } catch (error) {
      if (error instanceof Error) {
        // Message d'erreur générique pour éviter les fuites d'information
        if (error.message.includes("already")) {
          setError("Cet email est déjà utilisé")
        } else {
          setError("L'inscription a échoué. Veuillez réessayer.")
          console.error(error.message) // Log technique pour debug
        }
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
        <div className="w-[30vw] h-[80vh] flex flex-col items-center justify-evenly bg-gray-800 p-4 rounded-lg shadow-lg">

          {/* Box Title */}
          <div className="w-[15vw] h-[5vh] flex items-center justify-center bg-gray-700 rounded-lg shadow-md"> 
            <h1 className="text-white text-4xl font-bold">Register</h1>
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

          {/* Box Username */}
          <div className="w-[80%] h-[15vh] flex flex-col items-center justify-evenly bg-gray-700 rounded-lg shadow-md">
            <h2 className='text-white text-2xl font-bold'>Username</h2>
            <input 
              type="text" 
              placeholder="Choose a username" 
              className="mt-2 p-2 rounded bg-gray-200 text-black"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

          {/* Box Confirm Password */}
          <div className="w-[80%] h-[15vh] flex flex-col items-center justify-evenly bg-gray-700 rounded-lg shadow-md">
            <h2 className='text-white text-2xl font-bold'>Confirm Password</h2>
            <input 
              type="password" 
              placeholder='*******' 
              className="mt-2 p-2 rounded bg-gray-200 text-black"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* Registration Button */}
          <button 
            onClick={handleRegister}
            disabled={!isFormValid || loading}
            className={`w-[40%] py-2 text-white font-bold rounded-lg cursor-not-allowed transition duration-300 ${
              isFormValid ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' : 'bg-rose-600 hover:bg-rose-700'
            }`}>
            {loading ? 'Registering...' : 'Register'}
          </button>

          {/* Back to Login */}
          <div className='w-[45%] h-[3vh] flex items-center justify-center bg-gray-800 rounded-lg shadow-md'>
            <h3 className='text-white font-bold'>Already have an account ? </h3> &nbsp;
            <button onClick={onBackToLogin} className="mt-2 p-2 rounded text-white cursor-pointer">Login</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Register
