import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const getMeshyVoiceEdge = async (text: string) => {
    try {
        const response = await openai.audio.speech.create({
            model: "tts-1",
            voice: "nova", // Clear, professional female voice
            input: text,
            response_format: "mp3",
        });

        // Convert the response to a Blob
        const buffer = Buffer.from(await response.arrayBuffer());
        return new Blob([buffer], { type: 'audio/mpeg' });
    } catch (error) {
        console.error("OpenAI TTS Error:", error);
        throw error;
    }
};
