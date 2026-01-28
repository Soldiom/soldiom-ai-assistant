import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '@google/genai';
import { ROLES, Icons } from './constants';
import { Message, RoleType, RoleConfig } from './types';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import ToolsPanel from './components/ToolsPanel';
import { createChat, sendMessageStream } from './services/geminiService';
import * as HF from './services/huggingFaceService';

export default function App() {
  const [currentRole, setCurrentRole] = useState<RoleConfig>(ROLES[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Chat session ref to persist across renders
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const initChat = () => {
    try {
        chatSessionRef.current = createChat(currentRole.systemInstruction, isThinkingEnabled);
    } catch (e) {
        console.error("Failed to initialize chat", e);
    }
  };

  useEffect(() => {
    initChat();
  }, [currentRole, isThinkingEnabled]);

  const handleNewChat = () => {
      setMessages([]);
      setInputValue('');
      initChat();
      setSidebarOpen(false);
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setIsLoading(true); // temporary loading indicator for transcription
          try {
             const text = await HF.transcribeAudio(audioBlob);
             setInputValue(prev => prev + (prev ? ' ' : '') + text);
          } catch (e) {
             console.error("Transcription failed", e);
             alert("Transcription failed. Check console/HF_TOKEN.");
          } finally {
             setIsLoading(false);
          }
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Mic access denied", e);
        alert("Microphone access denied or not available.");
      }
    }
  };

  const handleToolResult = (content: string, type: 'text' | 'image' | 'code') => {
      // Add tool output as a system message
      const msg: Message = {
          id: Date.now().toString(),
          role: 'system',
          text: type === 'image' ? 'Image Generated' : content,
          image: type === 'image' ? content : undefined,
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, msg]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    if (!chatSessionRef.current) initChat();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    
    // Placeholder for bot message
    setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '',
        timestamp: Date.now(),
        isStreaming: true,
        groundingChunks: []
    }]);

    try {
      let accumulatedText = '';
      
      if (chatSessionRef.current) {
          await sendMessageStream(
            chatSessionRef.current,
            userMsg.text,
            (text, chunks) => {
              accumulatedText += text;
              setMessages(prev => prev.map(msg => {
                if (msg.id === botMsgId) {
                  return {
                    ...msg,
                    text: accumulatedText,
                    groundingChunks: chunks 
                  };
                }
                return msg;
              }));
            }
          );
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === botMsgId) {
          return {
            ...msg,
            text: msg.text + "\n\n**System Error:** Unable to retrieve verified response. Please try again.",
          };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, isStreaming: false } : msg));
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
      />

      {/* Tools Panel */}
      <ToolsPanel 
        isOpen={toolsOpen} 
        onClose={() => setToolsOpen(false)} 
        onResult={handleToolResult} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-3 md:px-4 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-md lg:hidden"
            >
              <Icons.PanelLeft />
            </button>
            
            {/* Role Selector Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 font-medium text-lg"
                >
                    <span>{currentRole.name}</span>
                    <Icons.ChevronDown />
                </button>

                {isRoleMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsRoleMenuOpen(false)}></div>
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-100">
                            {ROLES.map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => {
                                        setCurrentRole(role);
                                        setIsRoleMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${currentRole.id === role.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                                >
                                    <div className={`text-gray-500 ${currentRole.id === role.id ? 'text-black' : ''}`}>
                                        {role.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-sm font-medium ${currentRole.id === role.id ? 'text-black' : 'text-gray-700'}`}>{role.name}</div>
                                        <div className="text-[10px] text-gray-400">{role.description}</div>
                                    </div>
                                    {currentRole.id === role.id && (
                                        <div className="w-2 h-2 rounded-full bg-black"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
               onClick={() => setToolsOpen(true)}
               className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-xs font-medium hover:bg-gray-800 transition-colors"
             >
                <Icons.Tools />
                <span className="hidden md:inline">Tools</span>
             </button>
             <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs cursor-pointer">
                 S
             </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {messages.length === 0 ? (
                // Hero / Empty State
                <div className="h-full flex flex-col items-center justify-center p-4 pb-32">
                     <div className="w-12 h-12 bg-white rounded-full shadow-sm mb-6 flex items-center justify-center">
                         <div className="text-gray-900">
                             {currentRole.icon}
                         </div>
                     </div>
                     <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8 text-center">
                        What can I help with?
                     </h2>
                </div>
            ) : (
                // Messages List
                <div className="w-full max-w-3xl mx-auto px-4 pb-32 pt-4">
                    {messages.map((msg) => (
                        <MessageBubble 
                            key={msg.id} 
                            message={msg} 
                            currentRoleType={currentRole.id} 
                        />
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm py-4 ml-10">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/0 p-4 md:pb-6">
           <div className="max-w-3xl mx-auto">
              <div className="relative bg-[#f4f4f4] rounded-[26px] px-4 py-3 shadow-sm focus-within:ring-1 focus-within:ring-gray-200 focus-within:bg-white border border-transparent focus-within:border-gray-200 transition-all">
                  
                  {/* Attach Button */}
                  <div className="absolute left-3 bottom-3 md:bottom-3.5">
                      <button 
                        onClick={() => setToolsOpen(!toolsOpen)}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                        title="AI Tools"
                      >
                          <Icons.Plus />
                      </button>
                  </div>

                  {/* Text Input */}
                  <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                          }
                      }}
                      placeholder={isRecording ? "Listening..." : "Ask anything..."}
                      className="
                          w-full max-h-[200px] pl-10 pr-24 md:pl-10 md:pr-32 py-2 
                          bg-transparent border-none focus:ring-0 resize-none 
                          text-gray-900 placeholder-gray-500
                          scrollbar-hide
                      "
                      rows={1}
                  />

                  {/* Right Actions */}
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      {/* Thinking Toggle */}
                      <button 
                         onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                         className={`
                           flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium transition-colors border
                           ${isThinkingEnabled ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-transparent text-gray-400 border-transparent hover:bg-gray-200/50'}
                         `}
                         title="Extended Thinking"
                      >
                         <Icons.Brain />
                         <span className="hidden md:inline">Reasoning</span>
                      </button>

                      {/* Mic Button */}
                      <button 
                        onClick={handleVoiceInput}
                        className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'text-gray-900 hover:bg-gray-200'}`}
                      >
                          <Icons.Mic />
                      </button>

                      {/* Send Button */}
                      <button
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isLoading}
                          className={`
                              p-2 rounded-full transition-all duration-200 flex items-center justify-center
                              ${!inputValue.trim() || isLoading 
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                  : 'bg-black text-white hover:bg-gray-800'}
                          `}
                      >
                          <Icons.ArrowUp />
                      </button>
                  </div>
              </div>
              <div className="text-center mt-2">
                 <p className="text-[10px] text-gray-400">
                    Soldiom can make mistakes. Check important info.
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}