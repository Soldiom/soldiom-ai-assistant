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
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isStreaming?: boolean;
  groundingChunks?: GroundingChunk[];
}

export interface ChatSessionState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}