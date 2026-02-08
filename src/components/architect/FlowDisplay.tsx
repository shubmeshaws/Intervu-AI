import React from 'react';
import { InterviewFlow } from '../../lib/types/interview';

interface FlowDisplayProps {
    flow: InterviewFlow;
}

export const FlowDisplay: React.FC<FlowDisplayProps> = ({ flow }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-bold outfit mb-1">Generated Interview Flow</h3>
                    <p className="text-muted-foreground">
                        {flow.questions.length} Questions • {flow.estimatedDurationMinutes} Minutes Total
                    </p>
                </div>
                <div className="flex gap-2">
                    {flow.intent.requiredSkills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-3 py-1 bg-secondary border border-border rounded-lg text-xs font-medium uppercase tracking-wider">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {flow.questions.map((q, index) => (
                    <div key={q.id} className="premium-card glass p-8 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />

                        <div className="flex justify-between items-start mb-4">
                            <span className="text-primary font-bold outfit text-lg uppercase tracking-widest opacity-50">
                                Question {index + 1}
                            </span>
                            <div className="flex gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${q.category === 'Technical' ? 'bg-blue-500/10 text-blue-400' :
                                        q.category === 'Behavioral' ? 'bg-purple-500/10 text-purple-400' :
                                            'bg-amber-500/10 text-amber-400'
                                    }`}>
                                    {q.category}
                                </span>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <div
                                            key={star}
                                            className={`w-1.5 h-1.5 rounded-full ${star <= q.difficulty ? 'bg-primary' : 'bg-primary/20'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="text-xl font-medium leading-relaxed mb-6">
                            {q.question}
                        </p>

                        {q.progressiveContext && (
                            <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl italic text-sm text-primary/80">
                                " {q.progressiveContext} "
                            </div>
                        )}

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Evaluation Criteria</h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                {q.evaluationCriteria.map((c, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <span className="text-primary mt-1">•</span>
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-8">
                <button className="px-10 py-4 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all shadow-2xl hover:scale-105 active:scale-95">
                    Export as PDF Guide
                </button>
            </div>
        </div>
    );
};
