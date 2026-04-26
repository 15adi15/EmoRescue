"use client";

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { CrisisIncident } from '@emo-rescue/shared-types';
import { AlertTriangle, Flame, Stethoscope, Skull, ShieldAlert, Activity, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
    const [incidents, setIncidents] = useState<CrisisIncident[]>([]);

    const handleDispatch = async (incidentId: string) => {
        try {
            await updateDoc(doc(db, 'incidents', incidentId), {
                status: 'RESCUE_DISPATCHED'
            });
        } catch (e) {
            console.error(e);
        }
    };
    
    // Establishing real-time connection to our Firebase Backend Engine
    useEffect(() => {
        const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedIncidents: CrisisIncident[] = [];
            querySnapshot.forEach((doc) => {
                fetchedIncidents.push(doc.data() as CrisisIncident);
            });
            setIncidents(fetchedIncidents);
        });

        return () => unsubscribe();
    }, []);

    // Helper function to pick threat icons
    const getThreatIcon = (category: string) => {
        switch(category) {
            case 'FIRE': return <Flame className="w-6 h-6 text-orange-500" />;
            case 'MEDICAL': return <Stethoscope className="w-6 h-6 text-blue-400" />;
            case 'INTRUDER': return <Skull className="w-6 h-6 text-purple-500" />;
            default: return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
        }
    };

    // A mock 2D grid map rendering function
    const renderHotelMap = () => {
        // Rooms and Hallways mirroring our routingService graph
        const nodes = [
            { id: 'Room_410', x: 1, y: 1, type: 'ROOM' },
            { id: 'Room_411', x: 2, y: 1, type: 'ROOM' },
            { id: 'Room_412', x: 3, y: 1, type: 'ROOM' },
            { id: 'Hallway_West', x: 2, y: 2, type: 'HALLWAY' },
            { id: 'Stairwell_A', x: 1, y: 3, type: 'EXIT' },
            { id: 'Lobby_Center', x: 3, y: 3, type: 'LOBBY' },
            { id: 'Room_414', x: 4, y: 1, type: 'ROOM' },
            { id: 'Room_415', x: 5, y: 1, type: 'ROOM' },
            { id: 'Hallway_East', x: 4, y: 2, type: 'HALLWAY' },
            { id: 'Stairwell_B', x: 5, y: 3, type: 'EXIT' },
        ];

        return (
            <div className="relative w-full h-[600px] bg-slate-900/50 rounded-xl border border-slate-700/50 p-8 grid grid-cols-5 grid-rows-3 gap-4 shadow-2xl overflow-hidden backdrop-blur-sm">
                {/* Simulated Geofence Glow for active incidents */}
                {incidents.length > 0 && (
                    <div className="absolute inset-0 bg-red-500/5 animate-pulse mix-blend-screen pointer-events-none" />
                )}
                
                {nodes.map(node => {
                    const isHazard = incidents.some(inc => 
                        // Simplified mock visualizer logic: highlight the room and its hallway
                        inc.roomNumber === node.id || (inc.roomNumber === 'Room_412' && node.id === 'Hallway_West') || (inc.roomNumber === 'Room_414' && node.id === 'Hallway_East')
                    );
                    
                    const isEvacRoute = incidents.some(inc => inc.safeEvacuationRoute?.includes(node.id));

                    let bgClass = "bg-slate-800 border-slate-700 text-slate-400";
                    if (isHazard) bgClass = "bg-red-950/80 border-red-500/50 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse";
                    else if (isEvacRoute) bgClass = "bg-emerald-900/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                    else if (node.type === 'EXIT') bgClass = "bg-emerald-950 border-emerald-800 text-emerald-500";
                    else if (node.type === 'LOBBY') bgClass = "bg-slate-800/80 border-slate-600 text-slate-300";

                    return (
                        <div 
                            key={node.id} 
                            className={`col-start-${node.x} row-start-${node.y} flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-500 ${bgClass}`}
                        >
                            <span className="font-bold text-sm tracking-wider">{node.id.replace('_', ' ')}</span>
                            {isHazard && <Flame className="w-5 h-5 mt-2 text-red-500" />}
                            {isEvacRoute && <CheckCircle2 className="w-4 h-4 mt-2 text-emerald-500" />}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-red-500/30">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">Crisis Command OS</h1>
                            <p className="text-xs text-slate-400 font-mono flex items-center">
                                <Activity className="w-3 h-3 mr-1 text-emerald-400" /> SYSTEM ARMED & ACTIVE
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm font-mono text-slate-400">
                        <div className="bg-slate-800 px-4 py-2 rounded-md">ACTIVE INCIDENTS: <span className="text-red-400 font-bold ml-2">{incidents.length}</span></div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2D Map Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white flex items-center">
                            Tactical Floor Plan 
                            <span className="ml-3 text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono border border-slate-700">FLOOR_04</span>
                        </h2>
                        <div className="flex space-x-4 text-xs font-mono">
                            <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-2 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div> Hazard Zone</span>
                            <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div> Safe Route</span>
                        </div>
                    </div>
                    {renderHotelMap()}
                </div>

                {/* Incident Feed */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Live Threat Feed</h2>
                    
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {incidents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 border border-slate-800 border-dashed rounded-xl text-slate-500 bg-slate-900/30">
                                <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                                <p>No Active Incidents</p>
                            </div>
                        ) : (
                            incidents.map((incident) => (
                                <div 
                                    key={incident.incidentId} 
                                    className="bg-slate-900 border border-slate-700/50 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-500 transition-colors"
                                >
                                    {/* Critical glowing edge */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>
                                    
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-slate-800 rounded-lg">
                                                {getThreatIcon(incident.hazardCategory)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-white">Room {incident.roomNumber.replace('Room_', '')}</h3>
                                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                                    {incident.threatLevel} PRIORITY
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500 font-mono">
                                            {new Date(incident.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mt-4 text-sm text-slate-300">
                                        <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                                            <p className="text-xs text-slate-500 mb-1 font-mono uppercase">AI Threat Analysis</p>
                                            <p className="font-medium text-slate-200">"{incident.aiTranslatedContext}"</p>
                                        </div>
                                        
                                        <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                                            <p className="text-xs text-slate-500 mb-1 font-mono uppercase">Dispatched Protocol</p>
                                            <p className="font-medium text-amber-400">"{incident.aiSurvivalPlan}"</p>
                                        </div>
                                    </div>

                                    {incident.status !== 'RESCUE_DISPATCHED' ? (
                                        <button 
                                            onClick={() => handleDispatch(incident.incidentId)} 
                                            className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)] tracking-wider"
                                        >
                                            DISPATCH RESCUE
                                        </button>
                                    ) : (
                                        <div className="mt-4 w-full bg-emerald-900/40 text-emerald-400 font-bold py-3 rounded-lg text-center border border-emerald-500/30 animate-pulse tracking-wider">
                                            RESCUE DISPATCHED
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
