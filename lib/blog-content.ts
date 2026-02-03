import { promises as fs } from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { marked } from 'marked'

// Blog post frontmatter interface
export interface BlogPostMeta {
  title: string
  category: string
  author: string
  date: string
  readTime: string
  excerpt: string
  image: string
  tags: string[]
  featured?: boolean
  slug: string
}

// Full blog post with content
export interface BlogPost extends BlogPostMeta {
  content: string
  htmlContent: string
}

// Category definitions
export const BLOG_CATEGORIES = [
  { slug: 'all', name: 'All Articles', description: 'Browse all educational content' },
  { slug: 'peptides-bioregulators', name: 'Peptides & Bioregulators', description: 'Deep dives into specific peptides and their applications' },
  { slug: 'longevity-science', name: 'Longevity Science', description: 'NAD+, senolytics, and cellular rejuvenation' },
  { slug: 'metabolic-health', name: 'Metabolic Health', description: 'GLP-1s, insulin sensitivity, and metabolic optimization' },
  { slug: 'hormone-optimization', name: 'Hormone Optimization', description: 'TRT, thyroid, and hormonal balance' },
  { slug: 'performance-recovery', name: 'Performance & Recovery', description: 'Athletic performance and recovery protocols' },
  { slug: 'lab-interpretation', name: 'Lab Interpretation', description: 'Understanding biomarkers and optimal ranges' },
] as const

export type BlogCategorySlug = typeof BLOG_CATEGORIES[number]['slug']

// Configure marked for better rendering
marked.setOptions({
  gfm: true,
  breaks: false,
})

// Get blog content directory path
function getBlogDir(): string {
  return path.join(process.cwd(), 'content', 'blog')
}

// Convert category name to slug
function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

// Calculate read time based on word count
function calculateReadTime(content: string): string {
  const wordsPerMinute = 225
  const wordCount = content.trim().split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
}

// Parse a single blog post file
async function parseBlogPost(filePath: string): Promise<BlogPost | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    // Extract slug from filename
    const slug = path.basename(filePath, '.md')

    // Validate required fields
    if (!data.title || !data.category || !data.excerpt) {
      console.warn(`Blog post ${filePath} missing required frontmatter fields`)
      return null
    }

    const htmlContent = await marked(content)

    return {
      title: data.title,
      category: data.category,
      author: data.author || 'CULTR Health Team',
      date: data.date || new Date().toISOString().split('T')[0],
      readTime: data.readTime || calculateReadTime(content),
      excerpt: data.excerpt,
      image: data.image || '/blog/default.jpg',
      tags: data.tags || [],
      featured: data.featured || false,
      slug,
      content,
      htmlContent,
    }
  } catch (error) {
    console.error(`Failed to parse blog post ${filePath}:`, error)
    return null
  }
}

// Get all blog posts
export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  const blogDir = getBlogDir()

  try {
    const files = await fs.readdir(blogDir)
    const mdFiles = files.filter(file => file.endsWith('.md'))

    const posts = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(blogDir, file)
        const post = await parseBlogPost(filePath)
        if (!post) return null

        // Return meta only (without full content)
        const { content, htmlContent, ...meta } = post
        return meta
      })
    )

    // Filter out nulls and sort by date (newest first)
    return posts
      .filter((post): post is BlogPostMeta => post !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Failed to get blog posts:', error)
    return []
  }
}

// Get blog posts by category
export async function getBlogPostsByCategory(category: BlogCategorySlug): Promise<BlogPostMeta[]> {
  const allPosts = await getAllBlogPosts()

  if (category === 'all') {
    return allPosts
  }

  return allPosts.filter(post => categoryToSlug(post.category) === category)
}

// Get featured blog posts
export async function getFeaturedBlogPosts(limit: number = 3): Promise<BlogPostMeta[]> {
  const allPosts = await getAllBlogPosts()
  return allPosts.filter(post => post.featured).slice(0, limit)
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const blogDir = getBlogDir()
  const filePath = path.join(blogDir, `${slug}.md`)

  return parseBlogPost(filePath)
}

// Get related posts (same category, excluding current)
export async function getRelatedPosts(currentSlug: string, limit: number = 3): Promise<BlogPostMeta[]> {
  const currentPost = await getBlogPostBySlug(currentSlug)
  if (!currentPost) return []

  const allPosts = await getAllBlogPosts()

  return allPosts
    .filter(post => post.slug !== currentSlug && post.category === currentPost.category)
    .slice(0, limit)
}

// Get all unique tags
export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllBlogPosts()
  const tagSet = new Set<string>()

  allPosts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag))
  })

  return Array.from(tagSet).sort()
}

// Get posts by tag
export async function getBlogPostsByTag(tag: string): Promise<BlogPostMeta[]> {
  const allPosts = await getAllBlogPosts()
  return allPosts.filter(post => post.tags.includes(tag))
}

// Check if blog directory exists and has posts
export async function blogExists(): Promise<boolean> {
  const blogDir = getBlogDir()

  try {
    const files = await fs.readdir(blogDir)
    return files.some(file => file.endsWith('.md'))
  } catch {
    return false
  }
}

// Get all post slugs (for static generation)
export async function getAllBlogSlugs(): Promise<string[]> {
  const blogDir = getBlogDir()

  try {
    const files = await fs.readdir(blogDir)
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''))
  } catch {
    return []
  }
}
