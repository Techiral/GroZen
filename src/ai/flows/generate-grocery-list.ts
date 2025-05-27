
'use server';
/**
 * @fileOverview Generates a categorized grocery list based on a wellness meal plan.
 *
 * - generateGroceryList - A function that generates a grocery list.
 * - GenerateGroceryListInput - The input type for the function.
 * - GenerateGroceryListOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Meal } from '@/types/wellness'; // Assuming Meal type is defined here

const MealSchema = z.object({
  day: z.string(),
  breakfast: z.string(),
  lunch: z.string(),
  dinner: z.string(),
});

const GenerateGroceryListInputSchema = z.object({
  meals: z.array(MealSchema).describe("An array of meal objects, each specifying breakfast, lunch, and dinner for a day. Example: [{day: 'Monday', breakfast: 'Oatmeal', lunch: 'Salad', dinner: 'Chicken and rice'}]"),
});
export type GenerateGroceryListInput = z.infer<typeof GenerateGroceryListInputSchema>;

const GroceryItemSchema = z.object({
  id: z.string().uuid().optional().describe("An optional unique identifier (UUID) for this grocery item. If not provided by the AI, the client application may generate one."),
  name: z.string().describe("The name of the grocery item, e.g., 'Apples', 'Chicken Breast', 'Brown Rice'."),
  category: z.string().describe("The category of the item, e.g., 'Produce', 'Protein', 'Pantry', 'Dairy', 'Spices', 'Other'."),
  quantity: z.string().optional().describe("An estimated quantity, e.g., '2 lbs', '1 pack', '500g'. Be specific if possible."),
  notes: z.string().optional().describe("Optional notes for the item, e.g., 'ripe', 'low-sodium', 'organic if available'."),
});

const GenerateGroceryListOutputSchema = z.object({
  items: z.array(GroceryItemSchema).describe('An array of grocery items, categorized and with optional quantities and notes. Each item may optionally include a unique ID.'),
});
export type GenerateGroceryListOutput = z.infer<typeof GenerateGroceryListOutputSchema>;

export async function generateGroceryList(input: GenerateGroceryListInput): Promise<GenerateGroceryListOutput> {
  return generateGroceryListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGroceryListPrompt',
  input: {schema: GenerateGroceryListInputSchema},
  output: {schema: GenerateGroceryListOutputSchema},
  prompt: `You are an expert dietary assistant. Your task is to generate a categorized grocery list from a given meal plan.
Analyze the meals provided:
{{#each meals}}
Day: {{this.day}}
  Breakfast: {{this.breakfast}}
  Lunch: {{this.lunch}}
  Dinner: {{this.dinner}}
{{/each}}

Based on these meals, create a comprehensive grocery list.
- Consolidate similar items (e.g., if multiple meals mention "chicken", list "Chicken Breast" or similar once with an appropriate quantity if inferable).
- Infer reasonable quantities where possible (e.g., "1 head of lettuce", "2 chicken breasts"). If quantity is highly variable or unclear, you can omit it.
- Categorize items into logical groups such as: Produce, Protein (Meats, Poultry, Fish, Tofu, etc.), Dairy & Alternatives, Grains & Pantry (rice, pasta, bread, canned goods, flour, sugar), Spices & Condiments, Frozen, Beverages, Other.
- For each item, provide its name, category, and optionally, quantity, notes, and a unique id (UUID format if possible, but optional).
- Be thorough and try to capture all necessary ingredients implied by the meal descriptions. Assume common staples like salt, pepper, and basic cooking oil are available unless a specific type is mentioned.

Your entire output MUST be a valid JSON object that strictly adheres to the 'GenerateGroceryListOutputSchema', containing an 'items' array where each element follows the 'GroceryItemSchema'.
Do NOT include any introductory text, concluding text, markdown formatting (like \`\`\`json ... \`\`\`), or any characters outside the main JSON object.
The output will be directly parsed, so it must be syntactically perfect. Pay meticulous attention to commas, brackets, and braces.
Example item: { "id": "123e4567-e89b-12d3-a456-426614174000", "name": "Brown Rice", "category": "Grains & Pantry", "quantity": "1 bag (2 lbs)" }
If you cannot generate a unique ID, you can omit the "id" field for an item.
`,
});

const generateGroceryListFlow = ai.defineFlow(
  {
    name: 'generateGroceryListFlow',
    inputSchema: GenerateGroceryListInputSchema,
    outputSchema: GenerateGroceryListOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output || !Array.isArray(output.items)) {
          console.error('generateGroceryListFlow: AI did not return a valid array of grocery items. Output:', output);
          throw new Error('AI did not return a valid array of grocery items.');
      }
      return output;
    } catch (error) {
      console.error('generateGroceryListFlow: Error during AI call or processing. Input:', input, 'Error:', error);
      // Make sure to throw an error that the client can understand or handle
      if (error instanceof Error) {
        throw new Error(`Failed to generate grocery list from AI: ${error.message}`);
      }
      throw new Error('Failed to generate grocery list due to an unknown AI error.');
    }
  }
);
