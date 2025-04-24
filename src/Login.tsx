import './App.css'
import { useState } from 'react'

function Login({ onRegister }: { onRegister: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  const isFormValid = username.trim() !== '' && password.trim() !== ''
  
  return (
    <>
      <div className="w-[100vw] h-[100vh] flex flex-col items-center justify-center bg-gray-900">
        <div className="w-[30vw] h-[55vh] flex flex-col items-center justify-evenly bg-gray-800 p-4 rounded-lg shadow-lg">

          {/* Box Title */}
          <div className="w-[15vw] h-[5vh] flex items-center justify-center bg-gray-700 rounded-lg shadow-md"> 
            <h1 className="text-white text-4xl font-bold">ChatBox Login</h1>
          </div>

          {/* Box Username */}
          <div className="w-[80%] h-[15vh] flex flex-col items-center justify-evenly bg-gray-700 rounded-lg shadow-md">
            <h2 className='text-white text-2xl font-bold'>Username</h2>
            <input  
              type="text" 
              placeholder="Enter your username" 
              className="mt-2 p-2 rounded bg-gray-200 text-black"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Box MDP */}
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
          <button className={`w-[40%] py-2 text-white font-bold rounded-lg cursor-not-allowed disable transition duration-300 ${
            isFormValid ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer' : 'bg-rose-600 hover:bg-rose-700'
          }`}>
            Login
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
