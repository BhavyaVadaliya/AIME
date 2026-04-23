import React from 'react';
import { ExternalLink, User, Calendar, Database } from 'lucide-react';

interface SourceProps {
    platform: string;
    username: string;
    author_id: string;
    source_url: string;
    timestamp: string;
}

export const SignalSourceBlock: React.FC<{ source: SourceProps }> = ({ source }) => {
    const isUnknown = source.platform === 'unknown' || !source.source_url;

    return (
        <div className="bg-slate-900/30 rounded-xl p-5 border border-slate-700/30">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-cyan-500/10 p-2 rounded-lg">
                    <Database className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tighter">Source Attribution</h4>
                    <p className="text-[10px] text-slate-500 uppercase">Origin Metadata</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Platform</span>
                    <span className="text-sm text-cyan-400 font-mono font-bold uppercase">{source.platform}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Handle</span>
                    <div className="flex items-center gap-1.5 text-sm text-white">
                        <User className="w-3 h-3 text-slate-500" />
                        @{source.username}
                    </div>
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Author ID</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate">{source.author_id}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Discovered</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(source.timestamp).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800/50">
                {!isUnknown ? (
                    <a 
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20"
                    >
                        View Original Context
                        <ExternalLink className="w-4 h-4" />
                    </a>
                ) : (
                    <div className="text-center py-2 text-red-400/50 text-xs italic">
                        Direct source URL unavailable for this record
                    </div>
                )}
            </div>
        </div>
    );
};
