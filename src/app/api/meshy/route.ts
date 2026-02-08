import { NextRequest, NextResponse } from 'next/server';
import { generateFollowUp } from '@/lib/architect/hf';
import { getMeshyVoiceEdge } from '@/lib/server/tts';

export async function POST(req: NextRequest) {
    try {
        const { action, question, transcript, text } = await req.json();

        if (action === 'evaluate') {
            const evaluation = await generateFollowUp(question, transcript);
            return NextResponse.json(evaluation);
        }

        if (action === 'tts') {
            const audioBlob = await getMeshyVoiceEdge(text);
            const arrayBuffer = await audioBlob.arrayBuffer();
            return new Response(arrayBuffer, {
                headers: { 'Content-Type': 'audio/mpeg' },
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Meshy API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
