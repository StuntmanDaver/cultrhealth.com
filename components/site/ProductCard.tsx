import Link from 'next/link';
import { Check, ArrowRight, Star, Syringe, Pill, Activity, FlaskConical } from 'lucide-react';
import type { Product, ProductIcon } from '@/lib/config/products';

interface ProductCardProps {
  product: Product;
}

const iconMap: Record<ProductIcon, React.ElementType> = {
  syringe: Syringe,
  pill: Pill,
  activity: Activity,
  flask: FlaskConical,
};

export function ProductCard({ product }: ProductCardProps) {
  const Icon = iconMap[product.icon];

  return (
    <div
      className={`
        relative rounded-2xl border flex flex-col h-full overflow-hidden
        bg-white border-cultr-sage
        hover:border-cultr-forest/40 hover:shadow-lg
        transition-all duration-300 group
        ${product.isBestseller ? 'ring-1 ring-cultr-forest/30' : ''}
      `}
    >
      {/* Visual Header with Gradient */}
      <div className="relative h-32 bg-gradient-to-br from-cultr-sage via-cultr-mint to-cultr-sage">
        {/* Icon */}
        <div className="absolute bottom-4 left-6">
          <div className="w-14 h-14 rounded-xl bg-white/80 backdrop-blur-sm border border-cultr-sage flex items-center justify-center group-hover:border-cultr-forest/50 transition-colors">
            <Icon className="w-7 h-7 text-cultr-forest" />
          </div>
        </div>

        {/* Bestseller Badge */}
        {product.isBestseller && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-cultr-forest px-3 py-1 rounded-full">
            <Star className="w-3 h-3 text-white fill-white" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              Bestseller
            </span>
          </div>
        )}

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cultr-forest/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-cultr-forest/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-6 pt-4">
        {/* Product Name */}
        <h3 className="text-xl font-display font-bold text-cultr-text mb-2 group-hover:text-cultr-forest transition-colors">
          {product.name}
        </h3>

        {/* Price Teaser */}
        <div className="mb-3">
          <span className="text-cultr-forest font-display font-bold">
            {product.priceTeaser}
          </span>
        </div>

        {/* Description */}
        <p className="text-cultr-textMuted text-sm leading-relaxed mb-5">
          {product.description}
        </p>

        {/* Features */}
        <div className="flex-grow mb-6">
          <ul className="space-y-2">
            {product.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-cultr-textMuted">
                <Check className="w-4 h-4 text-cultr-forest shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <Link
          href={product.href}
          className="
            inline-flex items-center justify-center gap-2
            w-full py-3 px-6 rounded-full
            bg-cultr-forest text-white font-display font-medium
            hover:bg-cultr-forestDark
            transition-all duration-200
          "
        >
          Learn More
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
