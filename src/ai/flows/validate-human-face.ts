
'use server';
/**
 * @fileOverview Validates if an uploaded image contains a human face using AI.
 *
 * - validateHumanFace - A function that calls the Genkit flow.
 * - ValidateHumanFaceInput - The input type for the function.
 * - ValidateHumanFaceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateHumanFaceInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The image to validate, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ValidateHumanFaceInput = z.infer<typeof ValidateHumanFaceInputSchema>;

const ValidateHumanFaceOutputSchema = z.object({
  isHumanFace: z.boolean().describe('True if a human face is detected, false otherwise.'),
  reason: z.string().describe('A brief explanation for the validation result, e.g., "Human face detected.", "No human face found.", "Image unclear."'),
});
export type ValidateHumanFaceOutput = z.infer<typeof ValidateHumanFaceOutputSchema>;

export async function validateHumanFace(input: ValidateHumanFaceInput): Promise<ValidateHumanFaceOutput> {
  return validateHumanFaceFlow(input);
}

// You might need to adjust the model if 'gemini-pro-vision' is not the exact one
// or if your default genkit.ts model doesn't support vision with media like this.
// 'gemini-1.5-flash-latest' is also a good candidate.
const validateHumanFacePrompt = ai.definePrompt({
  name: 'validateHumanFacePrompt',
  input: {schema: ValidateHumanFaceInputSchema},
  output: {schema: ValidateHumanFaceOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest', // Or 'googleai/gemini-pro-vision' if preferred and configured
  config: {
    temperature: 0.2, // Lower temperature for more deterministic response
    safetySettings: [ // Adjust safety settings if they are too restrictive for face images
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
  prompt: `Analyze the provided image: {{media url=imageDataUri}}
Your task is to determine if the image predominantly features a clear, unobscured human face.
Respond with 'isHumanFace: true' if a human face is the main subject and reasonably clear.
Respond with 'isHumanFace: false' if no human face is detected, if the face is heavily obscured (e.g., by a mask, very dark shadows, extreme angle), if it's an animal, cartoon, or object.
Provide a very brief 'reason'.

Examples:
- If a clear photo of a person's face: { "isHumanFace": true, "reason": "Clear human face detected." }
- If a picture of a cat: { "isHumanFace": false, "reason": "Image appears to be an animal, not a human face." }
- If a blurry photo where a face is indistinct: { "isHumanFace": false, "reason": "Face is unclear or too blurry." }
- If an abstract image: { "isHumanFace": false, "reason": "No discernible human face found." }
- If a person wearing a full-face helmet or masquerade mask: { "isHumanFace": false, "reason": "Face is heavily obscured." }

Output ONLY the JSON object.`,
});

const validateHumanFaceFlow = ai.defineFlow(
  {
    name: 'validateHumanFaceFlow',
    inputSchema: ValidateHumanFaceInputSchema,
    outputSchema: ValidateHumanFaceOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await validateHumanFacePrompt(input);
      if (!output || typeof output.isHumanFace !== 'boolean' || typeof output.reason !== 'string') {
        console.error('validateHumanFaceFlow: AI did not return a valid validation object. Output:', output);
        // Fallback in case of malformed AI response
        return { isHumanFace: false, reason: 'AI validation response was malformed.' };
      }
      return output;
    } catch (error) {
      console.error('validateHumanFaceFlow: Error during AI call or processing. Input:', input, 'Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown AI error.';
      // Check for specific Gemini error types if needed, e.g., safety blocks
      if (errorMessage.includes('Candidate was blocked due to safety') || errorMessage.includes('SAFETY')) {
         return { isHumanFace: false, reason: 'Image could not be processed due to safety filters. Try a different photo.' };
      }
      return { isHumanFace: false, reason: `AI validation failed: ${errorMessage}` };
    }
  }
);
