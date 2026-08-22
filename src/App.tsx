import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState('Low')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserDomain(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserDomain(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUserDomain = async (authUser: any) => {
    if (authUser?.email) {
      const domain = authUser.email.split('@')[1]
      const validDomains = ['isatu.edu.ph', 'student.isatu.edu.ph']

      if (!validDomains.includes(domain)) {
        await supabase.auth.signOut()
        alert('Access restricted: Please use an official ISAT U Google account.')
        setUser(null)
        return
      }
    }
    setUser(authUser)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
  }
  
  const handleLogout = () => supabase.auth.signOut()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('insights').insert([
      {
        content,
        priority,
        is_anonymous: isAnonymous,
        user_id: isAnonymous ? null : user?.id,
      },
    ])

    setLoading(false)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Your insight has been submitted successfully!')
      setContent('')
      setPriority('Low')
      setIsAnonymous(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>ISAT U BOSES</h1>
      <p>Share your insights, concerns, or feedback</p>

      {!user ? (
        <button onClick={handleGoogleLogin} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Sign in with ISAT U Google Account
        </button>
      ) : (
        <div>
          <p>Logged in as: <strong>{user.email}</strong> (<span onClick={handleLogout} style={{ color: 'blue', cursor: 'pointer' }}>Logout</span>)</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Your Student Insight *</label>
              <textarea
                rows={5}
                style={{ width: '100%', padding: '10px' }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share what's on your mind..."
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Priority *</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: '8px', width: '100%' }}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />{' '}
                Submit anonymously?
              </label>
            </div>

            <button type="submit" disabled={loading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              {loading ? 'Submitting...' : 'Submit Insight'}
            </button>
          </form>

          {message && <p style={{ marginTop: '15px', color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}
        </div>
      )}
    </div>
  )
}