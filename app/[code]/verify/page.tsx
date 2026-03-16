'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { verifyPassword } from '@/app/actions'

export default function VerifyPage() {
  const { code } = useParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await verifyPassword(code as string, password)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.url) {
      window.location.href = result.url
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <h1 className="text-xl font-medium tracking-tight mb-2">Lien Protégé</h1>
          <p className="text-neutral-500 text-sm">Ce lien nécessite un mot de passe.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            id="verify-password"
            type="password"
            required
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 outline-none focus:border-neutral-500 transition-colors placeholder:text-neutral-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? 'Vérification...' : 'Accéder au lien'}
          </button>
          
          {error && (
            <p className="text-sm text-red-500 text-center animate-in fade-in duration-300">
              {error}
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
