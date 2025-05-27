
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
  plan: z.string().describe('The generated wellness plan in JSON format. This string MUST be parseable by JSON.parse().'),
});
export type GenerateWellnessPlanOutput = z.infer<typeof GenerateWellnessPlanOutputSchema>;

export async function generateWellnessPlan(input: GenerateWellnessPlanInput): Promise<GenerateWellnessPlanOutput> {
  return generateWellnessPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWellnessPlanPrompt',
  input: {schema: GenerateWellnessPlanInputSchema},
  output: {schema: GenerateWellnessPlanOutputSchema},
  prompt: `You are a wellness expert AI. Your task is to generate a personalized wellness plan.
The ENTIRE output from you MUST be a single, valid JSON object string.
Do NOT include any introductory text, concluding text, markdown formatting (like \`\`\`json ... \`\`\`), or any characters outside the main JSON object.
The output will be directly parsed by JSON.parse() in JavaScript, so it must be syntactically perfect.

Generate the plan based on the user's goals, diet preferences, and budget:
Goals: {{{goals}}}
Dietary Preferences: {{{dietPreferences}}}
Budget: {{{budget}}}

The wellness plan should be comprehensive and include meal suggestions, exercise routines, and mindfulness practices.

Follow this exact JSON structure:
{
  "meals": [
    { "day": "String - e.g., Monday", "breakfast": "String - e.g., Oatmeal with berries", "lunch": "String - e.g., Salad with grilled chicken", "dinner": "String - e.g., Salmon with roasted vegetables" },
    { "day": "String - e.g., Tuesday", "breakfast": "String - e.g., Smoothie", "lunch": "String - e.g., Leftover salmon", "dinner": "String - e.g., Chicken stir-fry" }
  ],
  "exercise": [
    { "day": "String - e.g., Monday", "activity": "String - e.g., 30-minute jog", "duration": "String - e.g., 30 minutes" },
    { "day": "String - e.g., Tuesday", "activity": "String - e.g., Yoga", "duration": "String - e.g., 60 minutes" }
  ],
  "mindfulness": [
    { "day": "String - e.g., Everyday", "practice": "String - e.g., Meditation", "duration": "String - e.g., 10 minutes" }
  ]
}

Ensure all string values within the JSON are properly escaped if they contain special characters (e.g., quotes, backslashes).
Pay meticulous attention to commas: ensure they are present between array elements and object properties, and NOT after the last element in an array or the last property in an object.
Ensure all brackets [] and braces {} are correctly paired and closed.
The output should start with { and end with }. No other text should precede or follow the JSON object.`,
});

const generateWellnessPlanFlow = ai.defineFlow(
  {
    name: 'generateWellnessPlanFlow',
    inputSchema: GenerateWellnessPlanInputSchema,
    outputSchema: GenerateWellnessPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure the output is not null or undefined before returning.
    // The schema validation on the prompt should handle this, but an extra check is safe.
    if (!output || typeof output.plan !== 'string') {
        throw new Error('AI did not return a valid plan string.');
    }
    return output;
  }
);

