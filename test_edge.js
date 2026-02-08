const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');
const path = require('path');

const tts = new EdgeTTS({
    voice: 'en-US-AriaNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
});

async function run() {
    const outputPath = path.join('/tmp', 'test_edge.mp3');
    console.log("Generating audio to", outputPath);

    try {
        await tts.ttsPromise('Hello, this is a test of Edge TTS on Node.js', outputPath);
        console.log("Audio generated successfully!");

        // Check if file exists
        if (fs.existsSync(outputPath)) {
            const stats = fs.statSync(outputPath);
            console.log(`File size: ${stats.size} bytes`);
        } else {
            console.error("File not created!");
        }
    } catch (e) {
        console.error("Error generating audio:", e);
    }
}

run();
