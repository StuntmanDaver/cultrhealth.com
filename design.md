# CULTR Health Design System

> **Living document** — reflects the actual design tokens in `tailwind.config.ts` and component implementations.

---

## 1. Design Philosophy

**"Modern Biological Luxury"**

A seamless blend of scientific precision and lifestyle wellness. The aesthetic is clean, breathable, and clinically trusted, softened by organic gradients and "aura" visuals that represent hormonal flux.

- **Keywords:** Clinical, Ethereal, Precision, Human, Fluid
- **Core Tension:** Sharp, high-contrast typography (Data) vs. Soft, blurred gradients (Biology)
- **Mood:** Premium wellness clinic meets editorial magazine

---

## 2. Color System

### 2.1 Brand Colors (defined in `tailwind.config.ts`)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `forest` / `brand-primary` | `#2B4542` | `forest` | Primary bg, text, buttons, CTAs |
| `forest-light` / `brand-primaryLight` | `#3D5E5B` | `forest-light` | Hover states |
| `forest-dark` / `brand-primaryHover` | `#1F3533` | `forest-dark` | Pressed/active states |
| `brand-secondary` | `#506C64` | `brand-secondary` | Secondary elements |
| `cream` / `brand-cream` | `#FCFBF7` | `cream` | Page backgrounds, body bg |
| `cream-dark` / `brand-creamDark` | `#F5F2ED` | `cream-dark` | Card backgrounds, sections |
| `sage` | `#B7E4C7` | `sage` | Accent color, badges, highlights |
| `mint` | `#D7F3DC` | `mint` | Light highlights, trust badge backgrounds |

### 2.2 Aura Gradient Colors (decorative blobs)

Used as blurred orbs (`blur-3xl`, `opacity-40–60`) for visual depth.

| Name | Hex | Usage |
|------|-----|-------|
| `aura-purple` | `#9333EA` | Hero accents, decorative |
| `aura-lavender` | `#E9D5FF` | Hero accents |
| `aura-sage` | `#10B981` | Health/wellness sections |
| `aura-mint` | `#D1FAE5` | Soft background fills |
| `aura-orange` | `#F97316` | Energy/action sections |
| `aura-peach` | `#FFEDD5` | Warm accents |
| `aura-yellow` | `#FDE047` | General highlights |

### 2.3 Legacy Aliases (`cultr-*`)

Kept for backwards compatibility — prefer `forest`/`cream`/`sage`/`mint` tokens in new code.

| Token | Resolves To |
|-------|------------|
| `cultr-forest` | `#2B4542` |
| `cultr-forestLight` | `#3D5E5B` |
| `cultr-sage` | `#B7E4C7` |
| `cultr-mint` | `#D7F3DC` |
| `cultr-offwhite` | `#FCFBF7` |
| `cultr-text` | `#2B4542` |
| `cultr-textMuted` | `#6B7280` |

**Never use:** `cultr-copper`, `cultr-charcoal` — these tokens do not exist.

### 2.4 Functional Colors

| Purpose | Token | Hex |
|---------|-------|-----|
| Page background | `cream` | `#FCFBF7` |
| Primary CTA | `forest` | `#2B4542` |
| CTA hover | `forest-light` | `#3D5E5B` |
| Success | Tailwind `green-600` | `#16A34A` |
| Error | Tailwind `red-600` | `#DC2626` |
| Muted text | `cultr-textMuted` / `gray-500` | `#6B7280` |

---

## 3. Typography

### 3.1 Font Families

**Display Font:** `Fraunces` (Variable, Google Fonts) — `font-fraunces`
- Usage: Pull quotes, hero subtext, decorative headings
- CSS var: `--font-fraunces`

**Heading Font:** `Playfair Display` — `font-display`
- Usage: H1–H3, section headers, card titles
- CSS var: `--font-display`

**Body Font:** `Inter` (Variable, Google Fonts) — `font-body` / `font-sans`
- Usage: UI elements, body text, buttons, labels, navigation
- CSS var: `--font-body`

**Brand rule:** "CULTR" and "CULTR HEALTH" always use `font-display` (Playfair Display). The slogan "Change the CULTR, rebrand yourself." uses `font-body` (Inter) with "rebrand" in lowercase italic.

### 3.2 Type Scale

