"use client";

import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { HazardCategory, IngestionPayload, CrisisIncident } from '@emo-rescue/shared-types';
import { Flame, Stethoscope, Skull, VolumeX, Volume2, ShieldAlert, Navigation, Mic, MicOff, CheckCircle } from 'lucide-react';

const translations: Record<string, Record<string, string>> = {
    en: {
        selectHazard: "Select Hazard",
        commandCenterNotified: "Command center will be notified instantly.",
        qrLinked: "QR LINKED:",
        tapToRecord: "TAP TO RECORD AUDIO",
        recording: "RECORDING... TAP TO STOP",
        audioSaved: "AUDIO SAVED ✓",
        sendSos: "SEND SOS",
        dispatching: "DISPATCHING...",
        sosActive: "SOS ACTIVE",
        securityDispatched: "SECURITY DISPATCHED",
        survivalProtocol: "SURVIVAL PROTOCOL",
        repeatAudio: "REPEAT AUDIO",
        safeRoute: "SAFE ROUTE IDENTIFIED",
        liveComms: "LIVE COMMS ESTABLISHED",
        typeMessage: "Type message to Admin...",
        send: "SEND",
        stealthMode: "STEALTH MODE ACTIVE",
        silentDispatch: "SILENT DISPATCH",
        tapToAlert: "TAP TO ALERT ADMIN",
        keepDeviceLocked: "Keep device locked. Stay silent. Haptic pulses indicate admin updates.",
        spokenSecurityDispatched: "Security has been dispatched. ETA 60 seconds.",
        spokenScreenNormal: "Screen normal. Audio active.",
        spokenSosReceived: "SOS Received. Processing map.",
        clearPathProtocol: "1. Follow map route immediately. 2. Stay low if smoke is present. 3. Do not use elevators.",
        hazardFire: "Fire",
        hazardMedical: "Medical",
        hazardIntruder: "Intruder"
    },
    es: {
        selectHazard: "Seleccionar Peligro",
        commandCenterNotified: "El centro de mando será notificado al instante.",
        qrLinked: "QR VINCULADO:",
        tapToRecord: "TOCAR PARA GRABAR AUDIO",
        recording: "GRABANDO... TOCAR PARA DETENER",
        audioSaved: "AUDIO GUARDADO ✓",
        sendSos: "ENVIAR SOS",
        dispatching: "DESPACHANDO...",
        sosActive: "SOS ACTIVO",
        securityDispatched: "SEGURIDAD DESPACHADA",
        survivalProtocol: "PROTOCOLO DE SUPERVIVENCIA",
        repeatAudio: "REPETIR AUDIO",
        safeRoute: "RUTA SEGURA IDENTIFICADA",
        liveComms: "COMUNICACIONES ESTABLECIDAS",
        typeMessage: "Escriba mensaje al Admin...",
        send: "ENVIAR",
        stealthMode: "MODO SIGILO ACTIVO",
        silentDispatch: "DESPACHO SILENCIOSO",
        tapToAlert: "TOCAR PARA ALERTAR AL ADMIN",
        keepDeviceLocked: "Mantenga el dispositivo bloqueado. Guarde silencio.",
        spokenSecurityDispatched: "La seguridad ha sido despachada. ETA 60 segundos.",
        spokenScreenNormal: "Pantalla normal. Audio activo.",
        spokenSosReceived: "SOS Recibido. Procesando mapa.",
        clearPathProtocol: "1. Siga la ruta del mapa de inmediato. 2. Manténgase agachado si hay humo. 3. No use los ascensores.",
        hazardFire: "Incendio",
        hazardMedical: "Médico",
        hazardIntruder: "Intruso"
    },
    fr: {
        selectHazard: "Sélectionnez le Danger",
        commandCenterNotified: "Le centre de commandement sera notifié instantanément.",
        qrLinked: "QR LIÉ:",
        tapToRecord: "APPUYER POUR ENREGISTRER",
        recording: "ENREGISTREMENT... APPUYER POUR ARRÊTER",
        audioSaved: "AUDIO ENREGISTRÉ ✓",
        sendSos: "ENVOYER SOS",
        dispatching: "ENVOI...",
        sosActive: "SOS ACTIF",
        securityDispatched: "SÉCURITÉ DÉPÊCHÉE",
        survivalProtocol: "PROTOCOLE DE SURVIE",
        repeatAudio: "RÉPÉTER L'AUDIO",
        safeRoute: "ITINÉRAIRE SÉCURISÉ IDENTIFIÉ",
        liveComms: "COMMUNICATIONS ÉTABLIES",
        typeMessage: "Tapez le message à l'Admin...",
        send: "ENVOYER",
        stealthMode: "MODE FURTIF ACTIF",
        silentDispatch: "ENVOI SILENCIEUX",
        tapToAlert: "APPUYEZ POUR ALERTER L'ADMIN",
        keepDeviceLocked: "Gardez l'appareil verrouillé. Restez silencieux.",
        spokenSecurityDispatched: "La sécurité a été dépêchée. ETA 60 secondes.",
        spokenScreenNormal: "Écran normal. Audio actif.",
        spokenSosReceived: "SOS Reçu. Traitement de la carte.",
        clearPathProtocol: "1. Suivez immédiatement l'itinéraire sur la carte. 2. Restez bas s'il y a de la fumée. 3. N'utilisez pas les ascenseurs.",
        hazardFire: "Incendie",
        hazardMedical: "Médical",
        hazardIntruder: "Intrus"
    },
    hi: {
        selectHazard: "खतरा चुनें",
        commandCenterNotified: "कमांड सेंटर को तुरंत सूचित किया जाएगा।",
        qrLinked: "क्यूआर लिंक्ड:",
        tapToRecord: "ऑडियो रिकॉर्ड करने के लिए टैप करें",
        recording: "रिकॉर्डिंग... रोकने के लिए टैप करें",
        audioSaved: "ऑडियो सहेजा गया ✓",
        sendSos: "SOS भेजें",
        dispatching: "भेजा जा रहा है...",
        sosActive: "SOS सक्रिय",
        securityDispatched: "सुरक्षा भेजी गई",
        survivalProtocol: "बचाव प्रोटोकॉल",
        repeatAudio: "ऑडियो दोहराएं",
        safeRoute: "सुरक्षित मार्ग की पहचान की गई",
        liveComms: "लाइव संचार स्थापित",
        typeMessage: "व्यवस्थापक को संदेश टाइप करें...",
        send: "भेजें",
        stealthMode: "स्टेल्थ मोड सक्रिय",
        silentDispatch: "मौन प्रेषण",
        tapToAlert: "व्यवस्थापक को सचेत करने के लिए टैप करें",
        keepDeviceLocked: "डिवाइस लॉक रखें। चुप रहें।",
        spokenSecurityDispatched: "सुरक्षा भेजी गई है। साठ सेकंड में पहुँचेंगे।",
        spokenScreenNormal: "स्क्रीन सामान्य। ऑडियो सक्रिय।",
        spokenSosReceived: "SOS प्राप्त हुआ। नक्शे की प्रक्रिया कर रहे हैं।",
        clearPathProtocol: "1. तुरंत मानचित्र मार्ग का पालन करें। 2. अगर धुआं है तो नीचे रहें। 3. लिफ्ट का उपयोग न करें।",
        hazardFire: "आग",
        hazardMedical: "चिकित्सा",
        hazardIntruder: "घुसपैठिया"
    },
    mr: {
        selectHazard: "धोका निवडा",
        commandCenterNotified: "कमांड सेंटरला त्वरित सूचित केले जाईल.",
        qrLinked: "क्यूआर लिंक:",
        tapToRecord: "ऑडिओ रेकॉर्ड करण्यासाठी टॅप करा",
        recording: "रेकॉर्डिंग... थांबवण्यासाठी टॅप करा",
        audioSaved: "ऑडिओ जतन केले ✓",
        sendSos: "SOS पाठवा",
        dispatching: "पाठवत आहे...",
        sosActive: "SOS सक्रिय",
        securityDispatched: "सुरक्षा पाठवली",
        survivalProtocol: "बचाव प्रोटोकॉल",
        repeatAudio: "ऑडिओ पुन्हा ऐका",
        safeRoute: "सुरक्षित मार्ग ओळखला",
        liveComms: "थेट संवाद स्थापित",
        typeMessage: "प्रशासकाला संदेश टाइप करा...",
        send: "पाठवा",
        stealthMode: "स्टेल्थ मोड सक्रिय",
        silentDispatch: "मौन प्रेषण",
        tapToAlert: "प्रशासकाला सतर्क करण्यासाठी टॅप करा",
        keepDeviceLocked: "डिव्हाइस लॉक ठेवा. शांत राहा.",
        spokenSecurityDispatched: "सुरक्षा पाठवली आहे. साठ सेकंदात पोहोचतील.",
        spokenScreenNormal: "स्क्रीन सामान्य. ऑडिओ सक्रिय.",
        spokenSosReceived: "SOS प्राप्त झाला. नकाशा प्रक्रिया करत आहे.",
        clearPathProtocol: "1. त्वरित नकाशा मार्गाचे अनुसरण करा. 2. धूर असल्यास खाली राहा. 3. लिफ्टचा वापर करू नका.",
        hazardFire: "आग",
        hazardMedical: "वैद्यकीय",
        hazardIntruder: "घुसखोर"
    }
};

