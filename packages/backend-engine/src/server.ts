// packages/backend-engine/src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { createIncident, sendMessage } from './controllers/incidentController';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin (We will add the credentials via .env in a moment)
// For now, it will look for the GOOGLE_APPLICATION_CREDENTIALS env var
// Replace your current admin.initializeApp block with this:
if (!admin.apps.length) {
    let credential;
    // If on Vercel, read the JSON from the environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        credential = admin.credential.cert(serviceAccount);
    } else {
        // If local, use the .env file path
        credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({ credential });
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

// Chat Message with Translation Route
app.post('/api/chat', sendMessage);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Crisis Command Engine running on port ${PORT}`);
    });
}

// Vercel requires the app to be exported!
export default app;