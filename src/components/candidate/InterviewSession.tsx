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
        <div className="min-h-screen flex flex-col items-center justify-center py-8 max-w-4xl mx-auto w-full px-4">

            {/* Intro Screen */}
            {currentQuestionIndex === -1 && (
                <div className="text-center space-y-6 max-w-lg">
                    <div className="relative inline-block">
                        <div className={`w-24 h-24 rounded-full mx-auto overflow-hidden border-2 transition-all ${isSpeaking ? 'border-primary ring-4 ring-primary/30' : 'border-white/20'}`}>
                            <SimliAvatar
                                text={flow.questions[0]?.question || "Welcome!"}
                                isSpeaking={isSpeaking}
                                className="w-full h-full"
                            />
                        </div>
                        <span className="absolute -bottom-1 -right-2 bg-green-500 text-[9px] font-semibold px-2 py-0.5 rounded-full text-white">Online</span>
                    </div>
                    <div>
                        <p className="text-primary text-xs font-medium tracking-widest uppercase mb-1">AI Interviewer</p>
                        <h2 className="text-3xl font-bold">I'm Meshy.</h2>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Welcome! I'll guide you through the interview for the <strong>{flow.intent.role}</strong> role.
                    </p>
                    <button onClick={startInterview} className="w-full py-3 bg-white text-black rounded-lg font-semibold text-sm hover:bg-white/90 transition-all">
                        Start Interview
                    </button>
                </div>
            )}

            {/* Interview Session */}
            {currentQuestionIndex >= 0 && (
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Side-by-Side Video Panels */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* AI Avatar Panel */}
                            <div className={`relative aspect-video bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border transition-all ${isSpeaking ? 'border-primary ring-2 ring-primary/30' : 'border-white/10'}`}>
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
                                {/* AI Avatar HUD */}
                                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur rounded-full text-xs">
                                    <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-primary animate-pulse' : 'bg-gray-500'}`} />
                                    <span>Meshy {isSpeaking ? '• Speaking' : ''}</span>
                                </div>
                            </div>

                            {/* Candidate Video Panel */}
                            <div className={`relative aspect-video bg-black rounded-xl overflow-hidden border transition-all ${isRecording ? 'border-red-500/50 ring-2 ring-red-500/30' : 'border-white/10'}`}>
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                {/* Candidate HUD */}
                                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-black/70 backdrop-blur rounded-full text-xs">
                                    <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                                    <span>You {isRecording ? '• Recording' : ''}</span>
                                </div>
                                <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 backdrop-blur rounded-full text-xs font-mono">
                                    <span className={timeLeft < 20 ? 'text-red-400' : ''}>
                                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Live Transcript */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-lg min-h-[100px]">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Live Transcript</p>
                            <p className="text-sm text-white/80 leading-relaxed">
                                {transcript || <span className="italic text-muted-foreground">Your response will appear here...</span>}
                            </p>
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <button onClick={handleRetake} className="hover:text-primary transition-colors flex items-center gap-1">
                                ↺ Retake
                            </button>
                            <span>Q{currentQuestionIndex + 1} of {flow.questions.length}</span>
                        </div>
                    </div>

                    {/* Question Panel */}
                    <div className="space-y-5">
                        <div>
                            <p className="text-xs text-primary uppercase tracking-widest mb-2">
                                {followUpResponse ? 'Follow-up' : 'Question'}
                            </p>
                            <h3 className="text-xl font-semibold leading-snug">
                                {followUpResponse ? followUpResponse.followUp : currentQuestion?.question}
                            </h3>
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <p className="text-xs text-primary uppercase tracking-wider mb-1">Guidance</p>
                            <p className="text-sm text-muted-foreground italic">
                                "{followUpResponse ? "Provide specific details." : (currentQuestion?.progressiveContext || "Share your technical perspective.")}"
                            </p>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={isSpeaking}
                            className="w-full py-3 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {followUpResponse ? "Submit Clarification" : "Next Question"} →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
