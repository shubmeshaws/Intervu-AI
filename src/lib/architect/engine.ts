import { HiringManagerIntent, InterviewFlow, InterviewQuestion } from '../types/interview';

export class InterviewArchitectEngine {
    private systemPrompt: string;

    constructor(systemPrompt: string) {
        this.systemPrompt = systemPrompt;
    }

    /**
     * Parses raw text or a basic object into a structured HiringManagerIntent.
     */
    public async parseIntent(input: string | Partial<HiringManagerIntent>): Promise<HiringManagerIntent> {
        // In a real implementation, this would involve an LLM call to structure the input.
        // For this demonstration, we'll provide a sophisticated mock or basic logic.
        if (typeof input === 'string') {
            // Basic extraction logic if it's a string
            return {
                role: input.match(/role:?\s*(.*?)($|\n)/i)?.[1] || 'Software Engineer',
                level: (input.match(/level:?\s*(Senior|Junior|Mid-level|Lead|Principal)/i)?.[1] as any) || 'Senior',
                requiredSkills: input.match(/skills:?\s*(.*?)($|\n)/i)?.[1]?.split(',').map(s => s.trim()) || ['React', 'TypeScript'],
                focusAreas: input.match(/focus:?\s*(.*?)($|\n)/i)?.[1]?.split(',').map(s => s.trim()) || ['Problem Solving'],
            };
        }

        return {
            role: input.role || 'Software Engineer',
            level: input.level || 'Senior',
            requiredSkills: input.requiredSkills || [],
            focusAreas: input.focusAreas || [],
            additionalContext: input.additionalContext,
        };
    }

    /**
     * Generates a structured InterviewFlow based on the intent.
     */
    public async generateFlow(intent: HiringManagerIntent): Promise<InterviewFlow> {
        // This would be the core LLM call using the system prompt and the intent.
        // I'll simulate a structured response here that follows the Architect's principles.

        const questions: InterviewQuestion[] = [
            {
                id: '1',
                question: `Can you walk me through a complex ${intent.requiredSkills[0] || 'technical'} challenge you solved recently? I'm particularly interested in how you approached the trade-offs and what the final outcome was.`,
                category: 'Communication',
                difficulty: 2,
                evaluationCriteria: [
                    'Clarity of explanation',
                    'Structured thinking (Situation, Task, Action, Result)',
                    'Ability to articulate trade-offs'
                ]
            },
            {
                id: '2',
                question: `Given the ${intent.level} nature of this role, how do you ensure the code you and your team write is both performant and maintainable in the long run?`,
                category: 'Technical',
                difficulty: 3,
                progressiveContext: 'Following up on your experience with complex challenges, let\'s dive into your approach to quality.',
                evaluationCriteria: [
                    'Knowledge of design patterns',
                    'Understanding of performance profiling',
                    'Strategy for code reviews and documentation'
                ]
            }
        ];

        // Add role-specific questions
        if (intent.role.toLowerCase().includes('frontend')) {
            questions.push({
                id: '3',
                question: "When building a highly interactive UI component, how do you handle state synchronization across different parts of the application while maintaining a smooth 60fps experience?",
                category: 'Technical',
                difficulty: 4,
                evaluationCriteria: [
                    'Deep understanding of state management (e.g., Context, Redux, Signals)',
                    'Knowledge of browser rendering pipeline',
                    'Optimization techniques (memoization, debouncing)'
                ]
            });
        }

        return {
            id: Math.random().toString(36).substring(7),
            intent,
            questions,
            estimatedDurationMinutes: questions.length * 15 // Assuming ~15 mins per deep dive
        };
    }

    /**
     * Evaluates a candidate's response based on vagueness, completeness, and strength.
     * In production, this would use the interviewer-prompt.md rules.
     */
    public async evaluateResponse(question: string, response: string): Promise<{
        status: 'vague' | 'incomplete' | 'strong';
        followUp?: string;
    }> {
        try {
            // Using dynamic import to avoid potential circular dependencies or missing polyfills in Node/Browser mix
            const { generateFollowUp } = require('./hf');
            return await generateFollowUp(question, response);
        } catch (error) {
            console.error("HF Inference failed, falling back to simulation", error);
            // Simulated evaluation logic for the prototype fallback
            if (!response || response.trim().length < 40) {
                return {
                    status: 'incomplete',
                    followUp: "I appreciate the start of that answer. Could you provide a more concrete example or perhaps go into more detail on the specific outcome?"
                };
            }

            const vagueKeywords = ['maybe', 'probably', 'sometimes', 'think', 'sort of'];
            const isVague = vagueKeywords.some(word => response.toLowerCase().includes(word));

            if (isVague) {
                return {
                    status: 'vague',
                    followUp: "I see what you mean. Could you clarify the specific decision-making process or the exact technical constraints you encountered?"
                };
            }

            return { status: 'strong' };
        }
    }
}
