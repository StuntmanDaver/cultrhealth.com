'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center grad-light">
            <div className="space-y-6 max-w-lg">
                <div className="flex justify-center">
                    <div className="p-4 bg-red-500/5 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-red-500/40" />
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-display font-bold text-brand-primary">
                    System Interruption
                </h1>

                <div className="space-y-2">
                    <p className="text-brand-primary/60 max-w-md mx-auto leading-relaxed">
                        A temporary disruption occurred in the optimization sequence.
                        Our team has been notified.
                    </p>
                    {error.digest && (
                        <p className="text-[10px] font-mono text-brand-primary/30 mt-4 uppercase tracking-widest">
                            Error Profile: {error.digest}
                        </p>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                        onClick={() => reset()}
                        className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary text-brand-cream font-medium rounded-full hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Resume Protocol
                    </button>
                    <a
                        href="mailto:support@cultrhealth.com"
                        className="w-full sm:w-auto px-8 py-3.5 border border-brand-primary/20 text-brand-primary font-medium rounded-full hover:bg-brand-primary/5 transition-all flex items-center justify-center gap-2 group"
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
}
