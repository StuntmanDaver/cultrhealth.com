import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center grad-light">
            <div className="space-y-6 max-w-lg">
                <div className="flex justify-center">
                    <div className="p-4 bg-brand-primary/5 rounded-full">
                        <Search className="w-12 h-12 text-brand-primary/40" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-6xl font-display font-bold text-brand-primary">
                    404
                </h1>

                <div className="space-y-2">
                    <h2 className="text-2xl font-display font-semibold text-brand-primary">
                        Protocol Not Found
                    </h2>
                    <p className="text-brand-primary/60 max-w-md mx-auto">
                        The optimization path you're looking for doesn't exist or has been relocated.
                        Let's get you back on track.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link
                        href="/"
                        className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary text-brand-cream font-medium rounded-full hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        Return Home
                    </Link>
                    <Link
                        href="/science"
                        className="w-full sm:w-auto px-8 py-3.5 border border-brand-primary/20 text-brand-primary font-medium rounded-full hover:bg-brand-primary/5 transition-all flex items-center justify-center gap-2 group"
                    >
                        Read Science
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Aesthetic Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />
        </div>
    );
}
