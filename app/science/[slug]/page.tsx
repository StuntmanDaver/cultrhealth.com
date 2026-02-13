import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CTASection } from '@/components/site/CTASection';
import '../blog-content.css';
import {
  getBlogPostBySlug,
  getRelatedPosts,
  getAllBlogSlugs,
} from '@/lib/blog-content';
import { ArrowLeft, ArrowRight, Clock, Calendar, User, Tag, AlertCircle, BookOpen } from 'lucide-react';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

export const revalidate = 3600;

// Configure DOMPurify for server-side use
const { window } = new JSDOM('');
const purify = DOMPurify(window);

// Generate static params for all blog posts
export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for each blog post
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found — CULTR Health',
    };
  }

  return {
    title: `${post.title} — CULTR Health`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

// Related post card component
function RelatedPostCard({ post }: { post: { title: string; slug: string; excerpt: string; readTime: string } }) {
  return (
    <Link href={`/science/${post.slug}`} className="group block">
      <article className="p-6 bg-white rounded-xl border border-cultr-sage hover:border-cultr-forest/40 hover:shadow-md transition-all duration-300 h-full">
        <h4 className="text-lg font-display font-bold text-cultr-text mb-2 group-hover:text-cultr-forest transition-colors line-clamp-2">
          {post.title}
        </h4>
        <p className="text-sm text-cultr-textMuted mb-3 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex items-center text-xs text-cultr-textMuted">
          <Clock className="w-3.5 h-3.5 mr-1" />
          {post.readTime}
        </div>
      </article>
    </Link>
  );
}

// Process HTML to remove the first H1 and sanitize
function processContent(html: string): string {
  // Remove the first H1 tag and its content (shown in hero)
  const withoutH1 = html.replace(/<h1[^>]*>.*?<\/h1>/i, '');

  // Sanitize to prevent XSS
  return purify.sanitize(withoutH1);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(slug, 3);
  const processedContent = processContent(post.htmlContent);

  return (
    <div className="flex flex-col">
      {/* Hero / Header */}
      <section className="py-16 md:py-20 px-6 bg-cultr-forest text-white">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <ScrollReveal direction="none" duration={600}>
            <Link
              href="/science"
              className="inline-flex items-center text-white/70 hover:text-white text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Science Blog
            </Link>
          </ScrollReveal>

          {/* Category badge */}
          <ScrollReveal delay={100} direction="none" duration={600}>
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-medium rounded-full mb-4">
              {post.category}
            </span>
          </ScrollReveal>

          {/* Title */}
          <ScrollReveal delay={200} direction="none" duration={800}>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight">
              {post.title}
            </h1>
          </ScrollReveal>

          {/* Excerpt */}
          <ScrollReveal delay={300} direction="none" duration={800}>
            <p className="text-lg text-white/80 mb-6 max-w-3xl">
              {post.excerpt}
            </p>
          </ScrollReveal>

          {/* Meta info */}
          <ScrollReveal delay={400} direction="up" duration={600}>
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          {/* Quick Summary Box */}
          <ScrollReveal>
            <div className="mb-10 p-6 bg-cultr-mint/50 border border-cultr-sage rounded-xl">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-cultr-forest mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-display font-bold text-cultr-forest mb-2">Article Overview</h3>
                  <p className="text-sm text-cultr-text leading-relaxed">{post.excerpt}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Main Content */}
          <ScrollReveal>
            <article
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          </ScrollReveal>

          {/* Medical Disclaimer */}
          <ScrollReveal>
            <div className="mt-10 p-5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display font-bold text-amber-800 mb-1 text-sm">Medical Disclaimer</h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    This article is for educational purposes only and does not constitute medical advice.
                    Always consult with a qualified healthcare provider before starting any new treatment,
                    supplement, or protocol. Individual results may vary.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Tags */}
          {post.tags.length > 0 && (
            <ScrollReveal>
              <div className="mt-8 pt-6 border-t border-cultr-sage">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-cultr-textMuted" />
                  <span className="text-sm text-cultr-textMuted mr-2">Topics:</span>
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-cultr-offwhite text-cultr-textMuted text-sm rounded-full hover:bg-cultr-sage/50 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Author bio */}
          <ScrollReveal>
            <div className="mt-8 p-6 bg-cultr-offwhite rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-cultr-forest flex items-center justify-center shrink-0">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs text-cultr-textMuted uppercase tracking-wider mb-1">Written by</p>
                  <h4 className="font-display font-bold text-cultr-text mb-2">
                    {post.author}
                  </h4>
                  <p className="text-sm text-cultr-textMuted leading-relaxed">
                    Our team of medical professionals and health optimization experts creates evidence-based content to help you understand and optimize your health.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="py-12 px-6 bg-cultr-offwhite">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              <h3 className="text-2xl font-display font-bold text-cultr-forest mb-6">
                Continue Reading
              </h3>
            </ScrollReveal>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost, index) => (
                <ScrollReveal key={relatedPost.slug} delay={index * 100}>
                  <RelatedPostCard post={relatedPost} />
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal delay={300}>
              <div className="mt-8 text-center">
                <Link
                  href="/science"
                  className="inline-flex items-center text-cultr-forest font-medium hover:gap-2 transition-all"
                >
                  View all articles
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <CTASection
        title="Ready to apply this knowledge?"
        subtitle="Work with our providers to create a personalized protocol based on the latest science."
        ctaText="Get Started"
      />
    </div>
  );
}
