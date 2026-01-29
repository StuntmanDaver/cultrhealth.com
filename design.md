lets # Cultr Health Design System (Replicated from Eli Health)

> **Reference:** [eli.health/products/cortisol](https://eli.health/products/cortisol)

---

## 1. Design Philosophy

**"Modern Biological Luxury"**

A seamless blend of scientific precision and lifestyle wellness. The aesthetic is clean, breathable, and clinically trusted, softened by organic gradients and "aura" visuals that represent hormonal flux.

- **Keywords:** Clinical, Ethereal, Precision, Human, Fluid
- **Core Tension:** Sharp, high-contrast typography (Data) vs. Soft, blurred gradients (Biology)
- **Mood:** Premium wellness clinic meets editorial magazine

---

## 2. Color System

### 2.1 Base Neutrals

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Canvas | `#FAFAF9` | `stone-50` | Primary page background |
| Surface | `#FFFFFF` | `white` | Cards, modals, inputs |
| Text Primary | `#1A1A1A` | `stone-900` | Headlines, body |
| Text Secondary | `#57534E` | `stone-600` | Subtitles, captions |
| Text Muted | `#A8A29E` | `stone-400` | Placeholders, hints |
| Border | `#E7E5E4` | `stone-200` | Card borders, dividers |
| Border Focus | `#000000` | `black` | Focus states |

### 2.2 Aura Gradients (Blurred Background Orbs)

Used as blurred blobs (`filter: blur(100px)`) behind products or text.

| Name | From | To | Usage |
|------|------|----|-------|
| Purple/Lavender | `#9333EA` | `#E9D5FF` | Cortisol, Stress |
| Sage/Mint | `#10B981` | `#D1FAE5` | Progesterone, Calm |
| Orange/Peach | `#F97316` | `#FFEDD5` | Testosterone, Energy |
| Yellow/Peach | `#FDE047` | `#FFEDD5` | General highlight |
| Multi | Purple + Yellow + Orange | - | Hero sections |

### 2.3 Feature Card Backgrounds

| Variant | Tailwind Class | Usage |
|---------|----------------|-------|
| Blue | `bg-blue-100` | Primary products |
| Green | `bg-green-100` | Secondary products |
| Orange | `bg-orange-100` | Tertiary products |

### 2.4 Functional Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Action Primary | `#000000` | Buttons, CTAs |
| Action Hover | `#292524` | Button hover |
| Success | `#059669` | Confirmations |
| Error | `#DC2626` | Validation errors |

---

## 3. Typography

### 3.1 Font Families

**Display Font:** `Fraunces` (Variable, Google Fonts)
- Usage: H1-H3, Pull Quotes, Stat Numbers, Product Titles
- Characteristics: High contrast, optical sizing, italic variations
- CSS: `font-family: var(--font-display), 'Fraunces', Georgia, serif;`

**Body Font:** `Inter` (Variable, Google Fonts)
- Usage: UI elements, body text, buttons, labels, navigation
- Characteristics: Clean, legible, high x-height, neutral
- CSS: `font-family: var(--font-body), 'Inter', system-ui, sans-serif;`

### 3.2 Type Scale

| Name | Desktop | Mobile | Font | Weight | Usage |
|------|---------|--------|------|--------|-------|
| Display XL | `text-7xl` (72px) | `text-4xl` (36px) | Fraunces | 400 | Hero headlines |
| Display LG | `text-5xl` (48px) | `text-3xl` (30px) | Fraunces | 400 | Section headers |
| Display MD | `text-3xl` (30px) | `text-2xl` (24px) | Fraunces | 400 | Card titles |
| Body LG | `text-xl` (20px) | `text-lg` (18px) | Inter | 400 | Lead paragraphs |
| Body MD | `text-base` (16px) | `text-base` | Inter | 400 | Default body |
| Body SM | `text-sm` (14px) | `text-sm` | Inter | 400 | Captions |
| Label | `text-sm` | `text-xs` | Inter | 500 | Form labels, tags |

### 3.3 Typography Patterns

**Italic Accent:** Headlines often use italics for emphasis on key phrases.
```
"What if you could check your hormone levels at any time, *just like your heart rate?*"
```

**Mixed Serif/Sans:** Use serif for emotional/aspirational text, sans for functional/data text.

---

## 4. Components

### 4.1 Buttons

**Primary Button (Black Pill)**
```css
/* Tailwind */
px-7 py-3.5 bg-black text-white text-sm font-medium rounded-full
hover:bg-stone-800 hover:scale-[1.03]
transition-all duration-200
disabled:opacity-50 disabled:cursor-not-allowed
```

**Secondary Button (Outline Pill)**
```css
px-7 py-3.5 bg-transparent text-black text-sm font-medium rounded-full
border border-stone-300
hover:bg-stone-100 hover:border-stone-400 hover:scale-[1.03]
transition-all duration-200
```

**Ghost/Text Link**
```css
text-stone-900 text-sm font-medium
hover:text-stone-600
/* Often with arrow icon suffix */
```

### 4.2 Cards

**Product Feature Card**
```css
rounded-2xl p-8 bg-blue-100 /* or green-100, orange-100 */
transition-all duration-300
hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-200/60
```

**Info/Content Card**
```css
bg-white rounded-2xl p-6 border border-stone-200
transition-all duration-300
hover:shadow-lg hover:shadow-stone-200/50
```

**Checkout Summary Card**
```css
bg-stone-100 rounded-2xl p-6
/* Sticky positioning on desktop */
```

### 4.3 Inputs

**Text Input**
```css
w-full px-4 py-3 bg-white text-sm text-stone-900
border border-stone-300 rounded-lg
placeholder:text-stone-400
focus:outline-none focus:border-black focus:ring-1 focus:ring-black/20
transition-colors duration-200
```

**Radio Card (Selection)**
```css
/* Default */
relative flex items-start gap-4 p-4
border border-stone-200 rounded-xl
cursor-pointer transition-all duration-200
hover:border-stone-300

/* Selected */
border-2 border-black bg-stone-50
```

### 4.4 Aura Orbs (Decorative)

```css
/* Base */
absolute rounded-full pointer-events-none
blur-3xl opacity-50

/* Sizes */
sm: w-32 h-32
md: w-48 h-48
lg: w-72 h-72
xl: w-96 h-96

/* Gradients */
bg-gradient-to-br from-purple-500 to-purple-200
bg-gradient-to-br from-emerald-500 to-emerald-200
bg-gradient-to-br from-orange-500 to-orange-200
```

### 4.5 Badges & Tags

**Category Tag**
```css
text-xs text-stone-500
```

**Bestseller Badge**
```css
text-xs px-3 py-1 bg-black text-white rounded-full
```

---

## 5. Navigation

### 5.1 Header

**Structure:**
- Fixed position, `z-50`
- Height: `h-16` (64px)
- Background: `bg-white/95 backdrop-blur-md`

**Layout:**
- Left: Primary nav links (Products, How It Works, Science)
- Center: Logo (lowercase, serif)
- Right: Secondary links + CTA button ("Shop now")

**Mobile:**
- Hamburger menu on right
- Full-height slide-out panel

### 5.2 Footer

**Structure:**
- Background: `bg-white`
- Padding: `py-16`

**Sections:**
1. Newsletter signup (headline with italic accent)
2. 4-column link grid (Products, Learn, Contact, Social icons)
3. Legal text + copyright + policy links

---

## 6. Layout System

### 6.1 Container

```css
max-w-7xl mx-auto px-6
/* or */
max-w-4xl mx-auto px-6 /* for narrower content */
```

### 6.2 Section Spacing

| Type | Padding | Usage |
|------|---------|-------|
| Hero | `min-h-[90vh]` | First fold |
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

**Checkout (5-Column)**
```css
grid lg:grid-cols-5 gap-12
/* Left: col-span-3, Right: col-span-2 */
```

---

## 7. Animations & Transitions

### 7.1 Scroll Reveal

**Fade In + Slide Up**
```css
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
.animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
```

### 7.2 Hover Effects

| Element | Effect | Duration |
|---------|--------|----------|
| Buttons | `scale-[1.03]` | 200ms |
| Cards | `translateY(-4px)` + shadow increase | 300ms |
| Links | Color change | 200ms |

### 7.3 Micro-interactions

- Input focus: Border color transition (200ms)
- Button click: Subtle scale down (active:scale-[0.98])
- Aura orbs: Slow pulse animation (4s ease-in-out infinite)

---

## 8. Page Templates

### 8.1 Hero Section

**Layout:**
- Full viewport height (`min-h-[90vh]`)
- Centered content, max-width constrained
- Aura orbs in corners (4 orbs: top-left, top-right, bottom-left, bottom-right)

**Content:**
1. Display headline (serif, with italic accent)
2. Subheadline (sans, muted color)
3. Primary CTA button
4. Social proof / "As Seen In" logos

### 8.2 Product Page

**Layout:**
- Two columns on desktop
- Left: Product image gallery
- Right: Product info + purchase options

**Right Column Structure:**
1. Rating + reviews link
2. Product title (serif)
3. Subtitle
4. Key features (bullet list with icons)
5. Plan selection (radio cards)
6. "Add to Cart" button
7. Trust signals

### 8.3 Checkout/Cart

**Layout:**
- Two columns (3:2 ratio)
- Left: Form sections (Contact, Items, Notes)
- Right: Sticky order summary

**Form Section Pattern:**
```html
<section class="bg-white rounded-2xl p-6 border border-stone-200">
  <h2 class="text-sm font-medium uppercase tracking-wide mb-4">
    Section Title
  </h2>
  <!-- Content -->
</section>
```

### 8.4 How It Works

**Layout:**
- Left: Fixed/sticky title + description
- Right: Numbered steps (vertical timeline)

**Step Card:**
```html
<div class="bg-white rounded-2xl p-6">
  <span class="text-sm text-stone-500">01</span>
  <h3 class="text-xl font-display mt-2">Step Title</h3>
  <p class="text-stone-600 mt-2">Description...</p>
</div>
```

---

## 9. Iconography

### 9.1 Style

- Library: Lucide React (or similar fine-line icons)
- Stroke: 1.5px
- Caps: Round
- Joins: Round
- Size: 16px (sm), 20px (md), 24px (lg)

### 9.2 Common Icons

| Purpose | Icon |
|---------|------|
| Menu | `Menu` / `X` |
| Dropdown | `ChevronDown` |
| Back | `ArrowLeft` |
| Forward | `ArrowRight` |
| Cart | `ShoppingCart` |
| Secure | `Shield` |
| Check | `Check` |
| Plus/Minus | `Plus` / `Minus` |
| Social | `Linkedin` / `Instagram` |

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Patterns

- Navigation: Hamburger menu below `md`
- Grid: Single column below `md`, multi-column above
- Typography: Smaller scale below `sm`
- Checkout: Stacked layout below `lg`

---

## 11. Accessibility

- Focus states: Clear `ring` outlines on interactive elements
- Color contrast: Minimum 4.5:1 for body text
- Touch targets: Minimum 44px for mobile
- Reduced motion: Respect `prefers-reduced-motion`
- Semantic HTML: Proper heading hierarchy, ARIA labels

---

## 12. File Structure

```
components/
├── ui/
│   ├── Button.tsx        # Primary/Secondary/Ghost buttons
│   ├── Input.tsx         # Text input with label/error
│   ├── Aura.tsx          # Decorative gradient orbs
│   ├── ScrollReveal.tsx  # Intersection observer animations
│   └── Spinner.tsx       # Loading indicator
├── site/
│   ├── Header.tsx        # Main navigation
│   ├── Footer.tsx        # Site footer
│   ├── ProductCard.tsx   # Feature card with color bg
│   └── PricingCard.tsx   # Pricing tier card
└── sections/
    ├── Hero.tsx          # Hero with auras
    ├── HowItWorks.tsx    # Steps section
    ├── FAQ.tsx           # Accordion FAQ
    └── Testimonials.tsx  # Reviews/quotes
```