| Name | Desktop | Mobile | Font | Weight | Usage |
|------|---------|--------|------|--------|-------|
| Display XL | `text-7xl` (72px) | `text-4xl` (36px) | font-display | 400 | Hero headlines |
| Display LG | `text-5xl` (48px) | `text-3xl` (30px) | font-display | 400 | Section headers |
| Display MD | `text-3xl` (30px) | `text-2xl` (24px) | font-display | 400 | Card titles |
| Body LG | `text-xl` (20px) | `text-lg` (18px) | font-body | 400 | Lead paragraphs |
| Body MD | `text-base` (16px) | `text-base` | font-body | 400 | Default body |
| Body SM | `text-sm` (14px) | `text-sm` | font-body | 400 | Captions, hints |
| Label | `text-sm` | `text-xs` | font-body | 500 | Form labels, tags |

### 3.3 Typography Patterns

**Italic Accent:** Headlines use italics on key phrases (via Playfair Display italic variant).

**Mixed Serif/Sans:** Use `font-display` for aspirational/brand text, `font-body` for functional/data text.

---

## 4. Components

### 4.1 Buttons (`components/ui/Button.tsx`)

All buttons use `rounded-full`. Managed via manual variant objects + `cn()` utility (NOT CVA).

**Primary Button (forest bg)**
```css
bg-brand-primary text-cream rounded-full px-6 py-3
hover:bg-forest-light
transition-colors duration-200
disabled:opacity-50 disabled:cursor-not-allowed
```

**Secondary Button (outline)**
```css
border border-forest text-forest bg-transparent rounded-full px-6 py-3
hover:bg-forest/5
transition-colors duration-200
```

**Ghost Button (text only)**
```css
text-forest bg-transparent rounded-full px-6 py-3
hover:bg-forest/5
transition-colors duration-200
```

**Loading state:** Has built-in `isLoading` prop that shows a spinner and disables interaction.

### 4.2 Cards

**Content/Info Card**
```css
bg-cream-dark rounded-2xl p-6 border border-forest/10
transition-all duration-300
hover:shadow-lg
```

**Pricing Card**
```css
bg-white rounded-3xl p-8 border border-forest/10
/* Featured: border-forest ring-2 ring-forest/20 */
```

**Checkout Summary Card**
```css
bg-cream-dark rounded-2xl p-6
/* Sticky positioning on desktop */
```

### 4.3 Inputs (`components/ui/Input.tsx`)

```css
w-full px-4 py-3 bg-white text-sm text-forest
border border-forest/20 rounded-lg
placeholder:text-gray-400
focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/20
transition-colors duration-200
/* Mobile: font-size: 16px minimum to prevent Safari auto-zoom */
```

### 4.4 Aura Orbs (`components/ui/Aura.tsx`)

```css
absolute rounded-full pointer-events-none
blur-3xl opacity-40
/* Sizes: sm w-32 h-32, md w-48 h-48, lg w-72 h-72, xl w-96 h-96 */
/* Example: bg-gradient-to-br from-aura-purple to-aura-lavender */
```

### 4.5 Badges & Tags

**Status Badge (sage)**
```css
text-xs px-3 py-1 bg-sage text-forest rounded-full font-medium
```

**Featured Badge**
```css
text-xs px-3 py-1 bg-forest text-cream rounded-full
```

**Trust Badge**
```css
bg-mint text-forest text-xs px-2 py-1 rounded-full
```

---

## 5. Navigation

### 5.1 Header (`components/site/Header.tsx`)

Floating pill navbar that morphs on scroll via `requestAnimationFrame`:

- **Trigger:** `window.scrollY > 50`
- **Unscrolled:** Full-width bar, `bg-cream/[0.97]`, `h-[68px]`, `rounded-none`, `backdrop-blur-sm`
- **Scrolled:** Floating pill, `max-w-[1080px]`, `bg-cream/[0.88]`, `h-[54px]`, `rounded-[60px]`, `backdrop-blur-[20px]`, shadow

**Left nav links:** Pricing, Core Therapies (`/therapies`), How It Works, Tools (`/tools`)
**Right nav links:** Members (`/portal/login`), Creators, Community
**CTA:** "Get Started" → `/quiz`, `bg-forest`, `rounded-full`, `text-cream`
**Logo:** "CULTR" text (font-display) — "Health" subtitle fades out on scroll

