// packages/backend-engine/src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { createIncident } from './controllers/incidentController';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin (We will add the credentials via .env in a moment)
// For now, it will look for the GOOGLE_APPLICATION_CREDENTIALS env var
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

export const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', message: 'EmoRescue Crisis Engine is Online.' });
});

// Crisis Ingestion Route
app.post('/api/incident', createIncident);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Crisis Command Engine running on port ${PORT}`);
});