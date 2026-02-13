import { Metadata } from 'next';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { getAllBlogPosts, BLOG_CATEGORIES, type BlogPostMeta } from '@/lib/blog-content';
import { ArrowRight, BookOpen, Clock, Calendar } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Science Blog — CULTR Health',
  description: 'Evidence-based articles on peptides, longevity science, metabolic health, and hormone optimization. Learn the science behind health optimization.',
};

// Category filter component
function CategoryFilter({ activeCategory }: { activeCategory: string }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {BLOG_CATEGORIES.map((category) => (
        <Link
          key={category.slug}
          href={category.slug === 'all' ? '/science' : `/science?category=${category.slug}`}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${activeCategory === category.slug
              ? 'bg-cultr-forest text-white'
              : 'bg-cultr-offwhite text-cultr-text hover:bg-cultr-sage'
            }
          `}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

// Blog card component
function BlogCard({ post, index }: { post: BlogPostMeta; index: number }) {
  return (
    <ScrollReveal delay={index * 100} direction="up">
      <Link href={`/science/${post.slug}`} className="group block h-full">
        <article className="h-full bg-white rounded-2xl border border-cultr-sage overflow-hidden hover:border-cultr-forest/40 hover:shadow-lg transition-all duration-300">
          {/* Image placeholder */}
          <div className="aspect-[16/9] bg-gradient-to-br from-cultr-mint to-cultr-sage relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-cultr-forest/30" />
            </div>
            {/* Category badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-cultr-forest text-white text-xs font-display font-medium rounded-full">
                {post.category}
              </span>
            </div>
            {/* Featured badge */}
            {post.featured && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-cultr-copper text-white text-xs font-display font-medium rounded-full">
                  Featured
                </span>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-display font-bold text-cultr-text mb-3 group-hover:text-cultr-forest transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-cultr-textMuted text-sm mb-4 line-clamp-3">
              {post.excerpt}
            </p>
            
            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-cultr-textMuted">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.readTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            
            {/* Read more link */}
            <div className="mt-4 flex items-center text-cultr-forest text-sm font-medium group-hover:gap-2 transition-all">
              <span>Read article</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </article>
      </Link>
    </ScrollReveal>
  );
}

export default async function SciencePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || 'all';
  
  // Get all posts
  const allPosts = await getAllBlogPosts();
  
  // Filter by category if specified
  const filteredPosts = activeCategory === 'all'
    ? allPosts
    : allPosts.filter(post => {
        const categorySlug = post.category
          .toLowerCase()
          .replace(/&/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim();
        return categorySlug === activeCategory;
      });
  
  // Get featured posts for the hero section
  const featuredPosts = allPosts.filter(post => post.featured).slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-24 md:py-32 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal direction="none" duration={800}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Evidence-based health education
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} direction="none" duration={800}>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Deep dives into peptides, longevity science, metabolic health, and optimization protocols. 
              Written by experts, backed by research.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-6 bg-white border-b border-cultr-sage sticky top-16 z-40">
        <div className="max-w-5xl mx-auto">
          <CategoryFilter activeCategory={activeCategory} />
        </div>
      </section>

      {/* Featured Articles (only show on 'all' category) */}
      {activeCategory === 'all' && featuredPosts.length > 0 && (
        <section className="py-16 px-6 bg-cultr-offwhite">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal>
              <h2 className="text-2xl font-display font-bold text-cultr-forest mb-8">
                Featured Articles
              </h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <BlogCard key={post.slug} post={post} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Articles */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-display font-bold text-cultr-forest">
                {activeCategory === 'all' ? 'All Articles' : BLOG_CATEGORIES.find(c => c.slug === activeCategory)?.name || 'Articles'}
              </h2>
              <span className="text-sm text-cultr-textMuted">
                {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </ScrollReveal>
          
          {filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <BlogCard key={post.slug} post={post} index={index} />
              ))}
            </div>
          ) : (
            <ScrollReveal>
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-cultr-sage mx-auto mb-4" />
                <h3 className="text-xl font-display font-bold text-cultr-text mb-2">
                  No articles found
                </h3>
                <p className="text-cultr-textMuted mb-6">
                  We&apos;re working on more content for this category.
                </p>
                <Link
                  href="/science"
                  className="text-cultr-forest font-medium hover:underline"
                >
                  View all articles
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-6 bg-cultr-mint">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-2xl font-display font-bold text-cultr-forest mb-4">
              Stay informed
            </h2>
            <p className="text-cultr-textMuted mb-6">
              Get the latest articles and research updates delivered to your inbox.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center px-6 py-3 bg-cultr-forest text-white rounded-lg font-medium hover:bg-cultr-forest/90 transition-colors"
            >
              Join CULTR Health
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Ready to optimize your health?"
        subtitle="Join thousands taking control of their biology with CULTR's personalized protocols."
        ctaText="Get Started"
      />
    </div>
  );
}
