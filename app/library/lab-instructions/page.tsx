import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession, getMembershipTier } from '@/lib/auth'
import { ArrowLeft } from 'lucide-react'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

export const metadata = {
  title: 'Lab Instructions — CULTR Health',
  description: 'Everything you need to know before, during, and after your lab work. Pre-lab preparation, what to bring, results timeline, and more.',
}

export default async function LabInstructionsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/library?error=login_required')
  }

  await getMembershipTier(session.customerId, session.email)

  // Load and render markdown content
  const filePath = path.join(process.cwd(), 'content', 'library', 'lab-instructions.md')
  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { content } = matter(fileContents)
  const htmlContent = await marked(content)

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Link */}
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </Link>

        {/* Content */}
        <article
          className="prose prose-stone prose-lg max-w-none
            prose-headings:font-display
            prose-h1:text-3xl prose-h1:font-bold prose-h1:text-stone-900
            prose-h2:text-xl prose-h2:font-bold prose-h2:text-stone-900 prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:font-semibold prose-h3:text-stone-800
            prose-p:text-stone-600 prose-p:leading-relaxed
            prose-li:text-stone-600
            prose-strong:text-stone-900
            prose-a:text-teal-700 prose-a:no-underline hover:prose-a:underline
            prose-table:text-sm
            prose-th:bg-stone-100 prose-th:text-stone-700 prose-th:font-medium
            prose-td:text-stone-600
            prose-hr:border-stone-200
            prose-blockquote:border-stone-300 prose-blockquote:text-stone-600
          "
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  )
}
