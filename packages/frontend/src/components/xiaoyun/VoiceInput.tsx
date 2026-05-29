import { useRef, useCallback, useEffect } from 'react';

interface Props {
  onResult: (transcript: string) => void;
  isListening: boolean;
  onListeningChange: (v: boolean) => void;
  disabled: boolean;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

export default function VoiceInput({ onResult, isListening, onListeningChange, disabled }: Props) {
  const recognitionRef = useRef<any>(null);
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        onResult(final);
      }
    };

    recognition.onerror = (event: SpeechRecognitionError) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // Ignore these common errors
      } else {
        console.warn('Speech recognition error:', event.error);
      }
      onListeningChange(false);
    };

    recognition.onend = () => {
      onListeningChange(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.abort(); } catch { /* ignore */ }
    };
  }, [isSupported]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
      onListeningChange(false);
    } else {
      try {
        recognitionRef.current.start();
        onListeningChange(true);
      } catch {
        // Already started
      }
    }
  }, [isListening, disabled, onListeningChange]);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
        isListening
          ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
      } ${disabled && !isListening ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={toggleListening}
      title={isListening ? '点击停止' : '语音输入'}
    >
      {isListening ? (
        <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
        </svg>
      )}
    </button>
  );
}
