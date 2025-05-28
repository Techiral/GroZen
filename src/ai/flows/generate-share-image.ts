
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
  model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Image generation model
  config: {
    responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE
     safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  },
  prompt: `Task: First, generate a visually appealing and motivational background image for a social media share card. Second, provide a short alt text for that image.

Image Generation Guidelines:
- Create a vibrant, celebratory, and abstract background image.
- The image should strongly evoke a sense of achievement and positive wellness energy.
- Use uplifting and positive colors.
- The image must be purely visual. DO NOT include any text, numbers, or human figures in the image.
- Focus on abstract elements or subtle thematic cues related to wellness or accomplishment.

Context for image generation:
- User Name: {{#if userName}}{{userName}}{{else}}A GroZen User{{/if}}
- Challenge Title: '{{challengeTitle}}'
- Days Completed: {{daysCompleted}}

Alt Text Generation Guidelines (for the image you generate):
- Provide a concise (1-2 sentence) descriptive alt text for the generated image.
- This text should describe the visual elements and mood of the image. Example: "Abstract background with flowing blue and gold lines creating a sense of motion and achievement."
- Your text response must ONLY be the alt text. Do not include any other conversational text or markdown.

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
      const response = await generateShareImagePrompt(input); 
      
      const imageDataUri = response.media?.url;
      const altTextFromAI = response.text?.trim();

      if (!imageDataUri) {
        console.error('generateShareImageFlow: AI did not return an image. Media:', response.media, 'Text response was:', altTextFromAI);
        throw new Error('AI did not return an image.');
      }
      
      const altText = altTextFromAI && altTextFromAI.length > 0 
        ? altTextFromAI 
        : `GroZen Challenge: ${input.challengeTitle} - ${input.daysCompleted} days completed. By ${input.userName || 'User'}.`;

      return { imageDataUri, altText };
    } catch (error) {
      console.error('generateShareImageFlow: Error during AI image generation or processing. Input:', input, 'Error:', error);
      if (error instanceof Error) {
        // Prepend a consistent prefix to the error message
        throw new Error(`Failed to generate share image from AI: ${error.message}`);
      }
      throw new Error('Failed to generate share image due to an unknown AI error.');
    }
  }
);
