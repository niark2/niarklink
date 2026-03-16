'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, ReactNode } from 'react'

interface ErrorTypeContent {
  title: string;
  description: string;
  icon: ReactNode;
}

const ERROR_MAP: Record<string, ErrorTypeContent> = {
  expired: {
    title: 'Lien Expiré',
    description: 'Ce lien a atteint sa date limite de validité et n\'est plus accessible.',
    icon: (
      <svg className="w-12 h-12 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  used: {
    title: 'Lien Déjà Utilisé',
    description: 'Ce lien était à usage unique et a été détruit après sa première consultation.',
    icon: (
      <svg className="w-12 h-12 text-orange-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  },
  'not-found': {
    title: 'Lien Introuvable',
    description: 'Le lien que vous essayez de consulter n\'existe pas ou a été supprimé.',
    icon: (
      <svg className="w-12 h-12 text-neutral-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'not-found'
  const content = ERROR_MAP[type] || ERROR_MAP['not-found']

  return (
    <div className="w-full max-w-sm text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 bg-[#0a0a0a] border border-[#1f1f1f] rounded-3xl flex items-center justify-center shadow-2xl">
          {content.icon}
        </div>
      </div>
      
      <h1 className="text-2xl font-bold tracking-tighter text-white mb-3">
        {content.title}
      </h1>
      
      <p className="text-neutral-500 text-sm leading-relaxed mb-10 px-4">
        {content.description}
      </p>
      
      <Link 
        href="/"
        className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-neutral-200 transition-all active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à l'accueil
      </Link>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <main className="min-h-screen bg-black text-[#ededed] flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
      <Suspense fallback={null}>
        <ErrorContent />
      </Suspense>
    </main>
  )
}
