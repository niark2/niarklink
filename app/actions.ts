'use server'

import { supabase } from '@/app/lib/supabase'
import { revalidatePath } from 'next/cache'

/**
 * Basic alphabet for short codes (base62)
 */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function generateShortCode(length = 6): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length))
  }
  return result
}

export async function createShortLink(formData: FormData) {
  const url = formData.get('url') as string

  if (!url) {
    return { error: 'URL is required' }
  }

  if (!supabase) {
    return { error: 'Supabase non connecté. Vérifie tes variables d\'environnement.' }
  }

  try {
    // Validate URL basic structure
    new URL(url)
  } catch {
    return { error: 'Format d\'URL invalide' }
  }

  try {
    const code = generateShortCode()
    
    const { data: existing } = await supabase
      .from('links')
      .select('code')
      .eq('code', code)
      .single()

    if (existing) {
      return createShortLink(formData)
    }

    const expiresAt = formData.get('expiresAt') as string
    const password = formData.get('password') as string
    const isOneTime = formData.get('isOneTime') === 'on'

    const { error: insertError } = await supabase
      .from('links')
      .insert([{ 
        code, 
        long_url: url, 
        clicks: 0,
        expires_at: expiresAt || null,
        password: password || null,
        is_one_time: isOneTime
      }])

    if (insertError) throw insertError
    
    revalidatePath('/')
    return { code, success: true }
  } catch (error) {
    console.error('Failed to create short link:', error)
    return { error: 'Erreur lors de la création du lien. Ressaye plus tard.' }
  }
}

export async function verifyPassword(code: string, passwordSaisi: string) {
  if (!supabase) return { error: 'Erreur de connexion' }

  const { data: link, error } = await supabase
    .from('links')
    .select('long_url, password, clicks')
    .eq('code', code)
    .single()

  if (error || !link) return { error: 'Lien introuvable' }

  if (link.password === passwordSaisi) {
    // Increment clicks
    await supabase
      .from('links')
      .update({ clicks: (link.clicks || 0) + 1 })
      .eq('code', code)

    return { url: link.long_url }
  }

  return { error: 'Mot de passe incorrect' }
}

export async function getLinkStats(codes: string[]) {
  if (!supabase || codes.length === 0) return []

  const { data, error } = await supabase
    .from('links')
    .select('code, clicks')
    .in('code', codes)

  if (error || !data) return []
  return data
}
