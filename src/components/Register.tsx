import '../App.css'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AnimatedBackground from './AnimatedBackground'

function Register({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Ajout des états pour la validation du mot de passe
  const [passwordCriteria, setPasswordCriteria] = useState({
    hasLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false
  })
  // État pour contrôler l'affichage des critères du mot de passe
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false)

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
  
  // Fonction pour vérifier les critères du mot de passe individuellement
  const checkPasswordCriteria = (password: string) => {
    setPasswordCriteria({
      hasLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password)
    });
  };
  
  // Mettre à jour les critères du mot de passe lorsque le champ est modifié
  useEffect(() => {
    checkPasswordCriteria(password);
  }, [password]);
  
  // Fonction pour calculer le score de force du mot de passe (0-100)
  const calculatePasswordStrength = () => {
    let score = 0;
    
    // Calcul basé sur les critères existants
    if (passwordCriteria.hasLength) score += 25;
    if (passwordCriteria.hasUppercase) score += 25;
    if (passwordCriteria.hasLowercase) score += 25;
    if (passwordCriteria.hasNumber) score += 25;
    
    return score;
  };
  
  // Déterminer la couleur de la barre de progression
  const getPasswordStrengthColor = () => {
    const score = calculatePasswordStrength();
    
    if (score < 50) return 'bg-red-500'; // Faible
    if (score < 100) return 'bg-yellow-500'; // Moyen
    return 'bg-green-500'; // Fort
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
    <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center">
      {/* Fond animé */}
      <AnimatedBackground />
      
      <div className="max-w-[35vw] w-[30vw] min-w-[350px] max-h-[70vh] h-[auto] min-h-[50vh] flex flex-col items-center justify-evenly auth-container bg-purple-900/40 p-8">
        {/* Box Title */}
        <div className="mb-6 text-center"> 
          <h1 className="text-white text-4xl font-bold">ChatBox Register</h1>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-rose-700/80 text-white rounded-lg text-center">
            {error} 
          </div>
        )}

        <form className='w-[auto] flex flex-col items-center justify-around min-h-[35vh]' onSubmit={handleRegister}>
          {/* Box Email */}
          <div className="pb-2 flex flex-col items-center justify-evenly ">
            <label htmlFor="email" className="pb-1 block text-white text-xl font-bold ">Email</label>
            <input
              id="email"  
              type="email" 
              placeholder="" 
              className="w-full rounded-lg auth-input focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Box Username */}
          <div className="pb-7 flex flex-col items-center justify-evenly">
            <label htmlFor="username" className="pb-1 block text-white text-xl font-bold ">Username</label>
            <input
              id="username"  
              type="text" 
              placeholder="" 
              className="w-full rounded-lg auth-input focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Box Password */}
          <div className="pb-2 flex flex-col items-center justify-evenly ">
            <label htmlFor="password" className="pb-1 block text-white text-xl font-bold ">Password</label>
            <input
              id="password" 
              type="password" 
              placeholder="" 
              className="w-full rounded-lg auth-input focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowPasswordCriteria(true)}
            />
            
            {/* Indicateurs de validation du mot de passe */}
            {(showPasswordCriteria || password.length > 0) && (
              <div className="w-full mt-2">
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`} 
                    style={{ width: `${calculatePasswordStrength()}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-300 text-right">
                  {calculatePasswordStrength() < 50 ? 'Faible' : 
                   calculatePasswordStrength() < 100 ? 'Moyen' : 
                   'Fort'}
                </p>
              </div>
            )}
          </div>

          {/* Box Confirm Password */}
          <div className="flex flex-col items-center justify-evenly mb-6">
            <label htmlFor="confirmPassword" className="pb-1 block text-white text-xl font-bold">Confirm Password</label>
            <input
              id="confirmPassword" 
              type="password" 
              placeholder="" 
              className="w-full rounded-lg auth-input focus:outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* Register Button */}
          <button 
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full rounded-lg font-bold text-white auth-button"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center text-white">
          <span className="font-bold">Already have an account ? </span> 
          <button 
            onClick={onBackToLogin} 
            className="ml-2 auth-link p-1 cursor-pointer rounded"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register