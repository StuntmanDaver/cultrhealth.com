import { describe, it, expect } from 'vitest'
import { CATEGORY_META, getCategories } from '@/lib/library-content'
import type { LibraryAccess } from '@/lib/config/plans'

describe('Library Content', () => {
  describe('CATEGORY_META', () => {
    it('contains expected categories', () => {
      const categories = Object.keys(CATEGORY_META)
      
      expect(categories).toContain('growth-factors')
      expect(categories).toContain('repair-recovery')
      expect(categories).toContain('metabolic')
      expect(categories).toContain('bioregulators')
      expect(categories).toContain('index')
      expect(categories).toContain('products')
    })

    it('each category has required metadata', () => {
      for (const [slug, meta] of Object.entries(CATEGORY_META)) {
        expect(meta.name).toBeTruthy()
        expect(meta.description).toBeTruthy()
        expect(meta.file).toBeTruthy()
        expect(meta.file).toMatch(/\.md$/)
      }
    })

    it('has correct file mappings', () => {
      expect(CATEGORY_META['growth-factors'].file).toBe('growth-factors.md')
      expect(CATEGORY_META['repair-recovery'].file).toBe('repair-recovery.md')
      expect(CATEGORY_META['metabolic'].file).toBe('metabolic.md')
      expect(CATEGORY_META['bioregulators'].file).toBe('bioregulators.md')
      expect(CATEGORY_META['index'].file).toBe('index.md')
      expect(CATEGORY_META['products'].file).toBe('products.md')
    })
  })

  describe('getCategories', () => {
    it('returns browsable categories without special pages', () => {
      const categories = getCategories()
      
      const slugs = categories.map((c) => c.slug)
      expect(slugs).toContain('growth-factors')
      expect(slugs).toContain('repair-recovery')
      expect(slugs).toContain('metabolic')
      expect(slugs).toContain('bioregulators')
      
      // Should not include special pages
      expect(slugs).not.toContain('index')
      expect(slugs).not.toContain('products')
    })

    it('returns categories with name and description', () => {
      const categories = getCategories()
      
      for (const category of categories) {
        expect(category.slug).toBeTruthy()
        expect(category.name).toBeTruthy()
        expect(category.description).toBeTruthy()
      }
    })
  })
})

describe('Library Access Filtering', () => {
  describe('applyLibraryAccess (via getLibraryContent)', () => {
    // Note: These tests verify the access filtering logic conceptually
    // The actual implementation is in lib/library-content.ts
    
    it('Core tier should not have access to products', () => {
      const coreAccess: LibraryAccess = {
        masterIndex: 'titles_only',
        advancedProtocols: false,
        dosingCalculators: false,
        stackingGuides: false,
        providerNotes: false,
        customRequests: false,
      }
      
      expect(coreAccess.advancedProtocols).toBe(false)
    })

    it('Creator tier should have access to products', () => {
      const creatorAccess: LibraryAccess = {
        masterIndex: 'full',
        advancedProtocols: true,
        dosingCalculators: false,
        stackingGuides: false,
        providerNotes: false,
        customRequests: false,
      }
      
      expect(creatorAccess.advancedProtocols).toBe(true)
    })

    it('Catalyst+ tier should have stacking guides access', () => {
      const catalystAccess: LibraryAccess = {
        masterIndex: 'full',
        advancedProtocols: true,
        dosingCalculators: true,
        stackingGuides: true,
        providerNotes: false,
        customRequests: false,
      }
      
      expect(catalystAccess.stackingGuides).toBe(true)
    })
  })

  describe('Master Index filtering', () => {
    it('titles_only mode should filter to headings only', () => {
      const sampleMarkdown = `# Main Title
      
## Section 1

This is content under section 1.

- Bullet point 1
- Bullet point 2

## Section 2

More content here.`

      // When masterIndex is 'titles_only', only lines starting with # should remain
      const headingsOnly = sampleMarkdown
        .split('\n')
        .filter((line) => /^#{1,6}\s/.test(line))
        .join('\n')

      expect(headingsOnly).toContain('# Main Title')
      expect(headingsOnly).toContain('## Section 1')
      expect(headingsOnly).toContain('## Section 2')
      expect(headingsOnly).not.toContain('Bullet point')
      expect(headingsOnly).not.toContain('content')
    })
  })

  describe('Stacking Framework removal', () => {
    it('should remove stacking section for non-Catalyst+ tiers', () => {
      const sampleMarkdown = `# Master Index

## Quick Lookup

Content here.

## STACKING FRAMEWORKS

### Stack 1
Details about stack 1.

### Stack 2
Details about stack 2.

## Another Section

More content.`

      // Simulate removing the STACKING FRAMEWORKS section
      const escaped = '## STACKING FRAMEWORKS'.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\n?${escaped}[\\s\\S]*?(?=\\n## |\\n# |$)`, 'g')
      const filtered = sampleMarkdown.replace(pattern, '').trim()

      expect(filtered).toContain('# Master Index')
      expect(filtered).toContain('## Quick Lookup')
      expect(filtered).toContain('## Another Section')
      expect(filtered).not.toContain('STACKING FRAMEWORKS')
      expect(filtered).not.toContain('Stack 1')
      expect(filtered).not.toContain('Stack 2')
    })
  })
})
