
'use server';

import { z } from "zod";
import { TimetableEntry, Conflict } from "@/lib/types";
import { generateTimetable, GenerateTimetableInput, GenerateTimetableOutput } from "@/lib/timetable/generate-timetable";
import { suggestFaculty, SuggestFacultyInput, SuggestFacultyOutput } from "@/lib/timetable/suggest-faculty";
import { runChat, ChatAssistantInput } from "@/ai/flows/chat-assistant";

export type TimetableGenerationResponse = 
  | { success: false; error: string }
  | { success: true; data: GenerateTimetableOutput };

export async function runGenerateTimetable(input: GenerateTimetableInput & {
  days?: string[], 
  programs?: string[], 
  existingTimetable?: string,
  selectedClass?: string,
  specificGeneration?: boolean
}): Promise<TimetableGenerationResponse> {
  try {
    const generationResult = await generateTimetable(input);

    if (!generationResult) {
      return { success: false, error: "AI model failed to return a valid response object." };
    }
    
    // Allow empty timetable for clearing the board, but not if specific programs were requested
    const coursesWereRequested = input.programs && input.programs.length > 0;

    if (!generationResult.timetable || generationResult.timetable.length === 0) {
      if (coursesWereRequested) {
         return { success: false, error: generationResult.report || "AI failed to generate a schedule for the selected program(s). The returned timetable was empty and no report was provided." };
      }
      // If no programs were selected and timetable is empty, it might be intentional (clearing) or a total failure.
      if (input.courseData === '[]' && !input.existingTimetable) {
         return { success: true, data: generationResult };
      }
       return { success: false, error: generationResult.report || "AI failed to generate a schedule. The returned timetable was empty and no report was provided." };
    }
    
    return { success: true, data: generationResult };

  } catch (error) {
    console.error("Detailed error in runGenerateTimetable:", error);
    
    let errorMessage = "An unknown error occurred.";
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = "AI API key is invalid or missing. Please check your environment configuration.";
      } else if (error.message.includes('quota')) {
        errorMessage = "AI API quota exceeded. Please try again later.";
      } else if (error.message.includes('network')) {
        errorMessage = "Network error occurred while calling AI service. Please check your internet connection.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timed out. The AI service is taking too long to respond.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: `AI Generation Failed: ${errorMessage}` };
  }
}

type SuggestFacultyResponse = 
  | { success: false; error: string }
  | { success: true; data: SuggestFacultyOutput };

type ChatAssistantResponse = 
  | { success: false; error: string }
  | { success: true; data: string };

export async function runSuggestFaculty(input: SuggestFacultyInput): Promise<SuggestFacultyResponse> {
    try {
        const result = await suggestFaculty(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Detailed error in runSuggestFaculty:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `AI Suggestion Failed: ${errorMessage}` };
    }
}

export async function runChatAssistant(input: ChatAssistantInput): Promise<ChatAssistantResponse> {
    try {
        const result = await runChat(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Detailed error in runChatAssistant:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Chat Assistant Failed: ${errorMessage}` };
    }
}
