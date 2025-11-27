#!/usr/bin/env node
const FormData = require('form-data');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

if (!process.env.ELEVENLABS_API_KEY) {
  console.error('ELEVENLABS_API_KEY is not set in .env.local');
  process.exit(1);
}

const API_KEY = process.env.ELEVENLABS_API_KEY.trim();
const AUDIO_URL = process.argv[2] || 'https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3';
const STT_OPTIONS = {
  modelId: 'scribe_v1',
  languageCode: 'eng',
  diarize: true,
  tagAudioEvents: true,
};

async function downloadAudio(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download audio. Status ${res.statusCode}`));
        return;
      }
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading sample audio...');
  const audioBuffer = await downloadAudio(AUDIO_URL);
  console.log('Downloaded', audioBuffer.length, 'bytes');

  const formData = new FormData();
  formData.append('file', audioBuffer, { filename: 'sample.mp3', contentType: 'audio/mpeg' });
  formData.append('model_id', STT_OPTIONS.modelId);
  formData.append('language_code', STT_OPTIONS.languageCode);
  formData.append('diarize', String(STT_OPTIONS.diarize));
  formData.append('tag_audio_events', String(STT_OPTIONS.tagAudioEvents));

  console.log('Sending request to ElevenLabs Speech-to-Text API...');
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text/convert', {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      ...(formData.getHeaders ? formData.getHeaders() : {}),
    },
    body: formData,
  });

  console.log('Status:', response.status, response.statusText);
  const body = await response.text();
  console.log('Response body:', body);
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
