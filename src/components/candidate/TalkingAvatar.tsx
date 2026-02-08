"use client";

import React, { useEffect, useState, useRef } from 'react';

interface TalkingAvatarProps {
    isSpeaking: boolean;
    className?: string;
}

export const TalkingAvatar: React.FC<TalkingAvatarProps> = ({
    isSpeaking,
    className = ""
}) => {
    const [mouthOpen, setMouthOpen] = useState(false);
    const [eyeBlink, setEyeBlink] = useState(false);
    const animationRef = useRef<NodeJS.Timeout | null>(null);
    const blinkRef = useRef<NodeJS.Timeout | null>(null);

    // Mouth animation when speaking
    useEffect(() => {
        if (isSpeaking) {
            const animateMouth = () => {
                setMouthOpen(prev => !prev);
                animationRef.current = setTimeout(animateMouth, 100 + Math.random() * 150);
            };
            animateMouth();
        } else {
            if (animationRef.current) clearTimeout(animationRef.current);
            setMouthOpen(false);
        }

        return () => {
            if (animationRef.current) clearTimeout(animationRef.current);
        };
    }, [isSpeaking]);

    // Eye blink animation
    useEffect(() => {
        const blink = () => {
            setEyeBlink(true);
            setTimeout(() => setEyeBlink(false), 150);
            blinkRef.current = setTimeout(blink, 2000 + Math.random() * 3000);
        };
        blinkRef.current = setTimeout(blink, 2000);

        return () => {
            if (blinkRef.current) clearTimeout(blinkRef.current);
        };
    }, []);

    return (
        <div className={`relative bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center ${className}`}>
            {/* Animated Avatar SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Background glow */}
                <defs>
                    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fad7a0" />
                        <stop offset="100%" stopColor="#f5cba7" />
                    </linearGradient>
                </defs>

                {/* Ambient glow when speaking */}
                {isSpeaking && (
                    <circle cx="50" cy="50" r="48" fill="url(#glow)" className="animate-pulse" />
                )}

                {/* Head */}
                <ellipse
                    cx="50" cy="50" rx="28" ry="32"
                    fill="url(#skinGradient)"
                    stroke="#d4a574"
                    strokeWidth="0.5"
                    className={`transition-transform duration-100 ${isSpeaking ? 'scale-[1.01]' : ''}`}
                />

                {/* Hair */}
                <path
                    d="M22 38 Q25 15 50 12 Q75 15 78 38 L75 30 Q70 20 50 18 Q30 20 25 30 Z"
                    fill="#2d1f1a"
                />
                <path d="M25 35 Q28 22 50 18 Q72 22 75 35" fill="#3d2f2a" />

                {/* Eyebrows */}
                <path
                    d={isSpeaking ? "M35 38 Q40 36 44 38" : "M35 39 Q40 37 44 39"}
                    stroke="#4a3728"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                />
                <path
                    d={isSpeaking ? "M56 38 Q60 36 65 38" : "M56 39 Q60 37 65 39"}
                    stroke="#4a3728"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Eyes */}
                <ellipse
                    cx="39" cy="45"
                    rx="5" ry={eyeBlink ? "0.5" : "4"}
                    fill="white"
                    className="transition-all duration-100"
                />
                <ellipse
                    cx="61" cy="45"
                    rx="5" ry={eyeBlink ? "0.5" : "4"}
                    fill="white"
                    className="transition-all duration-100"
                />

                {/* Pupils */}
                {!eyeBlink && (
                    <>
                        <circle cx="39" cy="45" r="2.5" fill="#2c1810" />
                        <circle cx="61" cy="45" r="2.5" fill="#2c1810" />
                        <circle cx="38" cy="44" r="0.8" fill="white" />
                        <circle cx="60" cy="44" r="0.8" fill="white" />
                    </>
                )}

                {/* Nose */}
                <path
                    d="M50 48 L48 56 Q50 58 52 56 L50 48"
                    fill="#e8c4a0"
                    stroke="#d4a574"
                    strokeWidth="0.3"
                />

                {/* Mouth */}
                <ellipse
                    cx="50" cy="66"
                    rx={mouthOpen ? "8" : "6"}
                    ry={mouthOpen ? "5" : "2"}
                    fill={mouthOpen ? "#8b0000" : "#cc6666"}
                    className="transition-all duration-75"
                />
                {mouthOpen && (
                    <>
                        {/* Teeth */}
                        <rect x="44" y="63" width="12" height="3" fill="white" rx="1" />
                        {/* Tongue hint */}
                        <ellipse cx="50" cy="69" rx="4" ry="2" fill="#ff6b6b" />
                    </>
                )}

                {/* Cheeks blush */}
                <circle cx="30" cy="55" r="4" fill="rgba(255, 182, 193, 0.3)" />
                <circle cx="70" cy="55" r="4" fill="rgba(255, 182, 193, 0.3)" />
            </svg>

            {/* Speaking indicator */}
            {isSpeaking && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 items-end h-3">
                    {[1, 2, 3, 2, 1].map((h, i) => (
                        <div
                            key={i}
                            className="w-0.5 bg-primary rounded-full animate-wave"
                            style={{
                                height: `${h * 25}%`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TalkingAvatar;
