
'use server';
/**
 * @fileOverview Generates a daily quest-like timetable based on user tasks and preferences.
 *
 * - generateDailyTimetable - A function that generates a daily timetable.
 * - GenerateDailyTimetableInput - The input type for the function.
 * - GenerateDailyTimetableOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { QuestType } from '@/types/wellness';

const RawTaskSchema = z.object({
  id: z.string().describe("Client-generated unique ID for this raw task."),
  description: z.string().describe("User's description of the task."),
  durationMinutes: z.number().optional().describe("Optional estimated duration in minutes."),
  priority: z.enum(['high', 'medium', 'low']).optional().describe("Optional task priority."),
  questType: z.nativeEnum(['study', 'workout', 'hobby', 'chore', 'wellness', 'creative', 'social', 'break', 'other'] as const).optional().describe("Optional category/type of the task."),
  fixedTime: z.string().optional().describe("Optional fixed time for the task, e.g., '14:00-15:00' or '10:00 start'. Use 24-hour format."),
  deadline: z.string().optional().describe("Optional deadline, e.g., 'today EOD', 'tomorrow morning'."),
  urgency: z.string().optional().describe("Optional user-defined urgency, e.g., 'ASAP!', 'Can wait'."),
  requiredEnergyLevel: z.string().optional().describe("Optional user-defined energy level needed, e.g., 'High focus', 'Low key'."),
});
export type RawTask = z.infer<typeof RawTaskSchema>;

const GenerateDailyTimetableInputSchema = z.object({
  tasks: z.array(RawTaskSchema).describe("An array of raw tasks provided by the user for the day."),
  userContext: z.string().optional().describe("Optional general context from the user, e.g., 'I have school from 8am to 3pm. I prefer to exercise in the late afternoon.'"),
  currentDate: z.string().describe("The current date for which the schedule is being planned, in YYYY-MM-DD format."),
  userName: z.string().optional().describe("User's display name for personalized encouragement."),
});
export type GenerateDailyTimetableInput = z.infer<typeof GenerateDailyTimetableInputSchema>;

const ScheduledQuestSchema = z.object({
  id: z.string().describe("A unique ID for this scheduled quest slot (can be same as originalTaskId or new if task is split)."),
  originalTaskId: z.string().describe("The ID of the raw task this scheduled quest corresponds to."),
  title: z.string().describe("An engaging, quest-like title for the task, potentially enhanced by the AI. e.g., 'Conquer Chapter 5!'."),
  startTime: z.string().describe("Suggested start time in HH:MM (24-hour) format."),
  endTime: z.string().describe("Suggested end time in HH:MM (24-hour) format."),
  questType: z.nativeEnum(['study', 'workout', 'hobby', 'chore', 'wellness', 'creative', 'social', 'break', 'other'] as const).describe("The category/type of the quest."),
  xp: z.number().describe("Suggested XP (experience points) for completing this quest. Base on duration/importance."),
  notes: z.string().optional().describe("Optional brief motivational note or tip from the AI related to this quest."),
});
export type ScheduledQuest = z.infer<typeof ScheduledQuestSchema>;

const BreakSlotSchema = z.object({
  id: z.string().describe("A unique ID for this break slot."),
  startTime: z.string().describe("Suggested start time for the break in HH:MM (24-hour) format."),
  endTime: z.string().describe("Suggested end time for the break in HH:MM (24-hour) format."),
  suggestion: z.string().optional().describe("A brief, fun, and rejuvenating break activity suggestion (e.g., 'Quick 5-min stretch', 'Listen to a song', 'Hydrate!')."),
  xp: z.number().optional().default(0).describe("Optional small XP bonus for taking a suggested break activity.")
});
export type BreakSlot = z.infer<typeof BreakSlotSchema>;

const GenerateDailyTimetableOutputSchema = z.object({
  scheduledQuests: z.array(ScheduledQuestSchema).describe("An array of time-blocked quests for the day, ordered chronologically."),
  breaks: z.array(BreakSlotSchema).optional().describe("An array of suggested break slots, ordered chronologically."),
  dailySummaryMessage: z.string().optional().describe("A short, positive, and motivational summary or tip for the planned day from the AI."),
  // Ensure all slots are chronologically ordered in the final output by the AI
});
export type GenerateDailyTimetableOutput = z.infer<typeof GenerateDailyTimetableOutputSchema>;


export async function generateDailyTimetable(input: GenerateDailyTimetableInput): Promise<GenerateDailyTimetableOutput> {
  return generateDailyTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyTimetablePrompt',
  input: {schema: GenerateDailyTimetableInputSchema},
  output: {schema: GenerateDailyTimetableOutputSchema},
  prompt: `You are "GroZen Time-Quest AI", an expert life coach and time management guru for teenagers. Your goal is to take a list of tasks and user preferences and turn them into an engaging, motivating, and balanced daily "Quest Schedule".
The user, {{#if userName}}{{userName}}{{else}}your awesome GroZen quester{{/if}}, needs a plan for {{currentDate}}.

User's Tasks for the Day:
{{#each tasks}}
- Task ID: {{this.id}}
  Description: {{this.description}}
  {{#if this.durationMinutes}}Duration: {{this.durationMinutes}} mins{{/if}}
  {{#if this.priority}}Priority: {{this.priority}}{{/if}}
  {{#if this.questType}}Type: {{this.questType}}{{/if}}
  {{#if this.fixedTime}}Fixed Time: {{this.fixedTime}}{{/if}}
  {{#if this.deadline}}Deadline: {{this.deadline}}{{/if}}
  {{#if this.urgency}}Urgency: {{this.urgency}}{{/if}}
  {{#if this.requiredEnergyLevel}}Energy: {{this.requiredEnergyLevel}}{{/if}}
{{else}}
No specific tasks listed by the user. You might suggest some foundational wellness quests.
{{/each}}

{{#if userContext}}
User's General Preferences/Context:
{{{userContext}}}
{{/if}}

Your Mission:
1.  Analyze all tasks, considering their descriptions, durations, priorities, fixed times, deadlines, types, urgency, and energy levels.
2.  Craft a realistic and balanced daily schedule. Sequence tasks logically.
3.  Transform task descriptions into engaging "Quest Titles" (e.g., "Math Homework" -> "Conquer Calculus Mountain!").
4.  Assign an appropriate "questType" for each scheduled quest, using one of the allowed enum values. If not specified by user, infer from description. Default to 'other' if unsure.
5.  Estimate and assign XP points for each quest. Longer, more important, or higher-priority quests should generally get more XP. Range: 10-100 XP per quest.
6.  Strategically insert short, rejuvenating break slots (5-15 minutes) between longer focus blocks or demanding quests. Provide a fun, simple suggestion for each break. Give a small XP bonus (e.g., 5-10 XP) for completing suggested break activities.
7.  Handle fixed-time tasks (appointments, classes) by scheduling them first.
8.  Respect deadlines and priorities. High-priority tasks should be scheduled earlier or with more focus.
9.  Ensure the entire day feels manageable, not overwhelming. Avoid back-to-back high-energy quests without breaks.
10. Provide a brief, positive, and motivational "dailySummaryMessage" at the end.
11. Structure your ENTIRE output as a single, valid JSON object that strictly adheres to the 'GenerateDailyTimetableOutputSchema'.
    - The 'scheduledQuests' array MUST be sorted chronologically by 'startTime'.
    - The 'breaks' array (if any) MUST also be sorted chronologically by 'startTime'.
    - All 'id' fields within 'scheduledQuests' and 'breaks' must be unique strings. You can re-use originalTaskIds for scheduledQuests if the task is not split, or generate new UUIDs. Break IDs should be new UUIDs.
    - Start and end times must be in "HH:MM" 24-hour format.

Example of a Scheduled Quest object:
{ "id": "q1-task001", "originalTaskId": "task001", "title": "Master History Chapter 3", "startTime": "10:00", "endTime": "11:30", "questType": "study", "xp": 70, "notes": "Time to dive deep into the past!" }

Example of a Break Slot object:
{ "id": "break1", "startTime": "11:30", "endTime": "11:45", "suggestion": "Quick stretch & grab some water!", "xp": 5 }

Tips for Teens:
- Frame tasks positively.
- Encourage a growth mindset.
- Acknowledge their effort.
- Keep notes short and punchy.

Generate the Quest Schedule now.
`,
});

const generateDailyTimetableFlow = ai.defineFlow(
  {
    name: 'generateDailyTimetableFlow',
    inputSchema: GenerateDailyTimetableInputSchema,
    outputSchema: GenerateDailyTimetableOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output || !Array.isArray(output.scheduledQuests)) {
          console.error('generateDailyTimetableFlow: AI did not return a valid array of scheduledQuests. Output:', output);
          throw new Error('AI did not return a valid daily schedule structure.');
      }
      // Ensure IDs are present, generate if AI misses any (though it should not based on schema)
      output.scheduledQuests.forEach(q => { if (!q.id) q.id = crypto.randomUUID(); });
      if (output.breaks) {
        output.breaks.forEach(b => { if (!b.id) b.id = crypto.randomUUID(); });
      }
      
      return output;
    } catch (error) {
      console.error('generateDailyTimetableFlow: Error during AI call or processing. Input:', input, 'Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown AI error during timetable generation.';
      throw new Error(`Failed to generate daily timetable: ${errorMessage}`);
    }
  }
);

    