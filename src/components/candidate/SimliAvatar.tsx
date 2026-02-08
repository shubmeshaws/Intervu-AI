"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SimliClient } from 'simli-client';
import TalkingAvatar from './TalkingAvatar';

interface SimliAvatarProps {
    text: string;
    isSpeaking: boolean;
    onSpeakingEnd?: () => void;
    className?: string;
}

const SIMLI_API_KEY = process.env.NEXT_PUBLIC_SIMLI_API_KEY || '';
const SIMLI_FACE_ID = process.env.NEXT_PUBLIC_SIMLI_FACE_ID || 'default_face_id';

export const SimliAvatar: React.FC<SimliAvatarProps> = ({
    text,
    isSpeaking,
    onSpeakingEnd,
    className = ""
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const simliClientRef = useRef<SimliClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const onSpeakingEndRef = useRef(onSpeakingEnd);

    // Keep the ref updated with the latest prop
    useEffect(() => {
        onSpeakingEndRef.current = onSpeakingEnd;
    }, [onSpeakingEnd]);

    // Initialize Simli Client
    useEffect(() => {
        if (!SIMLI_API_KEY) {
            setError("Simli API key not configured");
            return;
        }

        const initSimli = async () => {
            if (!videoRef.current || !audioRef.current) {
                setError("Video/Audio elements not ready");
                return;
            }

            // Set a timeout to trigger fallback if Simli takes too long to connect
            const timeoutId = setTimeout(() => {
                if (!isConnected && !simliClientRef.current) {
                    console.warn("Simli connection timed out, falling back to custom avatar");
                    setError("Simli connection timed out");
                }
            }, 5000);

            try {
                const simliClient = new SimliClient();

                simliClient.Initialize({
                    apiKey: SIMLI_API_KEY,
                    faceID: SIMLI_FACE_ID,
                    handleSilence: true,
                    maxSessionLength: 3600,
                    maxIdleTime: 600,
                    videoRef: videoRef.current,
                    audioRef: audioRef.current,
                    enableConsoleLogs: false, // Cleaner console
                } as any);

                // Add event listeners for perfect audio/video sync
                // 'speaking' triggers when audio actually starts playing
                simliClient.on('speaking', () => {
                    console.log("Simli: speaking started");
                    setIsAnimating(true);
                });

                // 'silent' triggers when audio finishes playing
                simliClient.on('silent', () => {
                    console.log("Simli: silent started");
                    setIsAnimating(false);
                    onSpeakingEndRef.current?.();
                });

                // Listen for initialization success or failure
                try {
                    await simliClient.start();
                    clearTimeout(timeoutId);
                    simliClientRef.current = simliClient;
                    setIsConnected(true);
                    console.log("Simli client connected successfully");
                } catch (startErr: any) {
                    clearTimeout(timeoutId);
                    const errorMsg = startErr?.message || String(startErr);
                    console.error("Simli start failed:", errorMsg);

                    // If it's a face ID issue, fail fast
                    if (errorMsg.includes("Invalid face ID")) {
                        setError("Invalid Simli Face ID. Please check your dashboard.");
                    } else {
                        setError("Failed to start Simli session");
                    }
                }
            } catch (err) {
                clearTimeout(timeoutId);
                console.error("Simli initialization exception:", err);
                setError("Failed to initialize Simli");
            }
        };

        initSimli();

        return () => {
            if (simliClientRef.current) {
                try {
                    simliClientRef.current.close();
                } catch (e) {
                    // Ignore errors during cleanup (e.g., WebSocket still connecting)
                    console.debug("Simli cleanup:", e);
                }
            }
        };
    }, []);

    // Convert text to audio and send to Simli
    const speakText = useCallback(async (textToSpeak: string) => {
        if (!simliClientRef.current || !isConnected) return;

        try {
            // Use the fetch API to get TTS audio from our API route
            const response = await fetch('/api/meshy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'tts', text: textToSpeak })
            });

            if (!response.ok) {
                throw new Error("TTS failed");
            }

            const audioBlob = await response.blob();
            const arrayBuffer = await audioBlob.arrayBuffer();

            // Convert to PCM16 format at 16KHz (Simli requirement)
            const audioContext = new AudioContext({ sampleRate: 16000 });
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Get raw PCM data
            const pcmData = audioBuffer.getChannelData(0);

            // Convert Float32 to Int16 (PCM16)
            const pcm16Data = new Int16Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) {
                const s = Math.max(-1, Math.min(1, pcmData[i]));
                pcm16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Send to Simli - NO manual animation trigger here anymore.
            // The 'speaking' event listener above will handle it when audio starts.
            simliClientRef.current.sendAudioData(new Uint8Array(pcm16Data.buffer));

        } catch (err) {
            console.error("Error sending audio to Simli:", err);
            // Fallback to browser TTS (immediate sync)
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.onstart = () => setIsAnimating(true);
                utterance.onend = () => {
                    setIsAnimating(false);
                    onSpeakingEndRef.current?.();
                };
                window.speechSynthesis.speak(utterance);
            }
        }
    }, [isConnected]);

    // Trigger speech when text changes and isSpeaking is true
    useEffect(() => {
        if (isSpeaking && text) {
            speakText(text);
        }
    }, [text, isSpeaking, speakText]);

    // Track if video is actually playing (has video content)
    const [hasVideoContent, setHasVideoContent] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const checkVideoContent = () => {
            // Video has content if it has valid dimensions and is not paused
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                setHasVideoContent(true);
            }
        };

        video.addEventListener('playing', checkVideoContent);
        video.addEventListener('loadeddata', checkVideoContent);

        return () => {
            video.removeEventListener('playing', checkVideoContent);
            video.removeEventListener('loadeddata', checkVideoContent);
        };
    }, []);

    // Show video only when we have actual content
    const showVideo = isConnected && hasVideoContent && !error;

    // Always render the video/audio elements so Simli can attach to them
    // Show TalkingAvatar as overlay while waiting for connection
    return (
        <div className={`relative overflow-hidden bg-black ${className}`}>
            {/* Hidden video/audio elements for Simli to use */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${showVideo ? 'block' : 'hidden'}`}
            />
            <audio ref={audioRef} autoPlay />

            {/* Show TalkingAvatar when Simli is not connected, has no video, or has an error */}
            {!showVideo && (
                <div className="absolute inset-0">
                    <TalkingAvatar
                        isSpeaking={isAnimating}
                        className="w-full h-full"
                    />
                </div>
            )}
        </div>
    );
};

export default SimliAvatar;
