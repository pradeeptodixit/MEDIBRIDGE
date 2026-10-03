import { useState, useRef, useCallback, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionClass = new () => any;

function getSpeechRecognition(): SpeechRecognitionClass | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch { /* ignore */ }
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback((lang: 'en-IN' | 'hi-IN' = 'en-IN') => {
    setError(null);
    setInterimTranscript('');

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError(
        lang.startsWith('hi')
          ? 'आपके ब्राउज़र में आवाज़ इनपुट समर्थित नहीं है। कृपया Google Chrome का उपयोग करें।'
          : 'Voice input is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    // Clean up any running instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch { /* ignore */ }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalStr += trans;
          } else {
            interimStr += trans;
          }
        }

        if (interimStr) {
          setInterimTranscript(interimStr);
        }

        if (finalStr) {
          setTranscript(prev => (prev ? `${prev} ${finalStr.trim()}` : finalStr.trim()));
          setInterimTranscript('');
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        const errType = event.error;

        if (errType === 'no-speech') {
          // Soft timeout, not a critical failure
          setError(
            lang.startsWith('hi')
              ? 'आवाज़ नहीं सुनी गई। कृपया माइक के पास बोलें या टाइप करें।'
              : 'No speech detected. Please speak closer to mic or type below.'
          );
        } else if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setError(
            lang.startsWith('hi')
              ? 'माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र में माइक की अनुमति दें।'
              : 'Microphone blocked. Please allow microphone permission in your browser address bar.'
          );
        } else if (errType === 'network') {
          setError(
            lang.startsWith('hi')
              ? 'इंटरनेट/नेटवर्क स्पीच सेवा उपलब्ध नहीं है। कृपया टाइप करें।'
              : 'Speech recognition network service unavailable. Please type below.'
          );
        } else if (errType !== 'aborted') {
          setError(`Voice input: ${errType}`);
        }

        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition failed to start:', err);
      setError(
        lang.startsWith('hi')
          ? 'माइक्रोफ़ोन प्रारंभ करने में समस्या हुई। कृपया टाइप करें।'
          : 'Could not access microphone. Please type your symptoms.'
      );
      setIsListening(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Quick fallback simulation for testing or offline environments
  const simulateVoiceInput = useCallback((sampleText: string) => {
    setError(null);
    setIsListening(true);
    setInterimTranscript('...');
    setTimeout(() => {
      setTranscript(sampleText);
      setInterimTranscript('');
      setIsListening(false);
    }, 600);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch { /* ignore */ }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    clearTranscript,
    simulateVoiceInput,
    isSupported: Boolean(getSpeechRecognition()),
  };
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pre-fetch voices and listen to voiceschanged event
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch { /* ignore */ }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch { /* ignore */ }
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string, lang: 'en-IN' | 'hi-IN' = 'en-IN') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not available in this browser');
      return;
    }

    try {
      // If already speaking, cancel first
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Strip markdown asterisks, hashes, backticks, emojis to make TTS clean and natural
      const cleanText = text
        .replace(/[*#_`~>[\]()]/g, ' ')
        .replace(/\bhttps?:\/\/\S+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Retain reference in ref to prevent Chrome V8 garbage collection
      activeUtteranceRef.current = utterance;

      // Smart voice matching with fallbacks
      const voices = window.speechSynthesis.getVoices();
      const isHi = lang.startsWith('hi');

      if (voices && voices.length > 0) {
        let bestVoice: SpeechSynthesisVoice | undefined;

        if (isHi) {
          // Look for Hindi voice
          bestVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'))
            || voices.find(v => v.lang.includes('IN'));
        } else {
          // Look for Indian English first, then any English
          bestVoice = voices.find(v => v.lang.toLowerCase() === 'en-in' || v.name.toLowerCase().includes('india'))
            || voices.find(v => v.lang.startsWith('en'));
        }

        if (bestVoice) {
          utterance.voice = bestVoice;
          utterance.lang = bestVoice.lang;
        } else {
          utterance.lang = isHi ? 'hi-IN' : 'en-US';
        }
      } else {
        utterance.lang = isHi ? 'hi-IN' : 'en-US';
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        // 'canceled' or 'interrupted' is normal when user switches or presses stop
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('SpeechSynthesis error:', e.error);
        }
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);

      // Force resume in case browser paused audio queue
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (err) {
      console.warn('Failed to speak text:', err);
      setIsSpeaking(false);
    }
  }, []);

  const toggleSpeak = useCallback((text: string, lang: 'en-IN' | 'hi-IN' = 'en-IN') => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, lang);
    }
  }, [isSpeaking, speak, stop]);

  return { speak, stop, toggleSpeak, isSpeaking };
}
