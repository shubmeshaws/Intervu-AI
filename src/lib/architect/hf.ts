import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const generateFollowUp = async (question: string, transcript: string) => {
    const prompt = `
    You are Meshy, a professional and encouraging AI interviewer.
    The candidate was asked: "${question}"
    The candidate responded: "${transcript}"
    
    Evaluate the response. 
    - If it's vague, ask for specific technical details or examples.
    - If it's incomplete, ask for the missing part.
    - If it's strong and complete, respond with "STRONG_RESPONSE".
    
    Your response should be conversational, professional, and directly follow up on what they said. 
    Maintain a calm and technical tone.
    Do not exceed 30 words.
    `;

    const response = await hf.textGeneration({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        inputs: prompt,
        parameters: { max_new_tokens: 100, temperature: 0.7 }
    });

    const text = response.generated_text.replace(prompt, "").trim();

    if (text.includes("STRONG_RESPONSE")) {
        return { status: "strong", followUp: null };
    }

    return { status: "vague", followUp: text };
};

export const getMeshyVoice = async (text: string) => {
    const response = await hf.textToSpeech({
        model: "espnet/kan-bayashi_ljspeech_vits",
        inputs: text,
    });

    return response; // This is a Blob
};
