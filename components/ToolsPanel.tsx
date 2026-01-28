import React, { useState } from 'react';
import { Icons, LANGUAGES } from '../constants';
import * as HF from '../services/huggingFaceService';

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (content: string, type: 'text' | 'image' | 'code') => void;
}

type ToolType = 'image' | 'code' | 'translate' | 'summarize' | null;

const ToolsPanel: React.FC<ToolsPanelProps> = ({ isOpen, onClose, onResult }) => {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetLang, setTargetLang] = useState('spa_Latn');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      if (activeTool === 'image') {
        const blob = await HF.generateImage(input);
        const url = URL.createObjectURL(blob);
        onResult(url, 'image');
        onClose();
      } else if (activeTool === 'code') {
        const result = await HF.generateCode(input);
        onResult(result, 'code');
        onClose();
      } else if (activeTool === 'translate') {
        // Assume English src for simplicity or auto
        const result = await HF.translateText(input, 'eng_Latn', targetLang);
        onResult(`**Translation (${targetLang.split('_')[0]}):**\n${result}`, 'text');
        onClose();
      } else if (activeTool === 'summarize') {
        const result = await HF.summarizeText(input);
        onResult(`**Summary:**\n${result}`, 'text');
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute tool");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/10 z-30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-2xl z-40 p-4 flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Icons.Tools /> AI Tools
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {!activeTool ? (
          <div className="space-y-3">
            <button onClick={() => setActiveTool('image')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 text-left">
              <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><Icons.Image /></div>
              <div>
                <div className="font-medium text-sm">Image Generation</div>
                <div className="text-xs text-gray-500">FLUX.1-schnell</div>
              </div>
            </button>
            <button onClick={() => setActiveTool('code')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 text-left">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Icons.Code /></div>
              <div>
                <div className="font-medium text-sm">Code Assistant</div>
                <div className="text-xs text-gray-500">StarCoder2</div>
              </div>
            </button>
            <button onClick={() => setActiveTool('translate')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 text-left">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Icons.Translate /></div>
              <div>
                <div className="font-medium text-sm">Translator</div>
                <div className="text-xs text-gray-500">NLLB-200</div>
              </div>
            </button>
            <button onClick={() => setActiveTool('summarize')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 text-left">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Icons.Summarize /></div>
              <div>
                <div className="font-medium text-sm">Summarizer</div>
                <div className="text-xs text-gray-500">BART-Large</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <button onClick={() => setActiveTool(null)} className="text-sm text-gray-500 hover:text-black mb-4 flex items-center gap-1">
              ← Back to tools
            </button>
            
            <h3 className="font-bold text-gray-900 mb-2">
              {activeTool === 'image' && 'Generate Image'}
              {activeTool === 'code' && 'Generate Code'}
              {activeTool === 'translate' && 'Translate Text'}
              {activeTool === 'summarize' && 'Summarize Text'}
            </h3>

            {activeTool === 'translate' && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Language</label>
                <select 
                  className="w-full p-2 rounded-lg border border-gray-300 text-sm"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              className="w-full flex-1 p-3 border border-gray-300 rounded-xl resize-none text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={
                activeTool === 'image' ? "Describe the image..." :
                activeTool === 'code' ? "Describe what code you need..." :
                "Enter text here..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            {error && (
              <div className="p-2 mb-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="w-full py-2.5 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Run Tool'
              )}
            </button>
          </div>
        )}

        <div className="mt-auto pt-6 text-center">
            <div className="text-[10px] text-gray-400">Powered by Hugging Face Inference API</div>
        </div>
      </div>
    </>
  );
};

export default ToolsPanel;
