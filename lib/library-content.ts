import { promises as fs } from 'fs'
import path from 'path'
import { marked } from 'marked'
import type { LibraryAccess } from '@/lib/config/plans'

// Category metadata mapping
export const CATEGORY_META: Record<string, { name: string; description: string; file: string }> = {
  'growth-factors': {
    name: 'Growth Factors & Anabolic Peptides',
    description: 'Muscle building, strength enhancement, hypertrophy, performance, and fat-free mass gain',
    file: 'growth-factors.md',
  },
  'repair-recovery': {
    name: 'Repair & Recovery Peptides',
    description: 'Tissue repair, tendon/ligament healing, wound recovery, collagen support',
    file: 'repair-recovery.md',
  },
  'metabolic': {
    name: 'Metabolic & Weight Loss Peptides',
    description: 'Fat loss, appetite control, GLP-1 agonists, metabolic health, body recomposition',
    file: 'metabolic.md',
  },
  'bioregulators': {
    name: 'Bioregulators & Neuropeptides',
    description: 'Immune support, sleep, cognition, anti-aging, thymic peptides',
    file: 'bioregulators.md',
  },
  'index': {
    name: 'Master Index',
    description: 'Complete product listing with quick lookup by category and use case',
    file: 'index.md',
  },
  'products': {
    name: 'Full Product Catalog',
    description: 'Comprehensive peptide library with detailed protocol cards and deep-dive information',
    file: 'products.md',
  },
  'stack-guides': {
    name: 'Stack Guides',
    description: 'Goal-based protocol stacks by persona — athlete, weight loss, focus, skin, biohacker & more',
    file: 'stack-guides.md',
  },
}

// Configure marked for better rendering
marked.setOptions({
  gfm: true,
  breaks: false,
})

// Get content directory path
function getContentDir(): string {
  return path.join(process.cwd(), 'content', 'library')
}

// Read and parse markdown content for a category
export async function getLibraryContent(
  category: string,
  access?: LibraryAccess
): Promise<string | null> {
  const meta = CATEGORY_META[category]
  if (!meta) {
    return null
  }

  const contentDir = getContentDir()
  const filePath = path.join(contentDir, meta.file)

  try {
    const markdown = await fs.readFile(filePath, 'utf-8')
    const filteredMarkdown = applyLibraryAccess(category, markdown, access)
    if (!filteredMarkdown) {
      return null
    }
    const html = await marked(filteredMarkdown)
    return html
  } catch (error) {
    console.error(`Failed to read library content for ${category}:`, error)
    return null
  }
}

function applyLibraryAccess(
  category: string,
  markdown: string,
  access?: LibraryAccess
): string | null {
  if (!access) return markdown

  if (category === 'products' && !access.advancedProtocols) {
    return null
  }

  if (category === 'stack-guides' && !access.stackingGuides) {
    return null
  }

  if (category === 'index') {
    if (access.masterIndex === 'titles_only') {
      return markdown
        .split('\n')
        .filter((line) => /^#{1,6}\s/.test(line))
        .join('\n')
    }

    if (!access.stackingGuides) {
      return removeSection(markdown, '## STACKING FRAMEWORKS')
    }
  }

  return markdown
}

function removeSection(markdown: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\n?${escaped}[\\s\\S]*?(?=\\n## |\\n# |$)`, 'g')
  return markdown.replace(pattern, '').trim()
}

// Get all available categories (excludes special pages like index and products)
export function getCategories(): Array<{ slug: string; name: string; description: string }> {
  const specialPages = ['index', 'products', 'stack-guides']
  return Object.entries(CATEGORY_META)
    .filter(([slug]) => !specialPages.includes(slug))
    .map(([slug, meta]) => ({
      slug,
      name: meta.name,
      description: meta.description,
    }))
}

// Check if content exists for a category
export async function contentExists(category: string): Promise<boolean> {
  const meta = CATEGORY_META[category]
  if (!meta) {
    return false
  }

  const contentDir = getContentDir()
  const filePath = path.join(contentDir, meta.file)

  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