const languageMap: Record<string, string> = {
    en: "English",
    es: "Español",
    fr: "Français",
    hi: "हिंदी",
    mr: "मराठी"
};

const voiceLangMap: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    hi: "hi-IN",
    mr: "mr-IN"
};

export default function VictimUI() {
    const [roomNumber, setRoomNumber] = useState<string | null>(null);
    const [hazard, setHazard] = useState<HazardCategory | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'RECEIVED'>('IDLE');
    const [incidentData, setIncidentData] = useState<CrisisIncident | null>(null);
    const [isDarkened, setIsDarkened] = useState(false);
    const [audioMuted, setAudioMuted] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [lang, setLang] = useState('en');

    const t = translations[lang];

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
                        speak(translations[lang].spokenSecurityDispatched);
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [incidentData?.incidentId, audioMuted, lang]);

    const speak = (text: string) => {
        if (audioMuted || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        const targetLang = voiceLangMap[lang] || 'en-US';
        utterance.lang = targetLang;
        
        const voices = window.speechSynthesis.getVoices();
        // Try to find a male voice first
        let voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]) && v.name.toLowerCase().includes('male'));
        
        // Fallback to any voice in that language
        if (!voice) {
            voice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
        }

        // Specific fallback: Chrome macOS often lacks a Marathi (mr-IN) voice but has Hindi (hi-IN)
        if (!voice && targetLang === 'mr-IN') {
            voice = voices.find(v => v.lang.startsWith('hi'));
        }

        if (voice) utterance.voice = voice;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const getHazardLabel = (id: string, t: any) => {
        switch(id) {
            case 'FIRE': return t.hazardFire;
            case 'MEDICAL': return t.hazardMedical;
            case 'INTRUDER': return t.hazardIntruder;
            default: return id;
        }
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
            speak(`${getHazardLabel(selectedHazard, t)}`);
        }
    };

    const handleSOS = async () => {
        if (!hazard || !roomNumber) return;
        
        setStatus('SENDING');
        if (!audioMuted) speak(t.dispatching);

        const payload: IngestionPayload = {
            roomNumber,
            hazardCategory: hazard,
            guestConfirmedIdentity: true,
            timestamp: Date.now(),
            audioBlobUrl: audioBase64 || undefined,
            language: lang
        };

        try {
            const res = await fetch('https://emo-rescue-backend-engine.vercel.app/api/incident', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.success) {
                setIncidentData(json.data);
                setStatus('RECEIVED');
                if (!audioMuted) speak(t.spokenSosReceived);
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
            speak(t.spokenScreenNormal);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || !incidentData?.incidentId) return;
        try {
            await fetch('https://emo-rescue-backend-engine.vercel.app/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    incidentId: incidentData.incidentId,
                    sender: 'VICTIM',
                    text: messageInput.trim()
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
                    <p className="text-sm font-mono tracking-widest">{t.stealthMode}</p>
                    <h1 className="text-2xl font-bold">{t.silentDispatch}</h1>
                    
                    {/* The Silent SOS Button */}
                    <button
                        disabled={!hazard || status === 'SENDING'}
                        onClick={handleSOS}
                        className={`w-full py-8 rounded border border-neutral-900 text-xl font-bold transition-all ${status === 'SENDING' ? 'bg-neutral-900 text-neutral-700' : 'bg-neutral-950 hover:bg-neutral-900 text-neutral-600 active:bg-neutral-800'}`}
                    >
                        {status === 'SENDING' ? t.dispatching : t.tapToAlert}
                    </button>
                    
                    <p className="text-xs">{t.keepDeviceLocked}</p>
                </div>
            </main>
        );
    }

    // Incident Response Screen (After SOS)
    if (status === 'RECEIVED' && incidentData) {
        const isTrapped = incidentData.safeEvacuationRoute.length === 0;
        const isDispatched = incidentData.status === 'RESCUE_DISPATCHED';
        
        // Use translated version of the static clear path plan if applicable
        const displayProtocol = incidentData.aiSurvivalPlan === "1. Follow map route immediately. 2. Stay low if smoke is present. 3. Do not use elevators."
            ? t.clearPathProtocol
            : incidentData.aiSurvivalPlan;

        return (
            <main className={`min-h-screen ${isDarkened ? 'bg-black text-neutral-600' : 'bg-slate-950 text-white'} p-6 flex flex-col transition-colors duration-1000`}>
                <header className={`py-6 flex justify-between items-center border-b mb-8 ${isDarkened ? 'border-neutral-900' : 'border-slate-800'}`}>
                    <h1 className={`text-2xl font-bold flex items-center ${isDarkened ? 'text-neutral-700' : 'text-red-500'}`}>
                        <ShieldAlert className="w-8 h-8 mr-2" />
                        {isDarkened ? 'SOS' : t.sosActive}
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
                            <span className="text-xl font-black tracking-wider">{t.securityDispatched}</span>
                        </div>
                    )}

                    {/* Survival Protocol */}
                    <div className={`${isDarkened ? 'border border-neutral-900' : 'bg-slate-900 border border-slate-800 shadow-2xl'} rounded-2xl p-6`}>
                        <h2 className={`text-sm font-mono uppercase tracking-widest mb-4 ${isDarkened ? 'text-neutral-800' : 'text-slate-400'}`}>{t.survivalProtocol}</h2>
                        
                        <div className={`text-2xl font-bold leading-tight space-y-3 ${isDarkened ? 'text-neutral-700' : (isTrapped ? 'text-amber-500' : 'text-emerald-400')}`}>
                            {displayProtocol.split(/(?=\b\d+\.\s)/).map((step, idx) => {
                                const trimmed = step.trim();
                                if (trimmed === 'TRAPPED.') {
                                    return <div key={idx} className={`${isDarkened ? 'text-neutral-600 border-neutral-900' : 'text-red-500 border-red-500/30'} font-black tracking-widest uppercase mb-4 pb-4 border-b`}>{trimmed}</div>;
                                }
                                return <div key={idx} className="block">{trimmed}</div>;
                            })}
                        </div>
                        
                        {!isDarkened && (
                            <button 
                                onClick={() => speak(displayProtocol)}
                                className="mt-6 flex items-center justify-center w-full bg-slate-800 py-4 rounded-xl font-bold text-white active:bg-slate-700"
                            >
                                <Volume2 className="w-5 h-5 mr-2" /> {t.repeatAudio}
                            </button>
                        )}
                    </div>

                    {/* Evacuation Route Visualization */}
                    {!isTrapped && (
                        <div className={`${isDarkened ? 'border-neutral-900 text-neutral-600' : 'bg-slate-900 border-emerald-900/50 shadow-2xl'} border rounded-2xl p-6 relative overflow-hidden`}>
                            {!isDarkened && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}
                            <h2 className={`text-sm font-mono mb-4 flex items-center ${isDarkened ? 'text-neutral-800' : 'text-emerald-500'}`}>
                                <Navigation className="w-4 h-4 mr-2" />
                                {t.safeRoute}
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
                                {t.liveComms}
                            </h2>
                            
                            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                                {incidentData.messages?.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'VICTIM' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-xl ${msg.sender === 'VICTIM' ? (isDarkened ? 'bg-neutral-900 text-neutral-600' : 'bg-blue-600 text-white') : (isDarkened ? 'bg-black border border-neutral-800 text-neutral-500' : 'bg-slate-800 border border-slate-700 text-slate-200')}`}>
                                            <p className="text-sm font-medium">
                                                {msg.sender === 'ADMIN' ? (msg.translatedText || msg.text) : msg.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={isDarkened ? "..." : t.typeMessage}
                                    className={`flex-1 bg-transparent border rounded-xl px-4 py-3 text-sm focus:outline-none ${isDarkened ? 'border-neutral-900 text-neutral-600 placeholder-neutral-800' : 'border-slate-700 text-white placeholder-slate-500 focus:border-slate-500 focus:bg-slate-800/50'}`}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <button 
                                    onClick={sendMessage} 
                                    className={`px-6 py-3 rounded-xl font-bold transition-transform active:scale-95 ${isDarkened ? 'bg-neutral-900 text-neutral-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'}`}
                                >
                                    {t.send}
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
                    <span className="font-mono text-sm tracking-wider text-slate-400">{t.qrLinked} <strong className="text-white">{roomNumber?.replace('_', ' ')}</strong></span>
                </div>
                <button onClick={toggleGoDark} className="bg-slate-900 p-3 rounded-full text-slate-400 active:bg-slate-800 transition-colors">
                    <VolumeX className="w-5 h-5" />
                </button>
            </header>

            <div className="flex-1 flex flex-col max-w-md mx-auto w-full pt-4">
                
                {/* Language Selection Row */}
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {Object.entries(languageMap).map(([k, v]) => (
                        <button
                            key={k}
                            onClick={() => setLang(k)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                                lang === k 
                                ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                            }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <h1 className="text-4xl font-extrabold mb-2 tracking-tight">{t.selectHazard}</h1>
                <p className="text-slate-400 mb-6">{t.commandCenterNotified}</p>

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
                            <span className="text-2xl font-bold tracking-wide uppercase">{getHazardLabel(h.id, t)}</span>
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
                            {isRecording ? <span className="text-red-400 animate-pulse">{t.recording}</span> : (audioBase64 ? <span className="text-emerald-400">{t.audioSaved}</span> : t.tapToRecord)}
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
                    {status === 'SENDING' ? t.dispatching : t.sendSos}
                </button>
            </div>
        </main>
    );
}
