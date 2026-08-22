import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  // 1. Load saved draft directly from localStorage on startup
  const [content, setContent] = useState(() => {
    return localStorage.getItem('draft_content') || ''
  })

  const [priority, setPriority] = useState('Low')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isAlertingRef = useRef(false)

  // 2. Direct handler to immediately save to localStorage as you type
  const handleContentChange = (value: string) => {
    setContent(value)
    localStorage.setItem('draft_content', value)
  }

  // 3. Tab-Recovery Protection (Logs user out if tab is reopened with Ctrl+Shift+T)
  useEffect(() => {
    const checkSessionFreshness = async () => {
      // Detect if page was reloaded via F5 / Ctrl+R
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      const isReload = navEntries.length > 0 && navEntries[0].type === 'reload'

      // Detect if returning from Google OAuth redirect
      const isAuthCallback =
        window.location.hash.includes('access_token') ||
        window.location.hash.includes('error') ||
        window.location.search.includes('code=')

      // If NOT a reload and NOT an auth callback, force logout (handles Ctrl+Shift+T)
      if (!isReload && !isAuthCallback) {
        sessionStorage.clear()
        await supabase.auth.signOut()
        setUser(null)
      }
    }

    checkSessionFreshness()
  }, [])

  // 4. Supabase Auth Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null

      if (authUser?.email) {
        const domain = authUser.email.split('@')[1]?.toLowerCase()
        const validDomains = ['isatu.edu.ph', 'student.isatu.edu.ph', 'students.isatu.edu.ph']

        if (!validDomains.includes(domain)) {
          if (window.location.hash || window.location.search) {
            window.history.replaceState(null, '', window.location.pathname)
          }

          await supabase.auth.signOut()
          sessionStorage.clear()
          setUser(null)

          if (!isAlertingRef.current) {
            isAlertingRef.current = true
            alert(`Access restricted for ${authUser.email}. Please use an official ISAT U student account.`)
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
    sessionStorage.clear()
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
      
      // Clear draft only after successful submission
      setContent('')
      localStorage.removeItem('draft_content')
      
      setPriority('Low')
      setIsAnonymous(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#F1F5F9', minHeight: '100vh', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: '#0F172A', paddingBottom: '60px' }}>
      
      {/* Top Gold Stripe Accent */}
      <div style={{ height: '5px', backgroundColor: '#D97706', width: '100%' }} />

      {/* Main Branding Header */}
      <header style={{ 
        backgroundColor: '#0F172A', 
        padding: '24px 20px', 
        color: '#FFFFFF', 
        borderBottom: '1px solid #1E293B',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <img 
            src="/logo.png" 
            alt="ISAT U SR Logo" 
            style={{ width: '52px', height: '52px', objectFit: 'contain' }} 
            onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#F59E0B', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(217, 119, 6, 0.3)', letterSpacing: '0.5px', marginBottom: '4px' }}>
              ILOILO CITY CAMPUS — STUDENT REPUBLIC
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '0.5px', color: '#FFFFFF' }}>
              ISAT U BOSES
            </h1>
            <p style={{ margin: '2px 0 0', color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>
              Official Student Feedback & Concern Portal
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '600px', margin: '36px auto 0', padding: '0 16px' }}>
        
        {!user ? (
          
          /* Login Card */
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '16px', 
            padding: '40px 32px', 
            textAlign: 'center', 
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)', 
            border: '1px solid #E2E8F0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#0F172A' }} />
            
            <div style={{ width: '48px', height: '48px', backgroundColor: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #E2E8F0' }}>
              <svg width="24" height="24" fill="none" stroke="#0F172A" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
              Student Authentication Required
            </h2>
            <p style={{ margin: '0 0 28px', color: '#64748B', fontSize: '14px', lineHeight: '1.6' }}>
              Please sign in using your official university Google account (<code style={{ backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', color: '#0F172A' }}>@students.isatu.edu.ph</code>) to access the submission portal.
            </p>

            <button
              onClick={handleGoogleLogin}
              style={{
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                border: '1px solid #1E293B',
                borderRadius: '10px',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: '100%',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#FF3D00" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                <path fill="#4CAF50" d="M12 19c-3 0-5.5-2.2-6.4-5.2L1.9 16.7C3.7 20.4 7.5 23 12 23c2.9 0 5.4-.9 7.3-2.6l-3.5-2.9c-1 .7-2.3 1.5-3.8 1.5z"/>
                <path fill="#1976D2" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.5 2.9c2.1-1.9 3.4-4.8 3.4-8.8z"/>
                <path fill="#FFC107" d="M5.6 13.8c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1L1.9 6.7C.7 9.1 0 11.9 0 14.9s.7 5.8 1.9 8.2l3.7-2.9z"/>
              </svg>
              Sign in with ISAT U Google Account
            </button>
          </div>

        ) : (

          /* Submission Form Card */
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '16px', 
            padding: '32px 28px', 
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)', 
            border: '1px solid #E2E8F0' 
          }}>
            
            {/* Authenticated User Status Bar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px', 
              padding: '12px 16px', 
              backgroundColor: '#F8FAFC', 
              borderRadius: '10px', 
              border: '1px solid #E2E8F0' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%' }} />
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                  <strong style={{ color: '#0F172A' }}>{user.email}</strong>
                </span>
              </div>
              <button 
                onClick={handleLogout} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#DC2626', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                Sign Out
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              
              {/* Textarea */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#0F172A' }}>
                  Insight / Concern Description <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="State your feedback, issue, or proposition clearly..."
                  required
                />
              </div>

              {/* Priority Select */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#0F172A' }}>
                  Priority Level <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="Low" style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>Low — General Feedback / Suggestion</option>
                  <option value="Medium" style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>Medium — Standard Concern Needing Action</option>
                  <option value="High" style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>High — Urgent / Critical Campus Concern</option>
                </select>
              </div>

              {/* Anonymous Checkbox */}
              <div style={{ marginBottom: '24px', padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0F172A' }}
                />
                <label htmlFor="anonCheck" style={{ fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: 500, userSelect: 'none' }}>
                  Submit Anonymously (Identity hidden from administrators)
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
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'Submitting to Portal...' : 'Submit Insight to Student Republic'}
              </button>
            </form>

            {/* Response Banner */}
            {message && (
              <div style={{
                marginTop: '20px',
                padding: '14px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 500,
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

      {/* Footer Branding */}
      <footer style={{ textAlign: 'center', marginTop: '40px', color: '#94A3B8', fontSize: '12px' }}>
        Iloilo Science and Technology University — Student Republic Portal
      </footer>
    </div>
  )
}