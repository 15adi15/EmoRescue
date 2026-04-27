"use client";

import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { HazardCategory, IngestionPayload, CrisisIncident } from '@emo-rescue/shared-types';
import { Flame, Stethoscope, Skull, VolumeX, Volume2, ShieldAlert, Navigation, Mic, MicOff, CheckCircle } from 'lucide-react';

export default function VictimUI() {
    const [roomNumber, setRoomNumber] = useState<string | null>(null);
    const [hazard, setHazard] = useState<HazardCategory | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'RECEIVED'>('IDLE');
    const [incidentData, setIncidentData] = useState<CrisisIncident | null>(null);
    const [isDarkened, setIsDarkened] = useState(false);
    const [audioMuted, setAudioMuted] = useState(false);
    const [messageInput, setMessageInput] = useState('');

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [audioBase64, setAudioBase64] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Parse URL parameters for QR code ingestion (e.g. ?room=Room_111)
        const params = new URLSearchParams(window.location.search);
        const room = params.get('room') || 'Room_111';
        setRoomNumber(room);
    }, []);

    // Firebase Listener for Two-Way Sync
    useEffect(() => {
        if (!incidentData?.incidentId) return;

        const unsubscribe = onSnapshot(doc(db, 'incidents', incidentData.incidentId), (docSnap) => {
            if (docSnap.exists()) {
                const latestData = docSnap.data() as CrisisIncident;
                setIncidentData(latestData);
                
                if (latestData.status === 'RESCUE_DISPATCHED') {
                    // Level 2: Two-Way Real-Time Sync & Level 1: Silent Haptic Pulses
                    if (navigator.vibrate) {
                        navigator.vibrate([200, 100, 200, 100, 500]);
                    }
                    if (!audioMuted) {
                        speak("Security has been dispatched. ETA 60 seconds.");
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [incidentData?.incidentId, audioMuted]);

    const speak = (text: string) => {
        if (audioMuted || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    // Level 1: Automatic Go Dark
    const handleHazardSelection = (selectedHazard: HazardCategory) => {
        setHazard(selectedHazard);
        
        if (selectedHazard === 'INTRUDER') {
            setIsDarkened(true);
            setAudioMuted(true);
            window.speechSynthesis.cancel();
            if (navigator.vibrate) navigator.vibrate([100]); // Silent confirmation
        } else {
            speak(`${selectedHazard} selected.`);
        }
    };

    const handleSOS = async () => {
        if (!hazard || !roomNumber) return;
        
        setStatus('SENDING');
        if (!audioMuted) speak(`Dispatching SOS for ${hazard} in ${roomNumber.replace('_', ' ')}. Please hold.`);

        const payload: IngestionPayload = {
            roomNumber,
            hazardCategory: hazard,
            guestConfirmedIdentity: true,
            timestamp: Date.now(),
            audioBlobUrl: audioBase64 || undefined
        };

        try {
            const res = await fetch('http://localhost:5555/api/incident', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.success) {
                setIncidentData(json.data);
                setStatus('RECEIVED');
                if (!audioMuted) speak(`SOS Received. Processing map.`);
            }
        } catch (error) {
            console.error(error);
            setStatus('IDLE');
            alert("Connection Failed.");
        }
    };

    const toggleGoDark = () => {
        const newDarkState = !isDarkened;
        setIsDarkened(newDarkState);
        setAudioMuted(newDarkState);
        if (newDarkState) {
            window.speechSynthesis.cancel();
        } else {
            speak("Screen normal. Audio active.");
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || !incidentData?.incidentId) return;
        try {
            await updateDoc(doc(db, 'incidents', incidentData.incidentId), {
                messages: arrayUnion({
                    id: Date.now().toString(),
                    sender: 'VICTIM',
                    text: messageInput.trim(),
                    timestamp: Date.now()
                })
            });
            setMessageInput('');
        } catch (e) {
            console.error(e);
        }
    };

    // Level 3: MediaRecorder Logic
    const toggleRecording = async () => {
        if (isRecording) {
            // Stop recording
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            }
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const actualMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                    const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
                    const reader = new FileReader();
                    reader.readAsDataURL(audioBlob);
                    reader.onloadend = () => {
                        setAudioBase64(reader.result as string);
                    };
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsRecording(true);
                if (navigator.vibrate) navigator.vibrate(50);
            } catch (err) {
                console.error("Microphone access denied", err);
            }
        }
    };

    // "Go Dark" mode UI for Active Shooter scenarios
    if (isDarkened && status !== 'RECEIVED') {
        return (
            <main className="min-h-screen bg-black text-neutral-800 flex flex-col items-center justify-center p-6 selection:bg-neutral-900">
                <button 
                    onClick={toggleGoDark}
                    className="absolute top-8 right-8 w-16 h-16 border border-neutral-900 rounded-full flex items-center justify-center"
                >
                    <VolumeX className="w-6 h-6" />
                </button>
                <div className="text-center space-y-6 max-w-sm w-full">
                    <p className="text-sm font-mono tracking-widest">STEALTH MODE ACTIVE</p>
                    <h1 className="text-2xl font-bold">SILENT DISPATCH</h1>
                    
                    {/* The Silent SOS Button */}
                    <button
                        disabled={!hazard || status === 'SENDING'}
                        onClick={handleSOS}
                        className={`w-full py-8 rounded border border-neutral-900 text-xl font-bold transition-all ${status === 'SENDING' ? 'bg-neutral-900 text-neutral-700' : 'bg-neutral-950 hover:bg-neutral-900 text-neutral-600 active:bg-neutral-800'}`}
                    >
                        {status === 'SENDING' ? 'SENDING...' : 'TAP TO ALERT ADMIN'}
                    </button>
                    
                    <p className="text-xs">Keep device locked. Stay silent. Haptic pulses indicate admin updates.</p>
                </div>
            </main>
        );
    }

    // Incident Response Screen (After SOS)
    if (status === 'RECEIVED' && incidentData) {
        const isTrapped = incidentData.safeEvacuationRoute.length === 0;
        const isDispatched = incidentData.status === 'RESCUE_DISPATCHED';

        return (
            <main className={`min-h-screen ${isDarkened ? 'bg-black text-neutral-600' : 'bg-slate-950 text-white'} p-6 flex flex-col transition-colors duration-1000`}>
                <header className={`py-6 flex justify-between items-center border-b mb-8 ${isDarkened ? 'border-neutral-900' : 'border-slate-800'}`}>
                    <h1 className={`text-2xl font-bold flex items-center ${isDarkened ? 'text-neutral-700' : 'text-red-500'}`}>
                        <ShieldAlert className="w-8 h-8 mr-2" />
                        {isDarkened ? 'SOS' : 'SOS ACTIVE'}
                    </h1>
                    <button onClick={toggleGoDark} className={`${isDarkened ? 'text-neutral-800' : 'bg-slate-900 text-slate-400 p-3 rounded-full'}`}>
                        <VolumeX className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-1 space-y-8 max-w-md mx-auto w-full">
                    
                    {/* Level 2: Two-Way Real-Time Sync Visual */}
                    {isDispatched && (
                        <div className={`p-6 rounded-2xl border-2 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.3)]
                            ${isDarkened ? 'bg-black border-neutral-800 text-neutral-500' : 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400'}`}>
                            <CheckCircle className="w-8 h-8 mr-3" />
                            <span className="text-xl font-black tracking-wider">SECURITY DISPATCHED</span>
                        </div>
                    )}

                    {/* Survival Protocol */}
                    <div className={`${isDarkened ? 'border border-neutral-900' : 'bg-slate-900 border border-slate-800 shadow-2xl'} rounded-2xl p-6`}>
                        <h2 className={`text-sm font-mono uppercase tracking-widest mb-4 ${isDarkened ? 'text-neutral-800' : 'text-slate-400'}`}>Survival Protocol</h2>
                        
                        <div className={`text-2xl font-bold leading-tight space-y-3 ${isDarkened ? 'text-neutral-700' : (isTrapped ? 'text-amber-500' : 'text-emerald-400')}`}>
                            {incidentData.aiSurvivalPlan.split(/(?=\b\d+\.\s)/).map((step, idx) => {
                                const trimmed = step.trim();
                                if (trimmed === 'TRAPPED.') {
                                    return <div key={idx} className={`${isDarkened ? 'text-neutral-600 border-neutral-900' : 'text-red-500 border-red-500/30'} font-black tracking-widest uppercase mb-4 pb-4 border-b`}>{trimmed}</div>;
                                }
                                return <div key={idx} className="block">{trimmed}</div>;
                            })}
                        </div>
                        
                        {!isDarkened && (
                            <button 
                                onClick={() => speak(incidentData.aiSurvivalPlan)}
                                className="mt-6 flex items-center justify-center w-full bg-slate-800 py-4 rounded-xl font-bold text-white active:bg-slate-700"
                            >
                                <Volume2 className="w-5 h-5 mr-2" /> REPEAT AUDIO
                            </button>
                        )}
                    </div>

                    {/* Evacuation Route Visualization */}
                    {!isTrapped && (
                        <div className={`${isDarkened ? 'border-neutral-900 text-neutral-600' : 'bg-slate-900 border-emerald-900/50 shadow-2xl'} border rounded-2xl p-6 relative overflow-hidden`}>
                            {!isDarkened && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}
                            <h2 className={`text-sm font-mono mb-4 flex items-center ${isDarkened ? 'text-neutral-800' : 'text-emerald-500'}`}>
                                <Navigation className="w-4 h-4 mr-2" />
                                SAFE ROUTE IDENTIFIED
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {incidentData.safeEvacuationRoute.map((node, i) => (
                                    <div key={node} className="flex items-center">
                                        <div className={`${isDarkened ? 'text-neutral-500 border-neutral-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800/50'} px-3 py-1.5 rounded text-sm font-bold border`}>
                                            {node.replace('_', ' ')}
                                        </div>
                                        {i < incidentData.safeEvacuationRoute.length - 1 && (
                                            <span className={`${isDarkened ? 'text-neutral-800' : 'text-slate-600'} mx-1`}>→</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Level 4: Live Comms Chat */}
                    {isDispatched && (
                        <div className={`${isDarkened ? 'border-neutral-900' : 'bg-slate-900 border-slate-800 shadow-2xl'} border rounded-2xl p-6 flex flex-col h-80`}>
                            <h2 className={`text-sm font-mono uppercase tracking-widest mb-4 flex items-center ${isDarkened ? 'text-neutral-800' : 'text-blue-400'}`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${isDarkened ? 'bg-neutral-800' : 'bg-blue-500 animate-pulse'}`} />
                                LIVE COMMS ESTABLISHED
                            </h2>
                            
                            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                                {incidentData.messages?.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'VICTIM' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-xl ${msg.sender === 'VICTIM' ? (isDarkened ? 'bg-neutral-900 text-neutral-600' : 'bg-blue-600 text-white') : (isDarkened ? 'bg-black border border-neutral-800 text-neutral-500' : 'bg-slate-800 border border-slate-700 text-slate-200')}`}>
                                            <p className="text-sm font-medium">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={isDarkened ? "..." : "Type message to Admin..."}
                                    className={`flex-1 bg-transparent border rounded-xl px-4 py-3 text-sm focus:outline-none ${isDarkened ? 'border-neutral-900 text-neutral-600 placeholder-neutral-800' : 'border-slate-700 text-white placeholder-slate-500 focus:border-slate-500 focus:bg-slate-800/50'}`}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <button 
                                    onClick={sendMessage} 
                                    className={`px-6 py-3 rounded-xl font-bold transition-transform active:scale-95 ${isDarkened ? 'bg-neutral-900 text-neutral-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'}`}
                                >
                                    SEND
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    // Initial Threat Assessment Screen
    return (
        <main className="min-h-screen bg-slate-950 text-white p-6 flex flex-col selection:bg-red-500/30">
            <header className="py-6 flex justify-between items-center">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse mr-2" />
                    <span className="font-mono text-sm tracking-wider text-slate-400">QR LINKED: <strong className="text-white">{roomNumber?.replace('_', ' ')}</strong></span>
                </div>
                <button onClick={toggleGoDark} className="bg-slate-900 p-3 rounded-full text-slate-400 active:bg-slate-800 transition-colors">
                    <VolumeX className="w-5 h-5" />
                </button>
            </header>

            <div className="flex-1 flex flex-col max-w-md mx-auto w-full pt-8">
                <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Select Hazard.</h1>
                <p className="text-slate-400 mb-6">Command center will be notified instantly.</p>

                <div className="space-y-4 mb-auto">
                    {[
                        { id: 'FIRE', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', activeBorder: 'border-orange-500 ring-4 ring-orange-500/20' },
                        { id: 'MEDICAL', icon: Stethoscope, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', activeBorder: 'border-blue-400 ring-4 ring-blue-400/20' },
                        { id: 'INTRUDER', icon: Skull, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30', activeBorder: 'border-purple-500 ring-4 ring-purple-500/20' }
                    ].map(h => (
                        <button
                            key={h.id}
                            onClick={() => handleHazardSelection(h.id as HazardCategory)}
                            className={`w-full flex items-center p-6 rounded-2xl border-2 transition-all duration-200 ${
                                hazard === h.id ? h.activeBorder + ' ' + h.bg : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                            }`}
                        >
                            <h.icon className={`w-8 h-8 ${h.color} mr-4`} />
                            <span className="text-2xl font-bold tracking-wide">{h.id}</span>
                        </button>
                    ))}
                </div>

                {/* Level 3: Audio Recording */}
                {hazard && hazard !== 'INTRUDER' && (
                    <div className="mt-8 flex items-center justify-center space-x-4">
                        <button 
                            onClick={toggleRecording}
                            className={`flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500/20 border-red-500 scale-110 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'} border-2`}
                        >
                            {isRecording ? <Mic className="w-8 h-8 text-red-500 animate-pulse" /> : <MicOff className="w-8 h-8 text-slate-400" />}
                        </button>
                        <div className="text-sm text-slate-400 font-mono">
                            {isRecording ? <span className="text-red-400 animate-pulse">RECORDING... TAP TO STOP</span> : (audioBase64 ? <span className="text-emerald-400">AUDIO SAVED ✓</span> : 'TAP TO RECORD AUDIO')}
                        </div>
                    </div>
                )}

                <button
                    disabled={!hazard || status === 'SENDING'}
                    onClick={handleSOS}
                    className={`mt-6 w-full py-6 rounded-2xl text-2xl font-extrabold tracking-widest transition-all duration-300 shadow-2xl
                        ${!hazard ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed' : 
                          'bg-red-600 text-white hover:bg-red-500 active:scale-95 shadow-[0_0_40px_rgba(220,38,38,0.5)]'}`}
                >
                    {status === 'SENDING' ? 'DISPATCHING...' : 'SEND SOS'}
                </button>
            </div>
        </main>
    );
}
