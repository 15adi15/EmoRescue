// packages/backend-engine/src/services/aiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HazardCategory, RoomInventory } from '@emo-rescue/shared-types';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const generateSurvivalPlan = async (
    hazard: HazardCategory,
    roomData: RoomInventory
): Promise<string> => {
    try {
        // We use gemini-1.5-flash for maximum speed during emergencies
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            EMERGENCY SITUATION: A ${hazard} has been reported in a hotel.
            GUEST LOCATION: Room ${roomData.roomNumber}.
            ROOM INVENTORY (Items available to the guest): ${roomData.itemsInRoom.join(', ')}.
            
            TASK: Generate a strict, 3-step survival guide using ONLY the items in the room to help the guest stay safe while waiting for rescue.
            CONSTRAINTS: 
            - Keep it under 25 words total. 
            - Be direct and authoritative. 
            - Do not include conversational filler.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini API Error:", error);
        return "1. Stay calm. 2. Stay in your room. 3. Help is on the way."; // Fallback plan
    }
};

export const extractAudioContext = async (
    hazard: HazardCategory,
    audioDataUri: string
): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const base64Audio = audioDataUri.split(',')[1];
        
        const prompt = `You are an emergency dispatcher. Analyze the following audio recording from a ${hazard} situation. Briefly summarize the critical threat context (e.g. "Smoke blocking the hallway", "Two armed individuals in lobby"). Keep it under 15 words.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "audio/webm", // Common browser recorder format
                    data: base64Audio
                }
            }
        ]);
        
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Audio Translation Error:", error);
        return "Audio unintelligible or unavailable.";
    }
};