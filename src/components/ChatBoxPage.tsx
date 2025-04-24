import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface Message {
  id: number
  user_id: string
  channel_id: number
  content: string
  created_at: string
  user: {
    email: string
    user_metadata: {
      display_name?: string
    }
  }
}

interface Channel {
  id: number
  name: string
}

function ChatBoxPage({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<User | null>(null)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [updateMessage, setUpdateMessage] = useState<{text: string, isError: boolean} | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Chat related states
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [channels] = useState<Channel[]>([
    { id: 1, name: 'Général' },
    { id: 2, name: 'Questions' },
    { id: 3, name: 'Aide' }
  ])
  const [activeChannel, setActiveChannel] = useState<number>(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      
      
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

  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  
  useEffect(() => {
    
    const getLocalMessages = (channelId: number) => {
      const localMessages: Message[] = []
      
      if (channelId === 1) {
        localMessages.push({
          id: 1,
          user_id: 'system',
          channel_id: 1,
          content: ' Bienvenue dans le canal général!',
          created_at: new Date().toISOString(),
          user: { email: 'system@example.com', user_metadata: { display_name: 'Système' } }
        })
      } else if (channelId === 2) {
        localMessages.push({
          id: 2,
          user_id: 'system',
          channel_id: 2,
          content: ' Posez vos questions ici!',
          created_at: new Date().toISOString(),
          user: { email: 'system@example.com', user_metadata: { display_name: 'Système' } }
        })
      } else if (channelId === 3) {
        localMessages.push({
          id: 3,
          user_id: 'system',
          channel_id: 3,
          content: ' Besoin d\'aide? C\'est le bon endroit!',
          created_at: new Date().toISOString(),
          user: { email: 'system@example.com', user_metadata: { display_name: 'Système' } }
        })
      }
      
      
      const storedMessages = localStorage.getItem(`channel_${channelId}_messages`)
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages) as Message[]
        localMessages.push(...parsedMessages)
      }
      
      return localMessages
    }
    
    
    setMessages(getLocalMessages(activeChannel))
  }, [activeChannel])

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !user) return
    
    
    const newMessage: Message = {
      id: Date.now(), 
      user_id: user.id,
      channel_id: activeChannel,
      content: inputMessage.trim(),
      created_at: new Date().toISOString(),
      user: {
        email: user.email || '',
        user_metadata: {
          display_name: displayName || user.email?.split('@')[0] || ''
        }
      }
    }
    
    
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    
    
    const storedMessages = updatedMessages.filter(msg => msg.user_id !== 'system')
    localStorage.setItem(`channel_${activeChannel}_messages`, JSON.stringify(storedMessages))
    
    
    setInputMessage('')
  }

  const handleChannelSelect = (channelId: number) => {
    setActiveChannel(channelId)
  }

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
      <div className="w-[100%] bg-gray-800 p-4 flex justify-between items-center">

        <h1 className="text-white text-2xl font-bold">ChatBox</h1>

        <div className="flex items-center justify-evenly">
          <span className="text-white mr-4">{displayName || user?.email}</span>
          <button 
            onClick={handleOpenProfileSettings}
            className="bg-gray-500 cursor-pointer hover:bg-gray-700 text-white px-4 py-2 rounded mr-2"
          >
            Paramètres
          </button>
          <button 
            onClick={handleLogout}
            className="bg-rose-600 cursor-pointer hover:bg-rose-700 text-white px-4 py-2 rounded"
          >
            Déconnexion
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 p-4">
        {/* ChatBox */}
        <div className="w-[100%] bg-gray-800 flex flex-row items-center justify-around p-4 text-white">

            {/* Liste des canaux */}
            <div className='w-[20vw] h-[95%] bg-gray-700 p-4 rounded-lg shadow-md mr-4 border border-white flex flex-col'>
                <h2 className="text-xl font-bold mb-4 border-b pb-2">Canaux</h2>
                <div className="flex-1 overflow-y-auto mb-4">
                    {channels.map(channel => (
                        <div 
                            key={channel.id}
                            onClick={() => handleChannelSelect(channel.id)}
                            className={`p-2 mb-1 rounded cursor-pointer ${activeChannel === channel.id ? 'bg-gray-600 font-bold' : 'hover:bg-gray-600'}`}
                        >
                            # {channel.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat en direct */}
            <div className='w-[65vw] h-[95%] bg-gray-800 p-4 rounded-lg shadow-md border border-white flex flex-col'>
                {/* Nom du canal */}
                <div className="pb-2 mb-4 border-b border-gray-600">
                    <h2 className="text-xl font-bold">
                        #{channels.find(c => c.id === activeChannel)?.name || 'Canal'}
                    </h2>
                </div>
                
                {/* Zone d'affichage des messages */}
                <div className="flex-1 overflow-y-auto mb-4 p-2">
                    {messages.length === 0 ? (
                        <div className="text-gray-400 text-center mt-10">
                            Pas encore de messages dans ce canal. Commencez la conversation!
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id} className="mb-2">
                                <span className={`font-bold ${message.user_id === user?.id ? 'text-green-400' : 'text-blue-400'}`}>
                                    {message.user?.user_metadata?.display_name || message.user?.email?.split('@')[0] || 'Inconnu'}: 
                                </span>
                                <span className="text-white ml-1"> {message.content}</span>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Zone de saisie des messages */}
                <div className="flex mt-auto">
                    <input
                        type="text"
                        placeholder="Tapez un message..."
                        className="flex-1 p-2 rounded-l bg-gray-700 text-white"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                        onClick={handleSendMessage}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r"
                    >
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Paramètres du profil */}
      {showProfileSettings && (
        <div className="w-[auto] h-[auto] max-w-[100%] fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
          <div className="w-[20vw] h-[30vh] bg-gray-800 rounded-lg p-6 flex flex-col justify-between items-center overflow-y-auto">
            <div className="w-[100%] h-[100%] flex justify-between items-center mb-6">

              <h2 className="text-white text-2xl font-bold">Paramètres du profil</h2>

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

            {/* Mise à jour du nom d'affichage */}
            <div className="w-[100%] h-[auto] mb-6">
              <h3 className="text-white text-xl font-bold mb-2">Nom d'affichage</h3>
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="Nom d'affichage"
                  className="p-2 rounded bg-gray-700 text-white mb-2"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <button
                  onClick={handleUpdateDisplayName}
                  disabled={!displayName || loading}
                  className={`p-2 rounded text-white ${!displayName || loading ? 'bg-gray-600 cursor-pointer' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {loading ? 'Mise à jour...' : 'Mettre à jour le nom'}
                </button>
              </div>
            </div>

            {/* Mise à jour de l'email */}
            <div className=" w-[100%] h-[auto] mb-6">
              <h3 className="text-white text-xl font-bold mb-2">Mise à jour de l'email</h3>
              <div className="flex flex-col">
                <input
                  type="email"
                  placeholder="Nouvel email"
                  className="p-2 rounded bg-gray-700 text-white mb-2"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <button
                  onClick={handleUpdateEmail}
                  disabled={!newEmail || loading}
                  className={`p-2 rounded text-white ${!newEmail || loading ? 'bg-gray-600 cursor-pointer' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {loading ? 'Mise à jour...' : 'Mettre à jour l\'email'}
                </button>
              </div>
            </div>

            {/* Mise à jour du mot de passe */}
            <div className="w-[100%] h-[auto] mb-6">
              <h3 className="text-white text-xl font-bold mb-2">Mise à jour du mot de passe</h3>
              <div className="flex flex-col">
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  className="p-2 rounded bg-gray-700 text-white mb-2"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  onClick={handleUpdatePassword}
                  disabled={!newPassword || loading}
                  className={`p-2 rounded text-white ${!newPassword || loading ? 'bg-gray-600 cursor-pointer' : 'bg-gray-600 hover:bg-gray-700'}`}
                >
                  {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
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