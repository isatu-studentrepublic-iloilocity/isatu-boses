import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState('Low')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Safety flag to prevent infinite alert loops
  const isAlertingRef = useRef(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null

      if (authUser?.email) {
        const domain = authUser.email.split('@')[1]?.toLowerCase()
        const validDomains = ['isatu.edu.ph', 'student.isatu.edu.ph', 'students.isatu.edu.ph']

        if (!validDomains.includes(domain)) {
          // 1. Wipe OAuth tokens from address bar to break reload loops
          if (window.location.hash || window.location.search) {
            window.history.replaceState(null, '', window.location.pathname)
          }

          // 2. Clear authentication session
          await supabase.auth.signOut()
          localStorage.clear()
          setUser(null)

          // 3. Trigger alert once
          if (!isAlertingRef.current) {
            isAlertingRef.current = true
            alert(`Access restricted for ${authUser.email}. Please use an official ISAT U account.`)
            setTimeout(() => {
              isAlertingRef.current = false
            }, 1000)
          }
          return
        }
      }

      setUser(authUser)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    setUser(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    setMessage(null)

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
      setMessage({ type: 'error', text: `Error: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: 'Your insight has been submitted successfully!' })
      setContent('')
      setPriority('Low')
      setIsAnonymous(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", color: '#334155', paddingBottom: '40px' }}>
      
      {/* Top Banner Header */}
      <header style={{ 
        backgroundColor: '#0F172A', 
        borderBottom: '4px solid #D97706', 
        padding: '20px', 
        color: '#FFFFFF', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <img 
            src="/logo.png" 
            alt="ISAT U Logo" 
            style={{ width: '42px', height: '42px', objectFit: 'contain' }} 
            onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
          />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, letterSpacing: '1px' }}>
            ISAT U BOSES
          </h1>
        </div>
        <p style={{ margin: '6px 0 0', color: '#94A3B8', fontSize: '14px', textAlign: 'center' }}>
          Official Student Voice & Feedback Platform
        </p>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '640px', margin: '30px auto 0', padding: '0 20px' }}>
        {!user ? (
          
          /* Login Card */
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '36px 28px', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '20px', color: '#0F172A' }}>Welcome, Tradean!</h2>
            <p style={{ margin: '0 0 24px', color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>
              Please sign in with your official ISAT university email account to submit feedback or raise concerns to the ISAT U - Student Republic.
            </p>
            <button
              onClick={handleGoogleLogin}
              style={{
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'background-color 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#FF3D00" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                <path fill="#4CAF50" d="M12 19c-3 0-5.5-2.2-6.4-5.2L1.9 16.7C3.7 20.4 7.5 23 12 23c2.9 0 5.4-.9 7.3-2.6l-3.5-2.9c-1 .7-2.3 1.5-3.8 1.5z"/>
                <path fill="#1976D2" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.5 2.9c2.1-1.9 3.4-4.8 3.4-8.8z"/>
                <path fill="#FFC107" d="M5.6 13.8c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1L1.9 6.7C.7 9.1 0 11.9 0 14.9s.7 5.8 1.9 8.2l3.7-2.9z"/>
              </svg>
              Sign in with ISAT U Google Account
            </button>
          </div>

        ) : (

          /* Form Card */
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '32px 28px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)', border: '1px solid #E2E8F0' }}>
            
            {/* User Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>
                Signed in as: <strong style={{ color: '#0F172A' }}>{user.email}</strong>
              </span>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                Logout
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* Textarea */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#0F172A' }}>
                  Your Student Insight / Concern 
                </label>
                <textarea
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your suggestion, concern, or feedback in detail..."
                  required
                />
              </div>

              {/* Priority Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#0F172A' }}>
                  Priority Level 
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Low" style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>Low - General Feedback / Suggestion</option>
                  <option value="Medium" style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>Medium - Issue Needing Attention</option>
                  <option value="High" style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>High - Urgent / Critical Concern</option>
                </select>
              </div>

              {/* Anonymous Checkbox */}
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0F172A' }}
                />
                <label htmlFor="anonCheck" style={{ fontSize: '14px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                  Submit anonymously (Hides your identity from admins)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  backgroundColor: loading ? '#94A3B8' : '#0F172A',
                  color: '#FFFFFF',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Insight'}
              </button>
            </form>

            {/* Response Alerts */}
            {message && (
              <div style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: message.type === 'error' ? '#FEF2F2' : '#F0FDF4',
                color: message.type === 'error' ? '#991B1B' : '#166534',
                border: `1px solid ${message.type === 'error' ? '#FCA5A5' : '#86EFAC'}`
              }}>
                {message.text}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}