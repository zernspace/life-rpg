'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AuthForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isLogin, setIsLogin] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string
    const genre = formData.get('genre') as string || 'cyberpunk'

    let authError;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      authError = error
    } else {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { username, genre } }
      })
      authError = error
    }

    if (authError) {
      setErrorMsg(authError.message)
      setIsLoading(false)
      return
    }

    router.refresh()
  }

  async function handleJudgeBypass() {
    setIsLoading(true)
    await supabase.auth.signInWithPassword({
      email: 'judge@liferpg.com',
      password: 'hackathon2026'
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto p-6 bg-zinc-900 rounded-lg border border-zinc-800">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <input type="text" name="username" placeholder="Username" required className="p-2 rounded bg-zinc-800 text-white border border-zinc-700" />
        )}
        <input type="email" name="email" placeholder="Email" required className="p-2 rounded bg-zinc-800 text-white border border-zinc-700" />
        <input type="password" name="password" placeholder="Password" required className="p-2 rounded bg-zinc-800 text-white border border-zinc-700" />
        
        {errorMsg && <p className="text-red-500 text-sm font-bold">{errorMsg}</p>}

        <button type="submit" disabled={isLoading} className="bg-blue-600 p-2 text-white rounded font-bold disabled:opacity-50">
          {isLoading ? 'Connecting...' : (isLogin ? 'Log In' : 'Sign Up')}
        </button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-zinc-400 hover:text-white">
        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
      </button>

      <hr className="border-zinc-800" />

      <button type="button" onClick={handleJudgeBypass} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded disabled:opacity-50">
        🚀 Instant Demo (For Judges)
      </button>
    </div>
  )
}
