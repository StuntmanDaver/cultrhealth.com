'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type Platform = 'instagram' | 'tiktok' | 'youtube';

const TABS: { key: Platform; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
];

const FEED_IDS: Record<Platform, string | undefined> = {
  instagram: process.env.NEXT_PUBLIC_CURATOR_FEED_INSTAGRAM,
  tiktok: process.env.NEXT_PUBLIC_CURATOR_FEED_TIKTOK,
  youtube: process.env.NEXT_PUBLIC_CURATOR_FEED_YOUTUBE,
};

export function CommunityFeed() {
  const [activeTab, setActiveTab] = useState<Platform>('instagram');
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  const loadFeed = useCallback((platform: Platform) => {
    const feedId = FEED_IDS[platform];
    if (!feedId || !containerRef.current) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Clear previous feed
    const container = containerRef.current;
    container.innerHTML = '';

    // Remove previous script
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    // Create the Curator container div
    const feedDiv = document.createElement('div');
    feedDiv.id = `curator-feed-${feedId}`;
    container.appendChild(feedDiv);

    // Load the Curator CSS
    const existingCss = document.querySelector(`link[href*="cdn.curator.io/published/${feedId}.css"]`);
    if (!existingCss) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://cdn.curator.io/published/${feedId}.css`;
      document.head.appendChild(link);
    }

    // Load the Curator JS
    const script = document.createElement('script');
    script.src = `https://cdn.curator.io/published-js/${feedId}.js`;
    script.async = true;
    script.onload = () => setLoading(false);
    script.onerror = () => setLoading(false);
    document.body.appendChild(script);
    scriptRef.current = script;
  }, []);

  useEffect(() => {
    loadFeed(activeTab);

    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [activeTab, loadFeed]);

  const feedId = FEED_IDS[activeTab];
  const hasAnyFeed = Object.values(FEED_IDS).some(Boolean);

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200
              ${activeTab === tab.key
                ? 'bg-cultr-forest text-white shadow-md'
                : 'bg-white text-cultr-forest border border-cultr-sage hover:bg-cultr-mint'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed Container */}
      <div className="min-h-[400px] rounded-2xl grad-white border border-cultr-sage/30 p-6 md:p-8">
        {!hasAnyFeed ? (
          /* No feeds configured at all */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full grad-mint flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-cultr-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-bold text-cultr-forest mb-2">Coming Soon</h3>
            <p className="text-sm text-cultr-textMuted max-w-md">
              Our social media feeds are being set up. In the meantime, follow us on{' '}
              <a href="https://instagram.com/cultrhealth" target="_blank" rel="noopener noreferrer" className="text-cultr-forest font-medium hover:underline">
                Instagram
              </a>,{' '}
              <a href="https://tiktok.com/@cultrhealth" target="_blank" rel="noopener noreferrer" className="text-cultr-forest font-medium hover:underline">
                TikTok
              </a>, and{' '}
              <a href="https://youtube.com/@cultrhealth" target="_blank" rel="noopener noreferrer" className="text-cultr-forest font-medium hover:underline">
                YouTube
              </a>.
            </p>
          </div>
        ) : !feedId ? (
          /* This specific tab's feed isn't configured */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="text-lg font-display font-bold text-cultr-forest mb-2">Coming Soon</h3>
            <p className="text-sm text-cultr-textMuted">
              This feed is being set up. Check back soon!
            </p>
          </div>
        ) : (
          <>
            {/* Loading spinner */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-cultr-sage border-t-cultr-forest rounded-full animate-spin" />
              </div>
            )}
            {/* Curator.io container */}
            <div ref={containerRef} className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'} />
          </>
        )}
      </div>

      {/* Curator.io brand CSS overrides */}
      <style jsx global>{`
        /* Post cards */
        .crt-post {
          border-radius: 1rem !important;
          overflow: hidden !important;
          border: 1px solid rgba(183, 228, 199, 0.3) !important;
        }
        .crt-post-header,
        .crt-post-footer {
          font-family: var(--font-body), 'Inter', system-ui, sans-serif !important;
        }
        .crt-post .crt-post-text {
          color: #2A4542 !important;
          font-family: var(--font-body), 'Inter', system-ui, sans-serif !important;
        }
        .crt-post .crt-post-username,
        .crt-post .crt-post-fullname {
          color: #2A4542 !important;
          font-weight: 600 !important;
        }
        /* Grid layout */
        .crt-grid .crt-grid-post {
          padding: 6px !important;
        }
        /* Waterfall layout */
        .crt-panel-feed {
          background: transparent !important;
        }
        /* Load more button */
        .crt-load-more {
          background: #2A4542 !important;
          color: white !important;
          border-radius: 9999px !important;
          font-family: var(--font-body), 'Inter', system-ui, sans-serif !important;
          font-weight: 500 !important;
          padding: 10px 24px !important;
          border: none !important;
          transition: all 0.2s !important;
        }
        .crt-load-more:hover {
          background: #1F3533 !important;
        }
        /* Hide Curator branding */
        .crt-logo,
        .crt-tag {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
