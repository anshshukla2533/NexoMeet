"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionEvent = Event & { resultIndex: number; results: SpeechRecognitionResultList };
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
export function useSpeechTranscription(
  speaker: string,
  roomSlug: string,
  onTranscript?: (text: string) => void,
  onError?: (message: string) => void,
) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldListenRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const text = event.results[event.resultIndex]?.[0]?.transcript.trim();
      if (!text) return;
      onTranscript?.(text);
      void (async () => {
        try {
          const response = await fetch(`/api/room/${encodeURIComponent(roomSlug)}/transcript`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ speaker, text }),
          });
          if (!response.ok) {
            const body = await response.json().catch(() => ({})) as { error?: string };
            throw new Error(body.error || "Transcript could not be saved.");
          }
        } catch (error) {
          onError?.(error instanceof Error ? error.message : "Transcript could not be saved.");
        }
      })();
    };
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try { recognition.start(); } catch { /* a restart is already pending */ }
      } else setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => { shouldListenRef.current = false; recognition.stop(); };
  }, [onError, onTranscript, roomSlug, speaker]);

  const toggleTranscription = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    shouldListenRef.current = !shouldListenRef.current;
    if (shouldListenRef.current) {
      try { recognition.start(); setIsListening(true); } catch { /* already started */ }
    } else recognition.stop();
  }, []);

  return { isListening, isSupported, toggleTranscription };
}
