
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-wellness-plan.ts';
import '@/ai/flows/provide-mood-feedback.ts';
import '@/ai/flows/generate-grocery-list.ts';
import '@/ai/flows/generate-share-image.ts';
import '@/ai/flows/validate-human-face.ts';
import '@/ai/flows/generate-daily-timetable.ts'; // Added new flow

    