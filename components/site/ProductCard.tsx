import Link from 'next/link';
import { ArrowRight, Syringe, Pill, Activity, FlaskConical } from 'lucide-react';
import type { Product, ProductIcon } from '@/lib/config/products';

interface ProductCardProps {
  product: Product;
  colorVariant?: 'blue' | 'green' | 'orange';
}

const iconMap: Record<ProductIcon, React.ElementType> = {
  syringe: Syringe,
  pill: Pill,
  activity: Activity,
  flask: FlaskConical,
};

const colorVariants = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  orange: 'bg-orange-100',
};

const auraColors = {
  blue: 'from-blue-400 to-purple-300',
  green: 'from-emerald-400 to-green-300',
  orange: 'from-orange-400 to-yellow-300',
};

const glowColors = {
  blue: 'hover:shadow-blue-200/50',
  green: 'hover:shadow-emerald-200/50',
  orange: 'hover:shadow-orange-200/50',
};

export function ProductCard({ product, colorVariant = 'blue' }: ProductCardProps) {
  const Icon = iconMap[product.icon];

  return (
    <div
      className={`
        relative rounded-2xl flex flex-col h-full overflow-hidden
        transition-all duration-300 ease-out group
        hover:-translate-y-2 hover:shadow-2xl
        ${colorVariants[colorVariant]}
        ${glowColors[colorVariant]}
      `}
    >
      {/* Aura Icon */}
      <div className="pt-8 px-8">
        <div 
          className={`
            w-16 h-16 rounded-full bg-gradient-to-br ${auraColors[colorVariant]} 
            blur-sm opacity-80 transition-all duration-500 ease-out
            group-hover:scale-125 group-hover:opacity-100
          `} 
        />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-8 pt-4">
        {/* Product Name */}
        <h3 className="text-2xl font-display text-stone-900 mb-3 transition-transform duration-300 group-hover:translate-x-1">
          {product.name}
          <br />
          <span className="text-stone-600">Tests</span>
        </h3>

        {/* Description */}
        <p className="text-stone-600 text-sm leading-relaxed mb-auto">
          {product.description}
        </p>

        {/* CTA */}
        <Link
          href={product.href}
          className="
            inline-flex items-center justify-center gap-2
            w-full py-3.5 px-6 rounded-full mt-6
            bg-black text-white font-medium text-sm
            hover:bg-stone-800 hover:scale-[1.03]
            active:scale-[0.98]
            transition-all duration-200
          "
        >
          {product.isBestseller ? 'Shop Now' : 'Pre-order'}
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
