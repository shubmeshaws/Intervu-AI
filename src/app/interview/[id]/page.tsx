"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { SystemCheck } from '../../../components/candidate/SystemCheck';
import { InterviewSession } from '../../../components/candidate/InterviewSession';
import { CompletionSummary } from '../../../components/candidate/CompletionSummary';
import { InterviewArchitectEngine } from '../../../lib/architect/engine';
import { InterviewFlow } from '../../../lib/types/interview';

export default function InterviewPage() {
    const { id } = useParams();
    const [phase, setPhase] = useState<'check' | 'session' | 'complete'>('check');
    const [flow, setFlow] = useState<InterviewFlow | null>(null);

    useEffect(() => {
        // Simulated fetch of the interview flow based on 'id'
        // For now, we generate a mock one using our engine
        const engine = new InterviewArchitectEngine("");
        engine.generateFlow({
            role: 'DevOps Engineer',
            level: 'Senior',
            requiredSkills: ['AWS', 'Networking', 'Linux'],
            focusAreas: ['Scalability', 'Automated Infrastructure'],
        }).then(setFlow);
    }, [id]);

    return (
        <div className="bg-[#0a0a0c] text-slate-100 min-h-screen flex flex-col font-sans selection:bg-primary/30">

            {/* Subtle background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
            </div>

            <header className="p-8 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-[10px] font-bold text-white">I</div>
                    <span className="text-sm font-bold tracking-tight outfit opacity-60">Intervu-AI Candidate Portal</span>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Interview ID: {id}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {phase === 'check' && (
                    <SystemCheck onProceed={() => setPhase('session')} />
                )}

                {phase === 'session' && flow && (
                    <InterviewSession
                        flow={flow}
                        onComplete={() => setPhase('complete')}
                    />
                )}

                {phase === 'complete' && (
                    <CompletionSummary />
                )}
            </main>

            <footer className="p-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest opacity-40 relative z-10">
                Secure Session • AI Proctoring Active
            </footer>
        </div>
    );
}
