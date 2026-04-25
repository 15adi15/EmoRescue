import { Request, Response } from 'express';
import { db } from '../server';
import { IngestionPayload, CrisisIncident, RoomInventory } from '@emo-rescue/shared-types';
import { generateSurvivalPlan } from '../services/aiService';
import { calculateEvacuationRoute } from '../services/routingService';

// Mock PMS Data representing the hotel's property management system
const mockPmsData: Record<string, RoomInventory> = {
    'Room_412': {
        roomNumber: 'Room_412',
        registeredGuest: 'John Doe',
        hasMobilityIssues: false,
        itemsInRoom: ['Heavy Desk', 'Fire Blanket', 'Towels', 'Water Bottles']
    },
    'Room_414': {
        roomNumber: 'Room_414',
        registeredGuest: 'Jane Smith',
        hasMobilityIssues: true,
        itemsInRoom: ['Wheelchair', 'Towels', 'Fire Extinguisher']
    }
};

export const createIncident = async (req: Request, res: Response) => {
    try {
        const payload = req.body as IngestionPayload;

        // 1. Fetch Mock PMS Data
        // If room is missing from our mock, generate a default fallback
        const roomData = mockPmsData[payload.roomNumber] || {
            roomNumber: payload.roomNumber,
            registeredGuest: 'Unknown Guest',
            hasMobilityIssues: false,
            itemsInRoom: ['Towels', 'Mattress']
        };

        // 2. Determine Hazard Location (Mocking this for the hackathon prototype)
        // Let's pretend if they are in 412, the hazard is blocking Hallway_West.
        // Otherwise, it's blocking Hallway_East.
        const hazardNode = payload.roomNumber === 'Room_412' ? 'Hallway_West' : 'Hallway_East';

        // 3. AI Extraction (Mocking audio translation context for now)
        // In the full implementation, we'd send the audioBlobUrl to Gemini 1.5 Pro to extract context
        const aiTranslatedContext = `Raw threat detected: ${payload.hazardCategory} reported near ${payload.roomNumber}. Possible obstruction at ${hazardNode}.`;

        // 4. Calculate BFS Route
        const safeEvacuationRoute = calculateEvacuationRoute(payload.roomNumber, hazardNode);

        // 5. Generate Survival Plan
        let aiSurvivalPlan = '';
        if (safeEvacuationRoute.length === 0) {
             // TRAPPED SCENARIO: Use Gemini to generate a strict survival guide based on room inventory
             const dynamicPlan = await generateSurvivalPlan(payload.hazardCategory, roomData);
             aiSurvivalPlan = `TRAPPED. ${dynamicPlan}`;
        } else {
             // CLEAR PATH SCENARIO
             aiSurvivalPlan = "1. Follow map route immediately. 2. Stay low if smoke is present. 3. Do not use elevators.";
        }

        // 6. Build Incident Document
        const incidentRef = db.collection('incidents').doc();
        const incident: CrisisIncident = {
            incidentId: incidentRef.id,
            roomNumber: payload.roomNumber,
            threatLevel: payload.hazardCategory === 'FIRE' ? 'CRITICAL' : 'HIGH',
            hazardCategory: payload.hazardCategory,
            aiTranslatedContext,
            aiSurvivalPlan,
            safeEvacuationRoute,
            status: 'RECEIVED',
            createdAt: payload.timestamp || Date.now()
        };

        // 7. Save to Firestore (The Admin Dashboard listens to this collection via onSnapshot)
        // Note: Make sure the GOOGLE_APPLICATION_CREDENTIALS environment variable is set for this to work
        await incidentRef.set(incident);

        // 8. Return response to Victim UI
        res.status(201).json({
            success: true,
            data: incident
        });

    } catch (error) {
        console.error("Error creating incident:", error);
        res.status(500).json({ success: false, error: 'Failed to orchestrate emergency response.' });
    }
};
