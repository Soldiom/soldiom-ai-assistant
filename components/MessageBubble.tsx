import React from 'react';
import { Message, RoleType } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { ROLES, Icons } from '../constants';

interface MessageBubbleProps {
  message: Message;
  currentRoleType: RoleType;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentRoleType }) => {
  const isUser = message.role === 'user';
  const roleConfig = ROLES.find(r => r.id === currentRoleType);
  const sources = message.groundingChunks || [];
  
  // Remove duplicate sources based on URI
  const uniqueSources = sources.reduce((acc, current) => {
    const x = acc.find(item => item.web?.uri === current.web?.uri);
    if (!x && current.web) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, [] as typeof sources);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-center'} py-4`}>
      <div className={`
        w-full max-w-3xl flex gap-4
        ${isUser ? 'flex-row-reverse' : 'flex-row'}
      `}>
        {/* Avatar Area */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isUser ? 'bg-gray-200 hidden' : 'bg-transparent border border-gray-200 text-gray-900'}
        `}>
          {isUser ? null : (roleConfig?.icon || <Icons.General />)}
        </div>

        {/* Content Area */}
        <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
          
          {/* User Message Bubble */}
          {isUser && (
            <div className="bg-gray-100 text-gray-900 px-5 py-2.5 rounded-3xl inline-block text-left max-w-[90%]">
              <p className="whitespace-pre-wrap">{message.text}</p>
            </div>
          )}

          {/* AI Response */}
          {!isUser && (
            <div className="text-gray-900 pt-1">
              <div className="font-semibold text-sm mb-1 text-gray-900">
                {roleConfig?.name || 'Soldiom'}
              </div>
              <MarkdownRenderer content={message.text} />
              
              {/* Sources Section */}
              {uniqueSources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Sources
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {uniqueSources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.web?.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-white border border-gray-200 hover:bg-gray-50
                          transition-colors group max-w-[200px] text-xs
                        "
                      >
                        <span className="font-mono text-gray-400 group-hover:text-blue-500">{idx + 1}</span>
                        <span className="text-gray-600 truncate group-hover:text-gray-900">
                          {source.web?.title || new URL(source.web?.uri || '').hostname}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;