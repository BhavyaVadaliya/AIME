import React from 'react';
import { Target } from 'lucide-react';

interface Props {
    direction: string;
}

export const CtaDirectionHint: React.FC<Props> = ({ direction }) => {
    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                Suggested Direction: <span className="text-white ml-1">{direction}</span>
            </span>
        </div>
    );
};
