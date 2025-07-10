// src/ai/flows/generate-answer.ts
'use server';

/**
 * @fileOverview An AI agent that answers questions based on multiple uploaded PDF documents.
 *
 * - generateAnswer - A function that handles the question answering process.
 * - GenerateAnswerInput - The input type for the generateAnswer function.
 * - GenerateAnswerOutput - The return type for the generateAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAnswerInputSchema = z.object({
  question: z.string().describe('The question to answer based on the PDF documents.'),
  pdfTexts: z.array(z.string()).describe('The extracted text content from the uploaded PDF documents.'),
});
export type GenerateAnswerInput = z.infer<typeof GenerateAnswerInputSchema>;

const GenerateAnswerOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the question based on the PDF documents.'),
});
export type GenerateAnswerOutput = z.infer<typeof GenerateAnswerOutputSchema>;

export async function generateAnswer(input: GenerateAnswerInput): Promise<GenerateAnswerOutput> {
  return generateAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAnswerPrompt',
  input: {schema: GenerateAnswerInputSchema},
  output: {schema: GenerateAnswerOutputSchema},
  prompt: `You are an AI assistant that answers questions based on the content of PDF documents.

You will receive a question and an array of text extracts from PDF documents. Your goal is to provide a concise and accurate answer to the question, using only the information provided in the documents.

Question: {{{question}}}

PDF Texts:
{{#each pdfTexts}}{{{this}}}
{{/each}}
`,
});

const generateAnswerFlow = ai.defineFlow(
  {
    name: 'generateAnswerFlow',
    inputSchema: GenerateAnswerInputSchema,
    outputSchema: GenerateAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
