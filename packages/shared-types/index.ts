// packages/shared-types/index.ts

export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MODERATE';
export type HazardCategory = 'FIRE' | 'MEDICAL' | 'INTRUDER' | 'EARTHQUAKE' | 'UNKNOWN';
export type IncidentStatus = 'RECEIVED' | 'AI_PROCESSING' | 'RESCUE_DISPATCHED' | 'RESOLVED';

// What the Next.js Victim UI sends to your Node.js backend
export interface IngestionPayload {
    roomNumber: string;
    hazardCategory: HazardCategory;
    audioBlobUrl?: string; // Captured via MediaRecorder API
    guestConfirmedIdentity: boolean;
    timestamp: number;
}

// The Mock PMS Data Structure
export interface RoomInventory {
    roomNumber: string;
    registeredGuest: string;
    hasMobilityIssues: boolean;
    itemsInRoom: string[]; // e.g., ["Heavy Desk", "Fire Blanket"]
}

// Real-time chat messages between admin and victim
export interface ChatMessage {
    id: string;
    sender: 'ADMIN' | 'VICTIM';
    text: string;
    timestamp: number;
}

// What Node.js pushes to Firestore (and what the Admin Dashboard listens to)
export interface CrisisIncident {
    incidentId: string; // Firestore Doc ID
    roomNumber: string;
    threatLevel: ThreatLevel;
    hazardCategory: HazardCategory;
    aiTranslatedContext: string; // e.g., "Smoke blocking the hallway"
    aiSurvivalPlan: string; // e.g., "1. Stay low. 2. Cover face with wet towel."
    safeEvacuationRoute: string[]; // Output from your BFS algorithm: ['Node_412', 'Node_Hallway_B', 'Node_Stairwell_B']
    status: IncidentStatus;
    messages?: ChatMessage[]; // Real-time communication
    createdAt: number;
}