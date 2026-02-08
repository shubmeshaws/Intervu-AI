"use client";

import React, { useState } from 'react';
import { HiringManagerIntent, InterviewLevel } from '../../lib/types/interview';

interface ArchitectFormProps {
    onGenerate: (intent: HiringManagerIntent) => void;
    isLoading: boolean;
}

export const ArchitectForm: React.FC<ArchitectFormProps> = ({ onGenerate, isLoading }) => {
    const [intent, setIntent] = useState<Partial<HiringManagerIntent>>({
        role: '',
        level: 'Senior',
        requiredSkills: [],
        focusAreas: [],
    });

    const [skillInput, setSkillInput] = useState('');
    const [focusInput, setFocusInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (intent.role) {
            onGenerate(intent as HiringManagerIntent);
        }
    };

    const addSkill = () => {
        if (skillInput && !intent.requiredSkills?.includes(skillInput)) {
            setIntent({ ...intent, requiredSkills: [...(intent.requiredSkills || []), skillInput] });
            setSkillInput('');
        }
    };

    const addFocus = () => {
        if (focusInput && !intent.focusAreas?.includes(focusInput)) {
            setIntent({ ...intent, focusAreas: [...(intent.focusAreas || []), focusInput] });
            setFocusInput('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl space-y-8 max-w-2xl">
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Role Title</label>
                <input
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={intent.role}
                    onChange={(e) => setIntent({ ...intent, role: e.target.value })}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-medium"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Experience Level</label>
                    <select
                        value={intent.level}
                        onChange={(e) => setIntent({ ...intent, level: e.target.value as InterviewLevel })}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium appearance-none"
                    >
                        {['Junior', 'Mid-level', 'Senior', 'Lead', 'Principal'].map(lvl => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Duration</label>
                    <div className="px-5 py-3.5 bg-secondary/30 rounded-xl border border-border text-muted-foreground font-medium">
                        Auto-calculated
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Required Skills</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add skill (e.g. React)"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-2 bg-secondary border border-border rounded-xl hover:bg-white/5 transition-all font-medium"
                    >
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                    {intent.requiredSkills?.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Focus Areas</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add focus area (e.g. Accessibility)"
                        value={focusInput}
                        onChange={(e) => setFocusInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFocus())}
                        className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <button
                        type="button"
                        onClick={addFocus}
                        className="px-4 py-2 bg-secondary border border-border rounded-xl hover:bg-white/5 transition-all font-medium"
                    >
                        Add
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                    {intent.focusAreas?.map(area => (
                        <span key={area} className="px-3 py-1 bg-secondary border border-border rounded-lg text-sm font-medium text-muted-foreground">
                            {area}
                        </span>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading || !intent.role}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 ${isLoading ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 hover:scale-[1.02]'
                    }`}
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating Flow...
                    </>
                ) : (
                    'Architect Interview'
                )}
            </button>
        </form>
    );
};
