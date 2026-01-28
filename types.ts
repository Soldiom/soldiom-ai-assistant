import React from 'react';

export enum RoleType {
  DOCTOR = 'DOCTOR',
  ENGINEER = 'ENGINEER',
  CYBERSECURITY = 'CYBERSECURITY',
  AI_EXPERT = 'AI_EXPERT',
  GENERAL = 'GENERAL'
}

export interface RoleConfig {
  id: RoleType;
  name: string;
  description: string;
  systemInstruction: string;
  icon: React.ReactNode;
  color: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  groundingChunks?: GroundingChunk[];
  image?: string; // Data URL for generated images
  audio?: string; // Data URL for TTS/Audio
  isToolOutput?: boolean; // To style tool outputs differently
}

export interface ChatSessionState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
