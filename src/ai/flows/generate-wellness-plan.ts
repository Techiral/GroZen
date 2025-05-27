'use server';

/**
 * @fileOverview Generates a personalized wellness plan based on user inputs.
 *
 * - generateWellnessPlan - A function that generates a personalized wellness plan.
 * - GenerateWellnessPlanInput - The input type for the generateWellnessPlan function.
 * - GenerateWellnessPlanOutput - The return type for the generateWellnessPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWellnessPlanInputSchema = z.object({
  goals: z
    .string()
    .describe("The user's wellness goals, e.g., 'lose weight, gain energy'."),
  dietPreferences: z
    .string()
    .describe("The user's dietary preferences, e.g., 'vegetarian, vegan, gluten-free'."),
  budget: z.string().describe("The user's budget, e.g., 'low, medium, high'."),
});
export type GenerateWellnessPlanInput = z.infer<typeof GenerateWellnessPlanInputSchema>;

const GenerateWellnessPlanOutputSchema = z.object({
  plan: z.string().describe('The generated wellness plan in JSON format.'),
});
export type GenerateWellnessPlanOutput = z.infer<typeof GenerateWellnessPlanOutputSchema>;

export async function generateWellnessPlan(input: GenerateWellnessPlanInput): Promise<GenerateWellnessPlanOutput> {
  return generateWellnessPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWellnessPlanPrompt',
  input: {schema: GenerateWellnessPlanInputSchema},
  output: {schema: GenerateWellnessPlanOutputSchema},
  prompt: `You are a wellness expert. Generate a personalized wellness plan in JSON format based on the user's goals, diet preferences, and budget.

Goals: {{{goals}}}
Dietary Preferences: {{{dietPreferences}}}
Budget: {{{budget}}}

Ensure the wellness plan is comprehensive and includes meal suggestions, exercise routines, and mindfulness practices. The JSON should be parsable by Javascript's JSON.parse.

Here's an example of the output format:

{
  "meals": [
    { "day": "Monday", "breakfast": "Oatmeal with berries", "lunch": "Salad with grilled chicken", "dinner": "Salmon with roasted vegetables" },
    { "day": "Tuesday", "breakfast": "Smoothie", "lunch": "Leftover salmon and vegetables", "dinner": "Chicken stir-fry" }
  ],
  "exercise": [
    { "day": "Monday", "activity": "30-minute jog", "duration": "30 minutes" },
    { "day": "Tuesday", "activity": "Yoga", "duration": "60 minutes" }
  ],
  "mindfulness": [
    { "day": "Everyday", "practice": "Meditation", "duration": "10 minutes" }
  ]
}

Wellness Plan:`,
});

const generateWellnessPlanFlow = ai.defineFlow(
  {
    name: 'generateWellnessPlanFlow',
    inputSchema: GenerateWellnessPlanInputSchema,
    outputSchema: GenerateWellnessPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
