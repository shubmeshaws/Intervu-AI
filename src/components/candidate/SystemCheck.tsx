"use client";

import React, { useState, useRef, useEffect } from 'react';

interface SystemCheckProps {
    onProceed: () => void;
}

export const SystemCheck: React.FC<SystemCheckProps> = ({ onProceed }) => {
    const [step, setStep] = useState<'intro' | 'permissions' | 'ready'>('intro');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);

    const requestPermissions = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStep('ready');
        } catch (err) {
            setError('Camera or Microphone access denied. Please check your browser settings.');
        }
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return (
        <div className="max-w-xl mx-auto text-center space-y-10 py-12 animate-in fade-in zoom-in duration-700">
            {step === 'intro' && (
                <div className="space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-3xl">
                        👋
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold outfit">Welcome to your interview</h2>
                        <p className="text-muted-foreground">Before we begin, let's make sure your camera and microphone are working correctly.</p>
                    </div>
                    <button
                        onClick={() => setStep('permissions')}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/10"
                    >
                        Start System Check
                    </button>
                </div>
            )}

            {step === 'permissions' && (
                <div className="space-y-8">
                    <div className="aspect-video bg-secondary/50 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="font-medium">Requesting access...</p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">Waiting for permission</h3>
                        <p className="text-sm text-muted-foreground">Please click "Allow" when prompted by your browser to enable your camera and microphone.</p>
                    </div>
                    <button
                        onClick={requestPermissions}
                        className="px-8 py-3 bg-secondary border border-border rounded-xl hover:bg-white/5 transition-all text-sm font-bold"
                    >
                        Trigger Prompt Again
                    </button>
                    {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                </div>
            )}

            {step === 'ready' && (
                <div className="space-y-8">
                    <div className="relative aspect-video bg-black rounded-3xl border border-border overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover grayscale-[0.3]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center text-white/80">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                Live Preview
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold outfit">Looking good!</h3>
                        <p className="text-muted-foreground">Everything is set. Your interview will be recorded as you respond to the questions.</p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={onProceed}
                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/10"
                        >
                            Enter Interview Room
                        </button>
                        <p className="text-xs text-muted-foreground italic">By proceeding, you agree to the capture of audio and video for evaluation purposes.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