**Active state:** `bg-brand-primary/[0.08]` rounded bg on matching nav link

**Mobile:** Animated 3-bar hamburger → full drawer, locks body scroll

### 5.2 Footer (`components/site/Footer.tsx`)

Two-tier footer:
1. Trust badges row + LegitScript seal placeholder
2. Link grid: Treatments, Company, Members, Connect (with social icons)
3. Legal text + copyright + policy links

---

## 6. Layout System

### 6.1 Container

```css
max-w-7xl mx-auto px-6    /* Default wide container */
max-w-4xl mx-auto px-6    /* Narrower content sections */
max-w-[1080px] mx-auto    /* Header floating pill max-width */
```

### 6.2 Section Spacing

| Type | Padding | Usage |
|------|---------|-------|
| Hero | `min-h-[90vh]` or `py-24` | First fold |
| Standard | `py-20` or `py-24` | Content sections |
| Compact | `py-12` or `py-16` | Smaller sections |

### 6.3 Grid Patterns

**2-Column Split (Image + Text)**
```css
grid lg:grid-cols-2 gap-12 items-center
```

**3-Column Products**
```css
grid md:grid-cols-3 gap-6
```

**4-Column Features**
```css
grid sm:grid-cols-2 lg:grid-cols-4 gap-6
```

---

## 7. Animations & Transitions

### 7.1 Keyframe Animations (defined in `tailwind.config.ts`)

| Class | Keyframe | Duration | Usage |
|-------|----------|----------|-------|
| `animate-fade-in` | fadeIn (0→1 opacity) | 0.6s | Section reveals |
| `animate-slide-up` | slideUp (0→1 + translateY 20px→0) | 0.6s | Card entrances |
| `animate-float` | float (translateY 0→-20px) | 6s infinite | Decorative elements |
| `animate-shimmer` | shimmer (bg-position) | 2s infinite | Loading skeletons |
| `animate-scale-in` | scaleIn | 0.5s | Modal/popover reveals |
| `animate-blur-in` | blurIn | 0.6s | Soft reveals |
| `animate-bounce-subtle` | bounceSubtle | 2s infinite | CTA attention |
| `animate-glow-pulse` | glowPulse | 3s infinite | Badge highlights |

**ScrollReveal component** (`components/ui/ScrollReveal.tsx`): Intersection Observer wrapper with configurable `delay`, `direction`, and `duration`.

### 7.2 Hover Effects

| Element | Effect | Duration |
|---------|--------|----------|
| Buttons | Color shift (`forest` → `forest-light`) | 200ms |
| Cards | Shadow increase + subtle translateY | 300ms |
| Nav links | Background fill `forest/[0.08]` | 200ms |

### 7.3 Background System

**MeshGradient** (`components/ui/MeshBackgroundDynamic.tsx`): Used in root layout (`app/layout.tsx`) as full-screen fixed background behind all content. Colors: cream, sage, forest, mint — speed 0.2. Loaded via `next/dynamic` with `ssr: false`.

**Aura blobs** (`components/ui/Aura.tsx`): Decorative blurred gradient circles on section backgrounds.

**CultrBackground** (`components/CultrBackground.tsx`): Alternative background component.

---

## 8. Page Templates

### 8.1 Hero Section

**Layout:**
- Full viewport height (`min-h-[90vh]`) or full-bleed background image
- Gradient overlay for text legibility
- Aura orbs in corners for depth

**Content order:**
1. Eyebrow tag (small caps, forest/sage color)
2. Display headline (font-display, with italic accent on key phrase)
3. Subheadline (font-body, text-forest/70)
4. CTA button(s) — primary + ghost pair
5. Social proof / trust badges below fold

### 8.2 Pricing Cards (`components/site/PricingCard.tsx`)

**Tier hierarchy:** Club → Core → Catalyst+ (featured) → Concierge

**Featured card:** `ring-2 ring-forest/20 border-forest` + "Most Popular" badge

### 8.3 Checkout Flow (`app/join/[tier]/page.tsx`)

**Layout:**
- Two columns (3:2 ratio) on desktop
- Left: Plan details + payment form (ConsentModal required)
- Right: Sticky order summary

**ConsentModal:** Required for all checkout tiers. Scroll-gated checkbox + IntersectionObserver, FDA badges per tier.

