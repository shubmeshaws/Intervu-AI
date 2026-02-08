"use client";

import React, { useState, useEffect, useRef } from 'react';
import { InterviewFlow } from '../../lib/types/interview';
import { SimliAvatar } from './SimliAvatar';

interface InterviewSessionProps {
    flow: InterviewFlow;
    onComplete: () => void;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({ flow, onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
    const [timeLeft, setTimeLeft] = useState(120);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const [followUpResponse, setFollowUpResponse] = useState<{ status: string; followUp?: string } | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);

    const currentQuestion = currentQuestionIndex >= 0 ? flow.questions[currentQuestionIndex] : null;

    // OpenAI TTS via API
    const speak = async (text: string) => {
        setIsSpeaking(true);

        try {
            const response = await fetch('/api/meshy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'tts', text })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);

                audio.onended = () => {
                    setIsSpeaking(false);
                    setIsRecording(true);
                    startTranscription();
                    URL.revokeObjectURL(audioUrl);
                };

                audio.onerror = () => {
                    console.error("Audio playback failed, using browser TTS");
                    fallbackSpeak(text);
                };

                await audio.play();
            } else {
                throw new Error("TTS API failed");
            }
        } catch (err) {
            console.error("OpenAI TTS failed, falling back to browser:", err);
            fallbackSpeak(text);
        }
    };

    // Browser TTS fallback
    const fallbackSpeak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
                setIsSpeaking(false);
                setIsRecording(true);
                startTranscription();
            };
            window.speechSynthesis.speak(utterance);
        } else {
            setIsSpeaking(false);
            setIsRecording(true);
            startTranscription();
        }
    };

    // Live Transcription using Web Speech API
    const startTranscription = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported");
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    setTranscript(prev => prev + result[0].transcript + ' ');
                } else {
                    interimTranscript += result[0].transcript;
                }
            }
        };

        recognition.onerror = (event: any) => {
            // 'no-speech' is normal when user is silent, ignore it
            if (event.error !== 'no-speech') {
                console.error("Speech recognition error", event.error);
            }
        };
        recognition.start();
        recognitionRef.current = recognition;
    };

    const stopTranscription = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    };

    // Camera Setup
    useEffect(() => {
        const setupCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setVideoStream(stream);
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Camera setup failed", err);
            }
        };
        setupCamera();

        return () => {
            if (videoStream) videoStream.getTracks().forEach(t => t.stop());
            if (timerRef.current) clearInterval(timerRef.current);
            stopTranscription();
        };
    }, []);

    // Ensure video element shows the stream when both are available
    useEffect(() => {
        if (videoRef.current && videoStream) {
            videoRef.current.srcObject = videoStream;
        }
    }, [videoStream]);

    // Timer
    useEffect(() => {
        if (isRecording && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            handleNext();
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRecording, timeLeft]);

    const startInterview = () => {
        setCurrentQuestionIndex(0);
        setTimeLeft(120);
        const firstQ = flow.questions[0];
        speak(firstQ.question);
    };

    const handleNext = async () => {
        stopTranscription();
        setIsRecording(false);
        let textToSpeak = "";
        let nextFollowUp = null;

        if (currentQuestionIndex >= 0 && !followUpResponse) {
            try {
                const response = await fetch('/api/meshy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'evaluate',
                        question: currentQuestion?.question || "",
                        transcript: transcript || "I think we used AWS S3 and some other tools."
                    })
                });

                if (response.ok) {
                    const evaluation = await response.json();
                    if (evaluation.status !== 'strong' && evaluation.followUp) {
                        nextFollowUp = evaluation;
                        textToSpeak = evaluation.followUp;
                        setFollowUpResponse(evaluation);
                        setTimeLeft(60);
                    }
                }
            } catch (err) {
                console.error("API Evaluation failed", err);
            }
        }

        if (!nextFollowUp) {
            setFollowUpResponse(null);
            setTranscript("");
            if (currentQuestionIndex < flow.questions.length - 1) {
                const nextIdx = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIdx);
                textToSpeak = flow.questions[nextIdx].question;
                setTimeLeft(120);
            } else {
                onComplete();
                return;
            }
        }

        if (textToSpeak) {
            speak(textToSpeak);
        }
    };

    const handleRetake = () => {
        setTranscript("");
        setTimeLeft(120);
        setIsRecording(true);
        setFollowUpResponse(null);
        startTranscription();
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center py-8 max-w-[1400px] mx-auto w-full px-6 overflow-x-hidden">

            {/* Background Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            {/* Intro Screen */}
            {currentQuestionIndex === -1 && (
                <div className="relative z-10 text-center space-y-8 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="relative inline-block">
                        <div className={`w-36 h-36 rounded-3xl mx-auto overflow-hidden border-2 transition-all duration-500 shadow-2xl ${isSpeaking ? 'border-primary ring-8 ring-primary/20 scale-105' : 'border-white/10'}`}>
                            <SimliAvatar
                                text={flow.questions[0]?.question || "Welcome!"}
                                isSpeaking={isSpeaking}
                                className="w-full h-full"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#050505]" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-primary text-sm font-bold opacity-80 uppercase tracking-[0.3em]">Neural Candidate Assessment</p>
                        <h2 className="text-6xl font-black tracking-tighter">I'm Meshy<span className="text-primary">.</span></h2>
                    </div>

                    <p className="text-gray-400 text-xl font-light leading-relaxed max-w-md mx-auto">
                        Ready to begin your technical evaluation for the <span className="text-white font-semibold">{flow.intent.role}</span> position?
                    </p>

                    <button
                        onClick={startInterview}
                        className="group relative w-full py-5 bg-primary text-white rounded-2xl font-black text-xl hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.5)] transition-all duration-500 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            INITIALIZE SESSION
                            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </button>
                </div>
            )}

            {/* Interview Session */}
            {currentQuestionIndex >= 0 && (
                <div className="relative z-10 w-full grid grid-cols-1 xl:grid-cols-12 gap-10 items-stretch h-full py-4">

                    {/* Visual Interaction Hub (Videos) */}
                    <div className="xl:col-span-8 flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                            {/* AI Avatar Panel */}
                            <div className={`relative min-h-[400px] bg-[#0A0A0A] rounded-[2.5rem] overflow-hidden border-2 transition-all duration-700 ${isSpeaking ? 'border-primary shadow-[0_0_60px_rgba(var(--primary-rgb),0.25)]' : 'border-white/5 shadow-2xl'}`}>
                                <SimliAvatar
                                    text={followUpResponse?.followUp || currentQuestion?.question || ""}
                                    isSpeaking={isSpeaking}
                                    onSpeakingEnd={() => {
                                        setIsSpeaking(false);
                                        setIsRecording(true);
                                        startTranscription();
                                    }}
                                    className="w-full h-full"
                                />

                                <div className="absolute top-6 left-6 flex items-center gap-3 px-5 py-2.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full">
                                    <div className="relative">
                                        <div className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-primary' : 'bg-gray-600'}`} />
                                        {isSpeaking && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary animate-ping" />}
                                    </div>
                                    <span className="text-[10px] font-black tracking-widest uppercase text-white/90">MESHY AI CORE</span>
                                </div>
                            </div>

                            {/* Candidate Video Panel */}
                            <div className={`relative min-h-[400px] bg-[#0A0A0A] rounded-[2.5rem] overflow-hidden border-2 transition-all duration-700 ${isRecording ? 'border-red-500/50 shadow-[0_0_60px_rgba(239,68,68,0.2)]' : 'border-white/5 shadow-2xl'}`}>
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />

                                <div className="absolute top-6 left-6 flex items-center gap-3 px-5 py-2.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full">
                                    <div className="relative">
                                        <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500' : 'bg-gray-600'}`} />
                                        {isRecording && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
                                    </div>
                                    <span className="text-[10px] font-black tracking-widest uppercase text-white/90">TRANSMITTING LIVE</span>
                                </div>

                                <div className="absolute top-6 right-6 px-5 py-2.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full text-[12px] font-black font-mono">
                                    <span className={timeLeft < 20 ? 'text-red-400 animate-pulse' : 'text-gray-300'}>
                                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>

                                {/* Bottom Visualization Overlay */}
                                {isRecording && (
                                    <div className="absolute bottom-6 left-6 right-6 flex items-center gap-1.5 h-10 px-6 bg-black/30 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                                        {[...Array(24)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="flex-grow bg-red-500/40 rounded-full animate-wave"
                                                style={{
                                                    height: `${30 + Math.random() * 70}%`,
                                                    animationDuration: `${0.6 + Math.random() * 0.4}s`,
                                                    animationDelay: `${i * 0.05}s`
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Analysis Hub (Transcript) */}
                        <div className="relative group bg-[#0A0A0A]/50 backdrop-blur-sm border border-white/5 rounded-[2rem] overflow-hidden transition-all duration-500 hover:border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Language Processing Pipeline</h3>
                                    </div>
                                    {isRecording && <span className="text-[10px] text-red-500 font-black tracking-widest animate-pulse tracking-tighter">● ACTIVE STREAM</span>}
                                </div>
                                <div className="relative">
                                    <p className="text-xl font-medium text-gray-200 leading-relaxed min-h-[100px] selection:bg-primary/30">
                                        {transcript || <span className="opacity-10 italic font-thin tracking-wide">Synthesizing audio data...</span>}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Controls & Stats Footer */}
                        <div className="flex items-center gap-10 px-4">
                            <button onClick={handleRetake} className="flex items-center gap-3 text-[11px] font-black tracking-[0.2em] text-gray-500 hover:text-white transition-all duration-300 group">
                                <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 group-hover:bg-red-500/10 group-hover:border-red-500/20 group-hover:text-red-500 transition-all duration-500">
                                    <svg className="w-5 h-5 group-hover:rotate-[-180deg] transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </span>
                                RESET SESSION
                            </button>
                            <div className="h-0.5 bg-gradient-to-r from-white/5 to-transparent flex-grow" />
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] font-black text-gray-600 tracking-widest uppercase">SEGMENT</span>
                                <span className="text-2xl font-black text-white/20 tabular-nums">0{currentQuestionIndex + 1}</span>
                                <span className="text-sm font-black text-gray-700">/</span>
                                <span className="text-sm font-black text-gray-700">0{flow.questions.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Question & Guidance Meta-Panel */}
                    <div className="xl:col-span-4 h-full">
                        <div className="sticky top-8 space-y-8">
                            <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] translate-x-10 translate-y-[-10]" />

                                <div className="space-y-10 relative z-10">
                                    <div className="space-y-6">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-black uppercase tracking-[0.2em]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            Active Inquiry
                                        </div>
                                        <h2 className="text-3xl font-black tracking-tight leading-[1.1] text-white">
                                            {currentQuestionIndex >= 0 ? flow.questions[currentQuestionIndex].question : ""}
                                        </h2>
                                    </div>

                                    <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/20 rounded-lg">
                                                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Strategy Insight</span>
                                        </div>
                                        <p className="text-base text-gray-400 font-medium leading-relaxed italic">
                                            {followUpResponse?.followUp ?
                                                "Address the specific point: \"" + followUpResponse.followUp + "\"" :
                                                "Demonstrate your decision-making process by exploring technical trade-offs."
                                            }
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="group w-full py-6 bg-white text-black rounded-[1.5rem] font-black text-base hover:bg-primary hover:text-white hover:shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] transition-all duration-500 flex items-center justify-center gap-4 overflow-hidden relative"
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            COMMIT & PROCEED
                                            <svg className="w-6 h-6 group-hover:translate-x-1.5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="px-8 flex items-center justify-between text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                <span>Security: Encrypted Node</span>
                                <span>v3.4.12-AES</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes wave {
                    0%, 100% { transform: scaleY(0.4); }
                    50% { transform: scaleY(1.0); }
                }
                .animate-wave {
                    animation: wave 1s ease-in-out infinite;
                }
                :root {
                    --primary: #6366f1;
                    --primary-rgb: 99, 102, 241;
                }
            `}</style>
        </div>
    );
};
