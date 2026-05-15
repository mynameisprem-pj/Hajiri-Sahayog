import type { VoiceInputState } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoiceInputOptions {
  onResult: (transcript: string) => void
  onStateChange: (state: VoiceInputState) => void
  onError?: (message: string) => void
  lang?: string
}

// ─── Browser Support Check ────────────────────────────────────────────────────

export function isVoiceInputSupported(): boolean {
  return (
    'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window
  )
}

// ─── Speech Recognition Class ─────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  error?: string
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean

  start(): void
  stop(): void
  abort(): void

  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

type SpeechRecognitionType = SpeechRecognitionConstructor

class VoiceInput {
  private recognition: InstanceType<SpeechRecognitionType> | null = null
  private isListening = false

  start(options: VoiceInputOptions): void {
    if (!isVoiceInputSupported()) {
      options.onError?.('Voice input is not supported in this browser.')
      options.onStateChange('error')
      return
    }

    // Stop any existing session
    this.stop()

    const SpeechRecognition =
      window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: SpeechRecognitionType }).webkitSpeechRecognition

    this.recognition = new SpeechRecognition()
    const recognition = this.recognition

    // Config
    recognition.lang = options.lang ?? 'en-US'
    recognition.interimResults = false  // We only want final results
    recognition.maxAlternatives = 1
    recognition.continuous = false      // Stop after first result

    // Events
    recognition.onstart = () => {
      this.isListening = true
      options.onStateChange('listening')
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim()
      options.onStateChange('processing')

      // Clean up the transcript — capitalize first letter
      const cleaned = transcript.charAt(0).toUpperCase() + transcript.slice(1)
      options.onResult(cleaned)
      options.onStateChange('idle')
    }

    recognition.onerror = (event) => {
      this.isListening = false
      let message = 'Voice input error. Please try again.'

      switch (event.error) {
        case 'not-allowed':
          message = 'Microphone permission denied. Please allow microphone access.'
          break
        case 'no-speech':
          message = 'No speech detected. Please try again.'
          break
        case 'network':
          message = 'Network error. Voice input requires internet for first use.'
          break
        case 'audio-capture':
          message = 'No microphone found.'
          break
        case 'aborted':
          // User cancelled — silently go back to idle
          options.onStateChange('idle')
          return
      }

      options.onError?.(message)
      options.onStateChange('error')
    }

    recognition.onend = () => {
      this.isListening = false
      // If state is still 'listening' (no result came), reset to idle
      options.onStateChange('idle')
    }

    try {
      recognition.start()
    } catch (err) {
      console.error('Speech recognition start error:', err)
      options.onError?.('Could not start voice input.')
      options.onStateChange('error')
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort()
      this.isListening = false
    }
    this.recognition = null
  }

  get listening(): boolean {
    return this.isListening
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

export const voiceInput = new VoiceInput()

// ─── React Hook ───────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react'

export function useVoiceInput(onResult: (transcript: string) => void) {
  const [state, setState] = useState<VoiceInputState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => isVoiceInputSupported())

  const start = useCallback(() => {
    setError(null)
    voiceInput.start({
      onResult: (transcript) => {
        onResult(transcript)
      },
      onStateChange: setState,
      onError: (msg) => {
        setError(msg)
      },
      lang: 'en-US',
    })
  }, [onResult])

  const stop = useCallback(() => {
    voiceInput.stop()
    setState('idle')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceInput.stop()
    }
  }, [])

  return {
    state,
    error,
    isSupported,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    start,
    stop,
  }
}