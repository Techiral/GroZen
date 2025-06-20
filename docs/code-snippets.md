
# GroZen: Code Snippets Showcase

This document provides illustrative excerpts of key AI integrations and frontend components within GroZen.

## 1. AI Wellness Plan Generation (Genkit Flow Excerpt)
*File: `src/ai/flows/generate-wellness-plan.ts`*

This snippet demonstrates how user input (goals, diet, budget) is structured using Zod schemas and fed into a Genkit-defined prompt. The LLM (Google Gemini) then generates a structured JSON wellness plan.

```typescript
// Simplified Zod Schemas for Input/Output
const GenerateWellnessPlanInputSchema = z.object({
  goals: z.string().describe("User's wellness goals..."),
  dietPreferences: z.string().describe("User's dietary preferences..."),
  budget: z.string().describe("User's budget..."),
});

const GenerateWellnessPlanOutputSchema = z.object({
  plan: z.string().describe('The wellness plan in JSON format...'),
});

// Genkit Prompt Definition
const prompt = ai.definePrompt({
  name: 'generateWellnessPlanPrompt',
  input: {schema: GenerateWellnessPlanInputSchema},
  output: {schema: GenerateWellnessPlanOutputSchema},
  prompt: `You are a wellness expert AI.
Generate a personalized wellness plan based on:
Goals: {{{goals}}}
Dietary Preferences: {{{dietPreferences}}}
Budget: {{{budget}}}

The ENTIRE output from you MUST be a single, valid JSON object string...
Follow this exact JSON structure:
{
  "meals": [ { "day": "Monday", "breakfast": "...", "lunch": "...", "dinner": "..." } ],
  "exercise": [ { "day": "Monday", "activity": "...", "duration": "..." } ],
  "mindfulness": [ { "day": "Everyday", "practice": "...", "duration": "..." } ]
}`,
});

// Genkit Flow Definition
const generateWellnessPlanFlow = ai.defineFlow(
  {
    name: 'generateWellnessPlanFlow',
    inputSchema: GenerateWellnessPlanInputSchema,
    outputSchema: GenerateWellnessPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input); // Calls the LLM
    // Basic validation might occur here before returning
    if (!output || typeof output.plan !== 'string') {
        throw new Error('AI did not return a valid plan string.');
    }
    return output;
  }
);
```
**Documentation:** This flow is central to GroZen's personalization. It takes user onboarding data and uses a generative AI model to create a comprehensive, structured wellness plan including meals, exercises, and mindfulness activities. The Zod schemas ensure type safety and provide descriptions for the AI model.

## 2. AI Daily Timetable Generation (Genkit Flow Excerpt)
*File: `src/ai/flows/generate-daily-timetable.ts`*

This flow takes a user's natural language description of their day's tasks and preferences and uses AI to generate an engaging, motivating, and balanced daily "Quest Schedule".

```typescript
// Simplified Zod Schemas
const GenerateDailyTimetableInputSchema = z.object({
  naturalLanguageTasks: z.string().describe("User's natural language description of tasks..."),
  userContext: z.string().optional().describe("Optional general context..."),
  // ... other fields like currentDate, userName
});
// ScheduledQuestSchema and BreakSlotSchema define the structure of individual tasks/breaks.

const GenerateDailyTimetableOutputSchema = z.object({
  scheduledQuests: z.array(ScheduledQuestSchema).describe("Time-blocked quests..."),
  breaks: z.array(BreakSlotSchema).optional().describe("Suggested break slots..."),
  dailySummaryMessage: z.string().optional().describe("Motivational summary..."),
});

// Genkit Prompt Definition
const prompt = ai.definePrompt({
  name: 'generateDailyTimetablePrompt',
  input: {schema: GenerateDailyTimetableInputSchema},
  output: {schema: GenerateDailyTimetableOutputSchema},
  prompt: `You are "GroZen Time-Quest AI", an expert life coach...
User's Description of Today's Tasks:
{{{naturalLanguageTasks}}}
{{#if userContext}}User's General Preferences: {{{userContext}}}{{/if}}

Your Mission - CRITICAL GUIDELINES:
1.  **Parse and Identify Quests:** Analyze 'naturalLanguageTasks'. Identify actionable tasks...
2.  **No Overlaps - STRICTLY ENFORCED:** Generated \`scheduledQuests\` and \`breaks\` MUST NOT overlap...
3.  **Craft Engaging Titles:** ...
4.  **Strict JSON Output:** Your ENTIRE output MUST be a single, valid JSON object...
`,
});
// ... flow definition similar to above ...
```
**Documentation:** This exemplifies how GroZen uses AI to reduce user friction. Instead of manual task entry, users describe their day naturally. The AI then structures this into actionable, timed "quests" with gamified elements like XP, making daily planning more intuitive and engaging.

## 3. React Dashboard Component for AI Quests (JSX Excerpt)
*File: `src/app/dashboard/page.tsx`*

This snippet shows how AI-generated quests are rendered on the user's dashboard, allowing them to track progress and mark items as complete.

```tsx
// Simplified JSX for displaying a scheduled quest
{scheduledQuestsForSelectedDate.map((item) => {
  const isCompleted = questCompletionStatusForSelectedDate[item.id] === 'completed';
  return (
    <div key={item.id} className={cn("neumorphic-sm p-2 quest-card", isCompleted && "opacity-60")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {item.startTime} - {item.endTime} | XP: {item.xp}
          </p>
          {item.notes && !isCompleted && <p className="text-xs italic">{item.notes}</p>}
        </div>
        {!isCompleted ? (
          <Button onClick={() => handleCompleteQuest(item.id, 'quest')}>Complete</Button>
        ) : (
          <CheckCircle className="text-green-400" />
        )}
        {/* Delete Button (AlertDialog not shown for brevity) */}
        <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id, 'quest')}>
            <Trash2 />
        </Button>
      </div>
    </div>
  );
})}
```
**Documentation:** The dashboard is the user's main interaction point. This component dynamically renders the AI-generated schedule, provides interactive elements for task completion (which ties into XP and streak systems), and allows for modifications like deleting tasks, showcasing an interactive and responsive UI.

## 4. AI Mood Feedback (Genkit Flow Excerpt)
*File: `src/ai/flows/provide-mood-feedback.ts`*

This flow generates an empathetic and supportive comment based on the user's logged mood and optional notes.

```typescript
// Simplified Zod Schemas
const ProvideMoodFeedbackInputSchema = z.object({
  mood: z.string().describe("User's logged mood (emoji)..."),
  notes: z.string().optional().describe("Optional notes..."),
});
const ProvideMoodFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Short, empathetic comment...'),
});

// Genkit Prompt Definition
const prompt = ai.definePrompt({
  name: 'provideMoodFeedbackPrompt',
  input: {schema: ProvideMoodFeedbackInputSchema},
  output: {schema: ProvideMoodFeedbackOutputSchema},
  prompt: `You are an empathetic wellness companion AI.
User's Mood: {{{mood}}}
User's Notes: {{#if notes}}{{{notes}}}{{else}}No additional notes.{{/if}}

Your task is to provide a short (1-2 sentences max), supportive, and encouraging comment...
Avoid generic platitudes. Aim for sincerity.`,
});
// ... flow definition ...
```
**Documentation:** This AI feature enhances the mood logging experience by providing immediate, positive reinforcement or gentle encouragement. It demonstrates GroZen's commitment to supporting teen mental well-being through empathetic AI interactions.

*These are illustrative snippets. Full implementations are in the source code, demonstrating robust error handling, state management (React Context), and interaction with Firebase for data persistence.*
