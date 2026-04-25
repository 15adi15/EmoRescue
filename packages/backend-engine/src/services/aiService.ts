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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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