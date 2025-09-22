
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Get API key from environment variables
// In Next.js, environment variables are loaded automatically
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "AIzaSyCLKXqG_Az4-dTpa-ZC0qHfl6J2Li6cqQ8";

if (!apiKey) {
  console.error('Environment variables available:', {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('API') || key.includes('GEMINI') || key.includes('GOOGLE'))
  });
  throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required');
}

// API key validation is handled by the error check above

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
});
