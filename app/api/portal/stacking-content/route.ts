import { NextResponse } from 'next/server'
import { getLibraryContent } from '@/lib/library-content'

export async function GET() {
  try {
    const html = await getLibraryContent('stack-guides')
    if (!html) {
      return NextResponse.json({ html: null }, { status: 404 })
    }
    return NextResponse.json({ html })
  } catch (error) {
    console.error('Failed to load stacking content:', error)
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 })
  }
}
