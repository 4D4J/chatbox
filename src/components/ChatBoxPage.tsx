import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

function ChatBoxPage({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<User | null>(null)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [updateMessage, setUpdateMessage] = useState<{text: string, isError: boolean} | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      
      // Set display name from user metadata if it exists
      if (data.user?.user_metadata?.display_name) {
        setDisplayName(data.user.user_metadata.display_name)
      }
    }
    
    getCurrentUser()
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          onLogout()
        } else if (session) {
          setUser(session.user)
          // Set display name from user metadata if it exists
          if (session.user?.user_metadata?.display_name) {
            setDisplayName(session.user.user_metadata.display_name)
          }
        }
      }
    )
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [onLogout])
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleOpenProfileSettings = () => {
    setShowProfileSettings(true)
    setNewEmail('')
    setNewPassword('')
    setUpdateMessage(null)
  }

  const handleCloseProfileSettings = () => {
    setShowProfileSettings(false)
  }

  const handleUpdateDisplayName = async () => {
    if (!displayName) return
    
    try {
      setLoading(true)
      setUpdateMessage(null)
      
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      })
      
      if (error) throw error
      
      setUser(data.user)
      setUpdateMessage({ text: 'Display name updated successfully!', isError: false })
    } catch (error) {
      if (error instanceof Error) {
        setUpdateMessage({ text: error.message, isError: true })
      } else {
        setUpdateMessage({ text: 'An unexpected error occurred', isError: true })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmail) return
    
    try {
      setLoading(true)
      setUpdateMessage(null)
      
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      
      if (error) throw error
      
      setUpdateMessage({ text: 'Email update request sent! Check your inbox.', isError: false })
      setNewEmail('')
    } catch (error) {
      if (error instanceof Error) {
        setUpdateMessage({ text: error.message, isError: true })
      } else {
        setUpdateMessage({ text: 'An unexpected error occurred', isError: true })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword) return
    
    try {
      setLoading(true)
      setUpdateMessage(null)
      
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) throw error
      
      setUpdateMessage({ text: 'Password updated successfully!', isError: false })
      setNewPassword('')
    } catch (error) {
      if (error instanceof Error) {
        setUpdateMessage({ text: error.message, isError: true })
      } else {
        setUpdateMessage({ text: 'An unexpected error occurred', isError: true })
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="w-[100vw] h-[100vh] flex flex-col bg-gray-900">
      <div className="w-[full] bg-gray-800 p-4 flex justify-between items-center">

        <h1 className="text-white text-2xl font-bold">ChatBox</h1>

        <div className="w-[10vw] flex items-center justify-evenly">
          <span className="text-white mr-4">{displayName || user?.email}</span>
          <button 
            onClick={handleOpenProfileSettings}
            className="bg-gray-500 cursor-pointer hover:bg-gray-700 text-white px-4 py-2 rounded mr-2"
          >
            Profile Settings
          </button>
          <button 
            onClick={handleLogout}
            className="bg-rose-600 cursor-pointer hover:bg-rose-700 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 p-4">
        {/* ChatBox */}
        <div className="bg-gray-800 w-full rounded-lg p-4 text-white">
          <p>Welcome to ChatBox! Chat functionality coming soon.</p>
        </div>
      </div>

      {/* Profile Settings */}
      {showProfileSettings && (
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
          <div className="w-[20vw] h-[30vh] bg-gray-800 rounded-lg p-6 max-w-[90%] max-h-[90vh] flex flex-col justify-between items-center overflow-y-auto">
            <div className="w-[100%] h-[full] flex justify-between items-center mb-6">

              <h2 className="text-white text-2xl font-bold">Profile Settings</h2>

              <button 
                onClick={handleCloseProfileSettings}
                className="text-gray-400 cursor-pointer hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {updateMessage && (
              <div className={`p-3 mb-4 rounded-lg ${updateMessage.isError ? 'bg-rose-700' : 'bg-emerald-700'}`}>
                {updateMessage.text}
              </div>
            )}

            {/* Update Display Name */}
            <div className="w-[100%] h-[auto] mb-6">
              <h3 className="text-white text-xl font-bold mb-2">Display Name</h3>
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="Display Name"
                  className="p-2 rounded bg-gray-700 text-white mb-2"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <button
                  onClick={handleUpdateDisplayName}
                  disabled={!displayName || loading}
                  className={`p-2 rounded text-white ${!displayName || loading ? 'bg-gray-600 cursor-pointer' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {loading ? 'Updating...' : 'Update Display Name'}
                </button>
              </div>
            </div>

            {/* Update Email */}
            <div className=" w-[100%] h-[auto] mb-6">
              <h3 className="text-white text-xl font-bold mb-2">Update Email</h3>
              <div className="flex flex-col">
                <input
                  type="email"
                  placeholder="New Email"
                  className="p-2 rounded bg-gray-700 text-white mb-2"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <button
                  onClick={handleUpdateEmail}
                  disabled={!newEmail || loading}
                  className={`p-2 rounded text-white ${!newEmail || loading ? 'bg-gray-600 cursor-pointer' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {loading ? 'Updating...' : 'Update Email'}
                </button>
              </div>
            </div>

            {/* Update Password */}
            <div className="w-[100%] h-[auto] mb-6">
              <h3 className="text-white text-xl font-bold mb-2">Update Password</h3>
              <div className="flex flex-col">
                <input
                  type="password"
                  placeholder="New Password"
                  className="p-2 rounded bg-gray-700 text-white mb-2"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  onClick={handleUpdatePassword}
                  disabled={!newPassword || loading}
                  className={`p-2 rounded text-white ${!newPassword || loading ? 'bg-gray-600 cursor-pointer' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatBoxPage