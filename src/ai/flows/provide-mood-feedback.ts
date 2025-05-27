
'use server';
/**
 * @fileOverview Provides empathetic feedback based on user's mood and notes.
 *
 * - provideMoodFeedback - A function that generates an empathetic comment.
 * - ProvideMoodFeedbackInput - The input type for the function.
 * - ProvideMoodFeedbackOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideMoodFeedbackInputSchema = z.object({
  mood: z.string().describe("The user's logged mood, typically an emoji."),
  notes: z.string().optional().describe("Optional notes provided by the user about their mood."),
});
export type ProvideMoodFeedbackInput = z.infer<typeof ProvideMoodFeedbackInputSchema>;

const ProvideMoodFeedbackOutputSchema = z.object({
  feedback: z.string().describe('A short, empathetic, and supportive comment based on the user\'s mood and notes.'),
});
export type ProvideMoodFeedbackOutput = z.infer<typeof ProvideMoodFeedbackOutputSchema>;

export async function provideMoodFeedback(input: ProvideMoodFeedbackInput): Promise<ProvideMoodFeedbackOutput> {
  return provideMoodFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideMoodFeedbackPrompt',
  input: {schema: ProvideMoodFeedbackInputSchema},
  output: {schema: ProvideMoodFeedbackOutputSchema},
  prompt: `You are an empathetic wellness companion AI. The user has just logged their mood.
User's Mood: {{{mood}}}
User's Notes: {{#if notes}}{{{notes}}}{{else}}No additional notes provided.{{/if}}

Your task is to provide a short (1-2 sentences maximum), supportive, and encouraging comment.
- If the mood is positive, reinforce that feeling.
- If the mood is negative, offer gentle understanding and a positive perspective or a small, actionable self-care tip if appropriate (e.g., "taking a few deep breaths", "a short walk").
- If notes are provided, try to acknowledge them subtly in your feedback if it makes sense.
- Avoid generic platitudes. Aim for sincerity and conciseness.
- Do not ask questions. Provide a statement.
- Do not repeat the user's mood or notes back to them unless it's a natural part of your empathetic comment.

Example for positive mood: "It's wonderful you're feeling {{{mood}}}! Keep embracing that positive energy."
Example for negative mood (e.g., 😞) with notes "stressed about work": "It's okay to feel 😞 when work is stressful. Remember to take small breaks, even a few deep breaths can help."
Example for neutral mood (e.g., 😐) "Just a regular day": "Thanks for checking in. Even on regular days, acknowledging your feelings is a good practice."

Generate the feedback now.`,
});

const provideMoodFeedbackFlow = ai.defineFlow(
  {
    name: 'provideMoodFeedbackFlow',
    inputSchema: ProvideMoodFeedbackInputSchema,
    outputSchema: ProvideMoodFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('AI did not return valid feedback.');
    }
    return output;
  }
);
