import { Request, Response } from 'express';
import { db } from '../server';
import * as admin from 'firebase-admin';
import { IngestionPayload, CrisisIncident, RoomInventory, ChatMessage } from '@emo-rescue/shared-types';
import { generateSurvivalPlan, extractAudioContext, translateMessage } from '../services/aiService';
import { calculateEvacuationRoute } from '../services/routingService';

const mockPmsData: Record<string, RoomInventory> = {
    // Floor 1
    'Room_111': { roomNumber: 'Room_111', registeredGuest: 'Alice A', hasMobilityIssues: false, itemsInRoom: ['Towels', 'Bottled Water'] },
    'Room_112': { roomNumber: 'Room_112', registeredGuest: 'Bob B', hasMobilityIssues: true, itemsInRoom: ['Wheelchair', 'Fire Blanket'] },
    'Room_113': { roomNumber: 'Room_113', registeredGuest: 'Charlie C', hasMobilityIssues: false, itemsInRoom: ['Towels'] },
    // Floor 2
    'Room_211': { roomNumber: 'Room_211', registeredGuest: 'Dave D', hasMobilityIssues: false, itemsInRoom: ['Towels', 'Fire Extinguisher'] },
    'Room_212': { roomNumber: 'Room_212', registeredGuest: 'Eve E', hasMobilityIssues: false, itemsInRoom: ['Heavy Desk', 'Bottled Water'] },
    'Room_213': { roomNumber: 'Room_213', registeredGuest: 'Frank F', hasMobilityIssues: false, itemsInRoom: ['Towels'] },
    // Floor 3
    'Room_311': { roomNumber: 'Room_311', registeredGuest: 'Grace G', hasMobilityIssues: true, itemsInRoom: ['Towels', 'Walking Cane'] },
    'Room_312': { roomNumber: 'Room_312', registeredGuest: 'Heidi H', hasMobilityIssues: false, itemsInRoom: ['Fire Blanket'] },
    'Room_333': { roomNumber: 'Room_333', registeredGuest: 'Ivan I', hasMobilityIssues: false, itemsInRoom: ['Heavy Desk', 'Towels'] }
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
        // If Room is on West wing (e.g. Room_111, Room_212), hazard is Stairwell_A (forces routing to East wing / Stairwell B).
        // If Room is on East wing (e.g. Room_333), hazard is Stairwell_B (forces routing to West wing / Stairwell A).
        const hazardNode = payload.roomNumber.match(/[12]$/) ? 'Stairwell_A' : 'Stairwell_B';

        // 3. AI Extraction
        let aiTranslatedContext = `Raw threat detected: ${payload.hazardCategory} reported near ${payload.roomNumber}. Possible obstruction at ${hazardNode}.`;
        
        if (payload.audioBlobUrl) {
            aiTranslatedContext = await extractAudioContext(payload.hazardCategory, payload.audioBlobUrl);
        }

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
            messages: [],
            victimLanguage: payload.language || 'en',
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

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { incidentId, sender, text } = req.body;
        
        // 1. Fetch incident from Firestore to get the victim's language
        const incidentRef = db.collection('incidents').doc(incidentId);
        const docSnap = await incidentRef.get();
        
        if (!docSnap.exists) {
            return res.status(404).json({ success: false, error: 'Incident not found' });
        }
        
        const incidentData = docSnap.data() as CrisisIncident;
        const victimLanguage = incidentData.victimLanguage || 'en';

        // 2. Determine translation
        let translatedText = text;
        
        if (victimLanguage !== 'en') {
            // If sender is ADMIN, source is English, target is Victim Language
            // If sender is VICTIM, source is Victim Language, target is English
            const sourceLang = sender === 'ADMIN' ? 'en' : victimLanguage;
            const targetLang = sender === 'ADMIN' ? victimLanguage : 'en';
            
            translatedText = await translateMessage(text, sourceLang, targetLang);
        }

        // 3. Construct Message Payload
        const newMessage: any = {
            id: Date.now().toString(),
            sender,
            text,
            timestamp: Date.now()
        };

        if (translatedText !== text && translatedText) {
            newMessage.translatedText = translatedText;
        }

        // 4. Update Firestore
        await incidentRef.update({
            messages: admin.firestore.FieldValue.arrayUnion(newMessage)
        });

        res.status(200).json({ success: true, message: newMessage });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
};
