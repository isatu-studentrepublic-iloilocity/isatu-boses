// 1. Initialize Supabase
const SUPABASE_URL = 'https://gcsqmsdzwinfltqcoidb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_hUQg8acVn9ES_bK45q-urg_wO2b4lKu'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 2. DOM Elements
const loginCard = document.getElementById('login-card')
const formCard = document.getElementById('form-card')
const userEmailEl = document.getElementById('user-email')
const contentEl = document.getElementById('content')
const priorityEl = document.getElementById('priority')
const anonCheckEl = document.getElementById('anonCheck')
const insightForm = document.getElementById('insight-form')
const btnSubmit = document.getElementById('btn-submit')
const btnGoogleLogin = document.getElementById('btn-google-login')
const btnLogout = document.getElementById('btn-logout')
const messageEl = document.getElementById('response-message')
const headerLogo = document.getElementById('header-logo')

let currentUser = null
let isAlerting = false

// Hide broken logo automatically
headerLogo.addEventListener('error', () => {
  headerLogo.style.display = 'none'
})

// 3. Draft Auto-Save System
contentEl.value = localStorage.getItem('draft_content') || ''
contentEl.addEventListener('input', (e) => {
  localStorage.setItem('draft_content', e.target.value)
})

// 4. Tab-Recovery Protection (Logs out on Ctrl+Shift+T)
async function checkSessionFreshness() {
  const navEntries = performance.getEntriesByType('navigation')
  const isReload = navEntries.length > 0 && navEntries[0].type === 'reload'

  const isAuthCallback =
    window.location.hash.includes('access_token') ||
    window.location.hash.includes('error') ||
    window.location.search.includes('code=')

  if (!isReload && !isAuthCallback) {
    sessionStorage.clear()
    await supabase.auth.signOut()
    currentUser = null
  }
}
checkSessionFreshness()

// 5. Auth Listener
supabase.auth.onAuthStateChange(async (_event, session) => {
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
      currentUser = null
      renderUI()

      if (!isAlerting) {
        isAlerting = true
        alert(`Access restricted for ${authUser.email}. Please use an official ISAT U student account.`)
        setTimeout(() => { isAlerting = false }, 1000)
      }
      return
    }
  }

  currentUser = authUser
  renderUI()
})

// Render UI depending on Auth state
function renderUI() {
  if (currentUser) {
    loginCard.style.display = 'none'
    formCard.style.display = 'block'
    userEmailEl.textContent = currentUser.email
  } else {
    loginCard.style.display = 'block'
    formCard.style.display = 'none'
    userEmailEl.textContent = ''
  }
}

// 6. Auth Handlers
btnGoogleLogin.addEventListener('click', async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { prompt: 'select_account' },
    },
  })
})

btnLogout.addEventListener('click', async () => {
  await supabase.auth.signOut()
  sessionStorage.clear()
  currentUser = null
  renderUI()
})

// 7. Form Submission Handler
insightForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const content = contentEl.value.trim()
  const priority = priorityEl.value
  const isAnonymous = anonCheckEl.checked

  if (!content) return

  btnSubmit.disabled = true
  btnSubmit.textContent = 'Submitting to Portal...'
  messageEl.style.display = 'none'

  const { error } = await supabase.from('insights').insert([
    {
      content,
      priority,
      is_anonymous: isAnonymous,
      user_id: isAnonymous ? null : currentUser?.id,
    },
  ])

  btnSubmit.disabled = false
  btnSubmit.textContent = 'Submit Insight to Student Republic'

  if (error) {
    messageEl.className = 'message-banner error'
    messageEl.textContent = `Error: ${error.message}`
    messageEl.style.display = 'block'
  } else {
    messageEl.className = 'message-banner success'
    messageEl.textContent = 'Your insight has been submitted successfully!'
    messageEl.style.display = 'block'

    // Reset Form & Clear LocalStorage Draft
    contentEl.value = ''
    localStorage.removeItem('draft_content')
    priorityEl.value = 'Low'
    anonCheckEl.checked = false
  }
})