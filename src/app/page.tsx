"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ArchitectForm } from '../components/architect/ArchitectForm';
import { FlowDisplay } from '../components/architect/FlowDisplay';
import { InterviewArchitectEngine } from '../lib/architect/engine';
import { HiringManagerIntent, InterviewFlow } from '../lib/types/interview';

export default function Home() {
  const [engine, setEngine] = useState<InterviewArchitectEngine | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlow, setGeneratedFlow] = useState<InterviewFlow | null>(null);

  useEffect(() => {
    // Initialize engine with the system prompt (simulated)
    const systemPrompt = `You are an AI Interview Architect...`;
    setEngine(new InterviewArchitectEngine(systemPrompt));
  }, []);

  const handleGenerate = async (intent: HiringManagerIntent) => {
    if (!engine) return;

    setIsGenerating(true);
    setGeneratedFlow(null);

    // Simulate network delay for "AI thinking"
    setTimeout(async () => {
      const flow = await engine.generateFlow(intent);
      setGeneratedFlow(flow);
      setIsGenerating(false);

      // Scroll to result
      setTimeout(() => {
        document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Input Form */}
        <div className="lg:col-span-12 xl:col-span-5 text-left">
          <div className="sticky top-10">
            <div className="mb-8">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">
                Step 1: Define Intent
              </span>
              <h2 className="text-4xl font-bold outfit tracking-tight">Construct your Flow</h2>
              <p className="text-muted-foreground mt-2 text-left">Specify the role and skills to generate a tailored interview script.</p>
            </div>

            <ArchitectForm onGenerate={handleGenerate} isLoading={isGenerating} />
          </div>
        </div>

        {/* Right: Results Area */}
        <div id="result-area" className="lg:col-span-12 xl:col-span-7">
          {!generatedFlow && !isGenerating && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center p-12 text-center opacity-40 group hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 rounded-2xl bg-secondary mb-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-bold outfit">Ready to start?</h3>
              <p className="max-w-xs mx-auto mt-2">Generated interview questions will appear here once you architect your intent.</p>
            </div>
          )}

          {isGenerating && (
            <div className="h-full min-h-[400px] rounded-3xl flex flex-col items-center justify-center p-12 text-center">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-4 bg-primary/10 rounded-full animate-pulse flex items-center justify-center">
                  <span className="text-2xl">🧠</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold outfit animate-pulse">Consulting the Architect...</h3>
              <p className="text-muted-foreground mt-2">Crafting progressive questions and evaluation criteria.</p>
            </div>
          )}

          {generatedFlow && (
            <div className="text-left">
              <div className="mb-8 flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest inline-block">
                  Step 2: Review Flow
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <FlowDisplay flow={generatedFlow} />
            </div>
          )}
        </div>
      </div>

      <footer className="mt-24 pt-12 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
        <p>© 2026 Intervu-AI • Powered by Advanced Agentic Coding</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Support</a>
        </div>
      </footer>
    </DashboardLayout>
  );
}
