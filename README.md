# 🚨 EmoRescue: Crisis Orchestration OS

> **Build with AI | Solution Challenge 2026**
> A zero-friction, AI-powered emergency management platform designed for hospitality venues and large enterprise buildings.

## 📖 The Problem
During a high-stakes crisis (fire, active shooter, medical emergency), communication fractures. Guests are isolated, unaware of the building layout, and often face language barriers. Traditional enterprise safety apps fail because short-term guests will not download a dedicated application just to stay in a hotel.

## 🚀 Our Solution
EmoRescue bypasses the "app download" barrier entirely. Guests scan a QR code on the back of their door, instantly loading a highly accessible Progressive Web App (PWA) mapped to their exact location. 

Powered by **Google's Gemini 1.5 Pro API** and a custom **Breadth-First Search (BFS) graph algorithm**, the platform ingests panic audio, translates it instantly, calculates a hazard-free evacuation route, and syncs everything in real-time to a tactical command dashboard for security teams.

## ✨ Key Features
* **Zero-Friction Ingestion:** Instant QR-code access (`?room=111`) with zero downloads required.
* **Multimodal AI Dispatcher (Gemini):** Processes raw audio payload from the guest, translates it to English, and extracts a concise 15-word threat context for admins.
* **Dynamic BFS Evacuation Routing:** Algorithmically severs "Hazard Nodes" on a multi-floor graph network to calculate the safest path to an alternate stairwell.
* **"Go Dark" Stealth Mode:** For intruder scenarios, the UI shifts to OLED black and replaces audio readouts with silent haptic pulses.
* **Real-Time WebSockets:** Powered by Firebase Firestore, ensuring instant two-way sync between the victim and the command center.

## 🛠️ Architecture & Tech Stack
This project is built as a highly scalable monorepo using `npm workspaces`.

* **Frontend:** Next.js, React, Tailwind CSS
* **Backend Engine:** Node.js, Express, TypeScript
* **Cloud & Database:** Firebase Cloud Firestore
* **Artificial Intelligence:** Google Gen AI SDK (Gemini 1.5 Flash/Pro)

## 📂 Monorepo Structure
```text
EmoRescue/
├── apps/
│   ├── victim-ui/          # Next.js Mobile PWA for Guests
│   └── admin-dashboard/    # Next.js Desktop Tactical Command
├── packages/
│   ├── backend-engine/     # Node.js API & BFS Graph Logic
│   └── shared-types/       # TypeScript Interfaces & Contracts
