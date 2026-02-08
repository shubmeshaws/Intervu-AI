import { InterviewArchitectEngine } from './engine';
import { HiringManagerIntent } from '../types/interview';
import fs from 'fs';
import path from 'path';

async function verify() {
    const promptPath = path.join(__dirname, 'prompt.md');
    const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

    const engine = new InterviewArchitectEngine(systemPrompt);

    const sampleIntents: (string | Partial<HiringManagerIntent>)[] = [
        {
            role: 'Senior Frontend Engineer',
            level: 'Senior',
            requiredSkills: ['React', 'Next.js', 'Performance'],
            focusAreas: ['Web Vitals', 'State Management']
        },
        "Role: Backend Lead, Level: Lead, Skills: Go, Kubernetes, PostgreSQL, Focus: Scalability, Microservices"
    ];

    console.log("Starting Verification...\n");

    for (const intentInput of sampleIntents) {
        console.log(`Testing Intent: ${JSON.stringify(intentInput)}`);
        const intent = await engine.parseIntent(intentInput);
        console.log(`Parsed Intent: ${intent.role} (${intent.level})`);

        const flow = await engine.generateFlow(intent);
        console.log(`Generated Flow with ${flow.questions.length} questions.`);
        console.log(`Estimated Duration: ${flow.estimatedDurationMinutes} mins`);

        flow.questions.forEach((q, i) => {
            console.log(`  [Q${i + 1}] ${q.category} (${q.difficulty} stars): ${q.question.substring(0, 50)}...`);
        });
        console.log("-------------------\n");
    }
}

verify().catch(console.error);
