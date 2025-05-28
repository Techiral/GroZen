
'use server';
/**
 * @fileOverview Generates a shareable image for challenge progress.
 *
 * - generateShareImage - A function that generates an image.
 * - GenerateShareImageInput - The input type for the function.
 * - GenerateShareImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateShareImageInputSchema = z.object({
  challengeTitle: z.string().describe("The title of the wellness challenge, e.g., '30-Day No-Sugar Sprint'."),
  daysCompleted: z.number().min(0).describe("The number of days the user has completed in the challenge."),
  userName: z.string().nullable().describe("The user's display name. Can be null if not set."),
});
export type GenerateShareImageInput = z.infer<typeof GenerateShareImageInputSchema>;

const GenerateShareImageOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI, e.g., 'data:image/png;base64,iVBORw0KGgo...'."),
  altText: z.string().describe("A short descriptive alt text for the image, primarily for accessibility if the image were to be displayed directly."),
});
export type GenerateShareImageOutput = z.infer<typeof GenerateShareImageOutputSchema>;

export async function generateShareImage(input: GenerateShareImageInput): Promise<GenerateShareImageOutput> {
  return generateShareImageFlow(input);
}

const generateShareImagePrompt = ai.definePrompt({
  name: 'generateShareImagePrompt',
  input: {schema: GenerateShareImageInputSchema},
  // Removed output schema here, as gemini-2.0-flash-exp doesn't support JSON output with image generation
  model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Image generation model
  config: {
    responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
     safetySettings: [ // Relax safety settings slightly if needed for creative content
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
  prompt: `Task: Generate a visually appealing and motivational background image for a social media share card AND a short alt text for it.
The user, {{#if userName}}{{userName}}{{else}}someone{{/if}}, is celebrating their progress in the '{{challengeTitle}}' challenge, having completed {{daysCompleted}} days.

Image Generation Guidelines:
- Create a vibrant, celebratory, and abstract image.
- The image should evoke a sense of achievement and positive energy.
- Use colors that are generally uplifting.
- Do NOT include any text, numbers, or human figures in the image itself. The image is purely for background and mood.
- Consider abstract patterns, light effects, or subtle thematic elements related to wellness or accomplishment.
- Output the image as a data URI.

Alt Text Generation Guidelines:
- Provide a concise (1-2 sentence) descriptive alt text for the generated image. This text should describe the visual elements and mood of the image. Example: "Abstract background with flowing blue and gold lines creating a sense of motion and achievement."
- Your text response should ONLY be the alt text. Do not include any other conversational text or markdown.

Example of a good alt text: "Vibrant abstract background with streaks of light, symbolizing energy and progress for a wellness challenge."
`,
});

const generateShareImageFlow = ai.defineFlow(
  {
    name: 'generateShareImageFlow',
    inputSchema: GenerateShareImageInputSchema,
    outputSchema: GenerateShareImageOutputSchema, // The flow's output will still match this schema
  },
  async (input) => {
    try {
      const response = await generateShareImagePrompt(input); // This will be a GenerateResponse object
      
      const imageDataUri = response.media?.url;
      const altText = response.text?.trim(); // Get the text part of the response

      if (!imageDataUri) {
        console.error('generateShareImageFlow: AI did not return an image. Media:', response.media);
        throw new Error('AI did not return an image.');
      }
      if (!altText || typeof altText !== 'string' || altText.length === 0) {
        console.error('generateShareImageFlow: AI did not return valid alt text. Text response:', altText);
        // Fallback alt text if AI fails to provide one or provides empty
        const fallbackAlt = `Wellness challenge progress for ${input.challengeTitle} - ${input.daysCompleted} days completed.`;
        return { imageDataUri, altText: fallbackAlt };
      }
      return { imageDataUri, altText };
    } catch (error) {
      console.error('generateShareImageFlow: Error during AI image generation or processing. Input:', input, 'Error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate share image from AI: ${error.message}`);
      }
      throw new Error('Failed to generate share image due to an unknown AI error.');
    }
  }
);

