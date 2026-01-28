import React from 'react';

// Using a lightweight custom renderer to avoid heavy dependencies while maintaining control.
// This handles basics: Bold, Italic, Links, Code Blocks, Lists.

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-gray-800">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Code block
          const codeContent = part.replace(/```.*\n?/, '').replace(/```$/, '');
          return (
            <div key={index} className="bg-gray-900 rounded-lg p-4 overflow-x-auto my-3 font-mono text-xs text-gray-100 shadow-sm">
              <pre>{codeContent}</pre>
            </div>
          );
        }

        // Process other markdown
        // 1. Split by newlines for paragraphs
        const lines = part.split('\n').filter(l => l.trim() !== '');
        
        return (
          <div key={index}>
            {lines.map((line, i) => {
              // Headers
              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-gray-900 mt-6 mb-2">{parseInline(line.slice(4))}</h3>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-3">{parseInline(line.slice(3))}</h2>;
              if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{parseInline(line.slice(2))}</h1>;
              
              // Lists
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                  <div key={i} className="flex gap-3 ml-2 my-1.5">
                    <span className="text-gray-400 mt-1.5 text-[6px] flex-shrink-0">●</span>
                    <span>{parseInline(line.slice(2))}</span>
                  </div>
                );
              }
              
              // Digits for ordered lists
              if (/^\d+\.\s/.test(line)) {
                 const content = line.replace(/^\d+\.\s/, '');
                 return (
                    <div key={i} className="flex gap-2 ml-2 my-1.5">
                      <span className="text-gray-500 font-mono text-sm">{line.match(/^\d+\./)?.[0]}</span>
                      <span>{parseInline(content)}</span>
                    </div>
                 );
              }

              // Normal Paragraph
              return <p key={i} className="mb-2 last:mb-0">{parseInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

const parseInline = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Simple regex for Bold (**text**) and Links [text](url)
  // Note: This is a simplified parser.
  const regex = /(\*\*(.*?)\*\*)|(\[(.*?)\]\((.*?)\))/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) { // Bold
      elements.push(<strong key={match.index} className="text-gray-900 font-semibold">{match[2]}</strong>);
    } else if (match[3]) { // Link
      elements.push(
        <a 
          key={match.index} 
          href={match[5]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {match[4]}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? elements : [text];
};

export default MarkdownRenderer;