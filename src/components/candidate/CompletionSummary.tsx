"use client";

import React from 'react';

export const CompletionSummary: React.FC = () => {
    return (
        <div className="max-w-2xl mx-auto py-20 text-center space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="relative inline-block">
                <div className="w-24 h-24 bg-emerald-500 rounded-[32px] mx-auto shadow-2xl flex items-center justify-center text-5xl">
                    ✨
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full border-4 border-background flex items-center justify-center">
                    <span className="text-xs">✓</span>
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-4xl font-bold outfit tracking-tight">Interview Complete</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    Great job! Your responses have been captured and sent to the hiring team for review.
                    You'll hear back from us soon.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-secondary/40 rounded-3xl border border-border text-left">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Next Steps</h4>
                    <p className="text-sm">Team review of technical and communication competencies.</p>
                </div>
                <div className="p-6 bg-secondary/40 rounded-3xl border border-border text-left">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Estimated Time</h4>
                    <p className="text-sm">Feedback usually arrives within 3 to 5 business days.</p>
                </div>
            </div>

            <div className="pt-8">
                <a
                    href="/"
                    className="px-10 py-4 bg-secondary border border-border rounded-2xl font-bold hover:bg-white/5 transition-all inline-block"
                >
                    Return to Dashboard
                </a>
            </div>
        </div>
    );
};
