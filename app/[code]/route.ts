import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = (await params).code

  if (code.includes('.') || code.startsWith('_')) {
    return new Response(null, { status: 404 })
  }

  if (!supabase) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { data: link, error } = await supabase
    .from('links')
    .select('long_url, clicks, expires_at, password, is_one_time')
    .eq('code', code)
    .single()

  if (error || !link) {
    return NextResponse.redirect(new URL('/error-link?type=not-found', request.url))
  }

  // Check expiration
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/error-link?type=expired', request.url))
  }

  // Check password - redirect to verify page if present
  if (link.password) {
    return NextResponse.redirect(new URL(`/${code}/verify`, request.url))
  }

  // Handle click and potential deletion for one-time links
  if (link.is_one_time) {
    await supabase.from('links').delete().eq('code', code)
  } else {
    // Increment clicks
    await supabase
      .from('links')
      .update({ clicks: (link.clicks || 0) + 1 })
      .eq('code', code)
  }

  return NextResponse.redirect(link.long_url)
}
