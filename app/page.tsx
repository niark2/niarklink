'use client'

import { useState, useEffect } from 'react'
import { createShortLink, getLinkStats } from './actions'
import { QRCodeCanvas } from 'qrcode.react'

interface LinkHistory {
  code: string;
  shortUrl: string;
  originalUrl: string;
  clicks: number;
  pinned: boolean;
  isOneTime?: boolean;
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [history, setHistory] = useState<LinkHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [activeQR, setActiveQR] = useState<number | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)

  // Load history & Refresh stats on mount
  useEffect(() => {
    const saved = localStorage.getItem('niarklink_history')
    if (saved) {
      try {
        const parsedHistory: LinkHistory[] = JSON.parse(saved)
        setHistory(parsedHistory)
        
        // Refresh stats for non-one-time links
        const codesToFetch = parsedHistory
          .filter(h => !h.isOneTime)
          .map(h => h.code)
          
        if (codesToFetch.length > 0) {
          getLinkStats(codesToFetch).then(stats => {
            if (stats && stats.length > 0) {
              setHistory(prev => {
                const updated = prev.map(item => {
                  const stat = stats.find(s => s.code === item.code)
                  return stat ? { ...item, clicks: stat.clicks } : item
                })
                localStorage.setItem('niarklink_history', JSON.stringify(updated))
                return updated
              })
            }
          })
        }
      } catch (e) {
        console.error('Failed to parse history')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCopiedIndex(null)
    setActiveQR(null)

    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      const result = await createShortLink(formData)
      
      if (result.error) {
        setError(result.error)
      } else if (result.code) {
        const fullShortUrl = `${window.location.origin}/${result.code}`
        const isOneTime = formData.get('isOneTime') === 'on'
        
        const newEntry: LinkHistory = { 
          code: result.code, 
          shortUrl: fullShortUrl,
          originalUrl: url,
          clicks: 0,
          pinned: false,
          isOneTime
        }
        const updatedHistory = [newEntry, ...history].slice(0, 50) // Store more now
        setHistory(updatedHistory)
        localStorage.setItem('niarklink_history', JSON.stringify(updatedHistory))
        setUrl('')
        form.reset()
      }
    } catch (err) {
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const deleteFromHistory = (code: string) => {
    const updatedHistory = history.filter(item => item.code !== code)
    setHistory(updatedHistory)
    localStorage.setItem('niarklink_history', JSON.stringify(updatedHistory))
  }

  const togglePin = (code: string) => {
    const updatedHistory = history.map(item => 
      item.code === code ? { ...item, pinned: !item.pinned } : item
    )
    setHistory(updatedHistory)
    localStorage.setItem('niarklink_history', JSON.stringify(updatedHistory))
  }

  // Sorted history: Pinned first, then by addition order
  const sortedHistory = [...history].sort((a, b) => {
    if (a.pinned === b.pinned) return 0
    return a.pinned ? -1 : 1
  })

  const visibleHistory = showAllHistory ? sortedHistory : sortedHistory.slice(0, 3)

  return (
    <main className="min-h-screen bg-[#000] text-[#ededed] flex flex-col items-center pt-24 pb-24 p-6 sm:px-24 selection:bg-white selection:text-black">
      <div className="w-full max-w-[640px] animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Logo Section */}
        <header className="mb-16 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white flex items-center justify-center rounded-[4px]">
              <div className="w-4 h-4 border-2 border-black rotate-45" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter">NIARKLINK</h1>
          </div>
          <p className="text-neutral-500 text-lg font-light tracking-tight max-w-sm mx-auto sm:mx-0">
            Raccourcisseur d'URL minimaliste pour un usage professionnel.
          </p>
        </header>

        {/* Main Input Area */}
        <section className="space-y-6">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#333] focus-within:border-[#ededed] rounded-xl transition-all duration-300 pr-2 shadow-2xl">
              <input
                id="url-input"
                type="url"
                name="url"
                required
                placeholder="Collez votre lien ici..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoComplete="off"
                className="flex-1 bg-transparent px-5 py-4 outline-none text-[16px] placeholder:text-neutral-700"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#ededed] text-black font-semibold h-[44px] px-6 rounded-lg hover:bg-white active:scale-[0.98] transition-all disabled:opacity-20 whitespace-nowrap"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  'Réduire'
                )}
              </button>
            </div>

            {/* Expandable Options */}
            <div className="mt-4 border border-[#1f1f1f] rounded-xl overflow-hidden bg-[#050505]">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="w-full flex items-center justify-between px-5 py-3 text-[12px] text-neutral-500 hover:text-neutral-300 transition-colors bg-[#0a0a0a]/50"
              >
                <div className="flex items-center gap-2">
                  <svg className={`w-3 h-3 transition-transform duration-300 ${showOptions ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Paramètres avancés</span>
                </div>
              </button>

              <div className={`grid transition-all duration-300 ${showOptions ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-5 flex flex-col gap-6 border-t border-[#1f1f1f]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="expires-at" className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Expiration</label>
                        <input
                          id="expires-at"
                          type="datetime-local"
                          name="expiresAt"
                          className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-700 transition-colors text-neutral-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="link-password" title="password" className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Protection</label>
                        <input
                          id="link-password"
                          type="password"
                          name="password"
                          placeholder="Mot de passe"
                          autoComplete="new-password"
                          className="w-full bg-black border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-800"
                        />
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input type="checkbox" name="isOneTime" className="sr-only peer" />
                        <div className="w-8 h-4 bg-[#1f1f1f] rounded-full peer peer-checked:bg-white transition-all"></div>
                        <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-neutral-600 rounded-full peer-checked:translate-x-4 peer-checked:bg-black transition-all"></div>
                      </div>
                      <span className="text-[12px] text-neutral-500 group-hover:text-neutral-300 transition-colors">Lien à usage unique (autodestruction)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-500 text-[13px] animate-in slide-in-from-top-1 px-1">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
                {error}
              </div>
            )}
          </form>

          {/* Result Area (History) */}
          <div className="space-y-3 mt-12">
            {visibleHistory.map((item, index) => (
              <div key={item.code} className={`bg-[#0a0a0a] border ${item.pinned ? 'border-neutral-700' : 'border-[#1f1f1f]'} p-4 rounded-xl animate-in slide-in-from-top-2 duration-300 group hover:border-[#333] transition-all relative`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[15px] font-mono tracking-tighter text-white overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.shortUrl.replace('http://', '').replace('https://', '')}
                      </div>
                      {item.isOneTime && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded font-bold uppercase tracking-tighter">One-Time</span>
                      )}
                      {item.pinned && (
                        <div className="w-1 h-1 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-[11px] text-neutral-600 truncate group-hover:text-neutral-400 transition-colors max-w-[200px]">
                        {item.originalUrl}
                      </div>
                      <span className="text-[10px] text-neutral-700 tabular-nums">
                        • {item.clicks} clics
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => togglePin(item.code)}
                      className={`p-1.5 rounded-lg transition-all ${item.pinned ? 'text-white' : 'text-neutral-700 hover:text-neutral-400'}`}
                      title={item.pinned ? "Désépingler" : "Épingler"}
                    >
                      <svg className="w-3.5 h-3.5" fill={item.pinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveQR(activeQR === index ? null : index)}
                      className={`p-1.5 rounded-lg transition-all ${activeQR === index ? 'bg-white text-black' : 'bg-[#1a1a1a] text-neutral-400 hover:text-white'}`}
                      title="QR Code"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => copyToClipboard(item.shortUrl, index)}
                      className="bg-[#1a1a1a] hover:bg-[#222] text-[#ededed] px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-2 active:scale-95 border border-[#222]"
                    >
                      {copiedIndex === index ? 'Copié' : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copier
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteFromHistory(item.code)}
                      className="p-1.5 rounded-lg text-neutral-800 hover:text-red-500 transition-all"
                      title="Supprimer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {activeQR === index && (
                  <div className="flex flex-col items-center pt-4 mt-4 border-t border-[#1f1f1f] animate-in zoom-in-95 duration-500">
                    <div className="bg-white p-3 rounded-lg shadow-2xl shadow-white/5">
                      <QRCodeCanvas 
                        value={item.shortUrl} 
                        size={120} 
                        level="H" 
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {history.length > 3 && (
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                className="w-full py-2 flex items-center justify-center gap-2 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors group"
              >
                <span>{showAllHistory ? 'Voir moins' : `Voir les ${history.length - 3} autres liens`}</span>
                <svg className={`w-3 h-3 transition-transform duration-300 ${showAllHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
