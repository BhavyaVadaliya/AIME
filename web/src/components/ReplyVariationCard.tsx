import React, { useState } from 'react';
import { Copy, Check, Edit3 } from 'lucide-react';

interface Props {
    variation: string;
    label: string;
}

export const ReplyVariationCard: React.FC<Props> = ({ variation, label }) => {
    const [text, setText] = useState(variation);
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 transition-all hover:border-slate-600/80 hover:bg-slate-800/60 shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-1.5 rounded-lg transition-colors ${isEditing ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:bg-slate-700'}`}
                        title="Edit Suggestion"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
                        title="Copy to Clipboard"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {isEditing ? (
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-slate-900/80 border border-cyan-500/30 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none min-h-[80px] resize-none font-medium leading-relaxed"
                    autoFocus
                />
            ) : (
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {text}
                </p>
            )}

            {isEditing && (
                <div className="mt-2 flex justify-end">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="text-[10px] font-bold uppercase text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        Done Editing
                    </button>
                </div>
            )}
        </div>
    );
};
