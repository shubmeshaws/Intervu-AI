#!/usr/bin/env node

/**
 * API Key Validation Script
 * Usage: node scripts/validate-keys.js
 * 
 * Validates all API keys in .env.local:
 * - OpenAI API Key (for TTS)
 * - Hugging Face API Key (for AI evaluation)
 * - Simli API Key (for avatar)
 */

require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const SIMLI_API_KEY = process.env.NEXT_PUBLIC_SIMLI_API_KEY;
const SIMLI_FACE_ID = process.env.NEXT_PUBLIC_SIMLI_FACE_ID;

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bold}${msg}${colors.reset}`)
};

async function validateOpenAI() {
    log.header('🤖 OpenAI API Key');

    if (!OPENAI_API_KEY) {
        log.error('OPENAI_API_KEY not found in .env.local');
        return false;
    }

    if (!OPENAI_API_KEY.startsWith('sk-')) {
        log.error('OPENAI_API_KEY should start with "sk-"');
        return false;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            }
        });

        if (response.ok) {
            log.success('OpenAI API key is valid!');

            // Test TTS specifically
            const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    voice: 'nova',
                    input: 'Test'
                })
            });

            if (ttsResponse.ok) {
                log.success('TTS endpoint accessible!');
            } else {
                const err = await ttsResponse.json();
                log.warn(`TTS endpoint issue: ${err.error?.message || 'Unknown error'}`);
            }
            return true;
        } else {
            const error = await response.json();
            log.error(`OpenAI API key invalid: ${error.error?.message || 'Unknown error'}`);
            return false;
        }
    } catch (err) {
        log.error(`Failed to connect to OpenAI: ${err.message}`);
        return false;
    }
}

async function validateHuggingFace() {
    log.header('🤗 Hugging Face API Key');

    if (!HUGGINGFACE_API_KEY) {
        log.error('HUGGINGFACE_API_KEY not found in .env.local');
        return false;
    }

    if (!HUGGINGFACE_API_KEY.startsWith('hf_')) {
        log.warn('HUGGINGFACE_API_KEY typically starts with "hf_" - yours might be invalid');
    }

    try {
        const response = await fetch('https://huggingface.co/api/whoami-v2', {
            headers: {
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            }
        });

        if (response.ok) {
            const data = await response.json();
            log.success(`Hugging Face API key is valid! User: ${data.name || data.id || 'Unknown'}`);
            return true;
        } else {
            log.error('Hugging Face API key is invalid');
            return false;
        }
    } catch (err) {
        log.error(`Failed to connect to Hugging Face: ${err.message}`);
        return false;
    }
}

async function validateSimli() {
    log.header('🎭 Simli API Key');

    if (!SIMLI_API_KEY) {
        log.error('NEXT_PUBLIC_SIMLI_API_KEY not found in .env.local');
        return false;
    }

    if (!SIMLI_FACE_ID) {
        log.warn('NEXT_PUBLIC_SIMLI_FACE_ID not found - avatar may not work');
    } else {
        log.info(`Face ID configured: ${SIMLI_FACE_ID.substring(0, 8)}...`);
    }

    // Simli doesn't have a simple validation endpoint, so we just check format
    if (SIMLI_API_KEY.length > 10) {
        log.success('Simli API key format looks valid');
        log.info('Note: Full Simli validation requires WebSocket connection (tested at runtime)');
        return true;
    } else {
        log.error('Simli API key appears too short');
        return false;
    }
}

async function main() {
    console.log(`${colors.bold}╔════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}║     API Key Validation Script          ║${colors.reset}`);
    console.log(`${colors.bold}╚════════════════════════════════════════╝${colors.reset}`);

    const results = {
        openai: await validateOpenAI(),
        huggingface: await validateHuggingFace(),
        simli: await validateSimli()
    };

    log.header('📊 Summary');
    console.log('─'.repeat(40));

    const all = Object.values(results).every(Boolean);

    Object.entries(results).forEach(([key, valid]) => {
        const icon = valid ? colors.green + '✓' : colors.red + '✗';
        console.log(`  ${icon}${colors.reset} ${key.toUpperCase()}`);
    });

    console.log('─'.repeat(40));

    if (all) {
        log.success('All API keys are valid! 🎉');
    } else {
        log.error('Some API keys need attention. See details above.');
        process.exit(1);
    }
}

main().catch(console.error);
