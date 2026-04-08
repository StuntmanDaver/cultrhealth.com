import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import { MarketingHero } from '@/components/site/MarketingHero';
import { SocialProofBadge } from '@/components/site/SocialProofBadge';
import TrustMarquee from '@/components/site/TrustMarquee';
import Button from '@/components/ui/Button';
import { getAllBlogPosts, BLOG_CATEGORIES, type BlogPostMeta } from '@/lib/blog-content';
import { ArrowRight, BookOpen, Clock, Calendar, Stethoscope, User } from 'lucide-react';

// Only these blog images exist in /public/blog/
const BLOG_IMAGES = new Set([
  '/blog/nad-longevity.png',
  '/blog/biomarker-basics.png',
  '/blog/glp1-metabolic.png',
]);

// Start Here collections — curated entry points
const START_HERE_COLLECTIONS = [
  {
    title: 'New to CULTR?',
    description: 'Start with biomarkers, GLP-1 basics, and how protocols are personalized.',
    slugs: ['biomarker-basics', 'glp1-beyond-weight-loss', 'peptide-stacking'],
  },
  {
    title: 'Focused on body composition?',
    description: 'GLP-1s, fasting, insulin sensitivity, and inflammation.',
    slugs: ['glp1-beyond-weight-loss', 'fasting-metabolic-health', 'inflammation-markers'],
  },
  {
    title: 'Focused on recovery?',
    description: 'Sleep, mitochondrial health, BPC-157, and TB-500.',
    slugs: ['sleep-and-recovery', 'mitochondrial-health', 'understanding-bpc-157', 'tb500-tissue-repair'],
  },
  {
    title: 'Trying to understand labs?',
    description: 'Biomarker basics, inflammation markers, and hormone health.',
    slugs: ['biomarker-basics', 'inflammation-markers', 'thyroid-deep-dive', 'testosterone-optimization'],
  },
];

export const metadata: Metadata = {
  title: 'Science — CULTR Health',
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
          {/* Image */}
          <div className="aspect-[16/9] bg-gradient-to-br from-cultr-mint to-cultr-sage relative overflow-hidden">
            {post.image && BLOG_IMAGES.has(post.image) ? (
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-cultr-forest/30" />
              </div>
            )}
            {/* Category badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 grad-dark-glow text-white text-xs font-display font-medium rounded-full">
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

            {/* Author attribution */}
            <div className="flex items-center gap-2 mb-3">
              <User className="w-3.5 h-3.5 text-cultr-textMuted" />
              <span className="text-xs text-cultr-textMuted">CULTR Health Editorial Team</span>
              <span className="text-cultr-sage">·</span>
              <Stethoscope className="w-3 h-3 text-cultr-textMuted" />
              <span className="text-xs text-cultr-textMuted">Dr. Ali Saberi, MD</span>
            </div>

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

  const allPosts = await getAllBlogPosts();

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

  const featuredPosts = allPosts.filter(post => post.featured).slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <MarketingHero
        title="Science that helps you make smarter health decisions."
        subtitle="Evidence-based guides on body composition, biomarkers, recovery, hormone health, peptides, and long-term optimization — written to help you understand your options before and during care."
        ctas={[
          { label: 'Take the Quiz', href: '/quiz' },
        ]}
        size="default"
        backgroundImage="/images/hero-cultr-office.png"
      />

      {/* Social Proof */}
      <div className="py-3 px-6 grad-dark-glow -mt-6">
        <div className="max-w-4xl mx-auto flex justify-center">
          <SocialProofBadge variant="pill" className="text-white/80" />
        </div>
      </div>

      {/* Start Here Collections */}
      {activeCategory === 'all' && (
        <section className="py-12 px-6 grad-mint border-b border-cultr-sage">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-cultr-forest mb-2">
                Start here
              </h2>
              <p className="text-sm text-cultr-textMuted">Concierge reading paths based on your interests.</p>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {START_HERE_COLLECTIONS.map((collection, i) => (
                <ScrollReveal key={collection.title} delay={i * 80} direction="up">
                  <div className="p-5 rounded-xl bg-white border border-cultr-sage/40 h-full">
                    <h3 className="font-display font-bold text-cultr-forest text-sm mb-1">{collection.title}</h3>
                    <p className="text-xs text-cultr-textMuted mb-3">{collection.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {collection.slugs.slice(0, 3).map((slug) => {
                        const post = allPosts.find(p => p.slug === slug);
                        if (!post) return null;
                        return (
                          <Link
                            key={slug}
                            href={`/science/${slug}`}
                            className="text-[10px] px-2 py-1 bg-cultr-sage/20 text-cultr-forest rounded-full hover:bg-cultr-sage/40 transition-colors truncate max-w-[140px]"
                          >
                            {post.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="py-8 px-6 grad-white border-b border-cultr-sage">
        <div className="max-w-5xl mx-auto">
          <CategoryFilter activeCategory={activeCategory} />
        </div>
      </section>

      {/* Featured Articles (only show on 'all' category) */}
      {activeCategory === 'all' && featuredPosts.length > 0 && (
        <section className="py-16 px-6 grad-light">
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
      <section className="py-16 px-6 grad-white">
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

      {/* Brand CTA Break */}
      <section className="py-16 px-6 section-veil">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-cultr-textMuted text-lg mb-2">Change the CULTR.</p>
            <h2 className="text-3xl font-display font-bold text-cultr-forest mb-6">
              Rebrand yourself.
            </h2>
            <Link
              href="/quiz"
              className="inline-flex items-center px-6 py-3 grad-dark text-white rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Take the Quiz <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Trust Logo Marquee */}
      <TrustMarquee />

      {/* Quiz CTA (replaced newsletter → pricing link) */}
      <section className="py-16 px-6 grad-mint">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-2xl font-display font-bold text-cultr-forest mb-4">
              Want a plan built around your goals and biomarkers?
            </h2>
            <p className="text-cultr-textMuted mb-6">
              Take the 2-minute quiz to get matched with the right protocol for your goals.
            </p>
            <Link href="/quiz">
              <Button size="lg">
                Take the Quiz <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Ready to optimize your health?"
        subtitle="Join thousands taking control of their biology with personalized protocols."
        ctaText="Get Started"
      />
    </div>
  );
}