### 8.4 Member Portal (`app/portal/`)

Dark sidebar navigation pattern. Uses `bg-forest` sidebar with `text-cream` links.

---

## 9. Compliance UI Components (`components/compliance/`)

| Component | Description |
|-----------|-------------|
| `ConsentModal.tsx` | Informed consent modal — scroll-gated, FDA badges, body scroll lock |
| `PrescriptionDisclaimer.tsx` | Rx disclaimer with Shield icon |
| `FDAStatusBadge.tsx` | Color-coded FDA status badge per therapy |
| `TestimonialDisclaimer.tsx` | "Results may vary" disclaimer |
| `DispensingPharmacyInfo.tsx` | St. Luke Compounding Pharmacy info block |

---

## 10. Iconography

### Icon Style
- Library: Lucide React (`^0.563.0`)
- Stroke width: 1.5–2px
- Caps/joins: Round
- Sizes: 16px (sm), 20px (md), 24px (lg)
- Custom SVGs for TikTok and YouTube in Footer

### Common Icons
| Purpose | Icon |
|---------|------|
| Menu | `Menu` / `X` |
| Dropdown | `ChevronDown` |
| Navigation | `ArrowLeft` / `ArrowRight` |
| Security | `Shield` |
| Check | `Check` / `CheckCircle` |
| User | `User` / `UserCircle` |
| Social | `Instagram` (+ custom TikTok/YouTube SVGs) |

---

## 11. Responsive Breakpoints (Tailwind defaults)

| Breakpoint | Width | Key Usage |
|------------|-------|-----------|
| `sm` | 640px | Typography scale, input font-size (16px iOS) |
| `md` | 768px | Grid columns, nav changes |
| `lg` | 1024px | Two-column layouts, checkout split |
| `xl` | 1280px | Wide containers |
| `2xl` | 1536px | Large screen max-widths |

### Mobile-First Rules
- Navigation: Hamburger drawer below `md`
- Grid: Single column → multi-column above `md`
- Typography: Smaller scale below `sm`
- **iOS Safari:** Form inputs must be `font-size: 16px` minimum to prevent auto-zoom

---

## 12. Accessibility

- Focus states: `ring` outlines on interactive elements
- Color contrast: Minimum 4.5:1 for body text (`#2B4542` forest on `#FCFBF7` cream = ≥7:1)
- Touch targets: Minimum 44px for mobile
- Reduced motion: Respect `prefers-reduced-motion` in animations
- Semantic HTML: Proper heading hierarchy, ARIA labels on modals/dropdowns
- **LegitScript compliance:** ConsentModal scroll-gate, FDA badges on therapy cards, PrescriptionDisclaimer on relevant pages

---

## 13. Design File Structure

```
components/
├── ui/
│   ├── Button.tsx          # primary/secondary/ghost, rounded-full, isLoading
│   ├── Input.tsx           # forest border, cream bg, 16px iOS fix
│   ├── Aura.tsx            # Blurred gradient orbs
│   ├── ScrollReveal.tsx    # IntersectionObserver animations
│   ├── SectionWrapper.tsx  # Consistent section padding
│   ├── Spinner.tsx         # Loading spinner
│   └── MeshBackgroundDynamic.tsx  # Full-screen animated mesh gradient
├── site/
│   ├── Header.tsx          # Morphing floating pill navbar
│   ├── Footer.tsx          # Two-tier footer
│   ├── LayoutShell.tsx     # Conditional header/footer (server)
│   ├── LayoutShellClient.tsx # Chrome hiding logic (client)
│   ├── PricingCard.tsx     # Membership tier cards
│   ├── MarketingHero.tsx   # Reusable hero component
│   ├── TrustMarquee.tsx    # Scrolling trust badges
│   ├── TrustStrip.tsx      # Static trust badges bar
│   ├── TestimonialsSection.tsx # Review cards
│   ├── ComparisonTable.tsx # CULTR vs standard care
│   └── ...                 # Other site components
├── compliance/
│   ├── ConsentModal.tsx    # Checkout consent gate
│   ├── FDAStatusBadge.tsx  # Per-therapy FDA badge
│   └── PrescriptionDisclaimer.tsx
└── CultrBackground.tsx     # Background component
```
