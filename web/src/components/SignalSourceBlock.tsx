import React from 'react';
import { User, Calendar, Database, ShieldAlert } from 'lucide-react';
import { ExternalSourceIcon } from './ExternalSourceIcon';
import { SourceLinkButton, isValidSourceUrl, checkIdentityMatch } from './SourceLinkButton';

interface SourceProps {
    platform: string;
    username: string;
    author_id: string;
    source_url: string;
    timestamp: string;
}

export const SignalSourceBlock: React.FC<{ source: SourceProps }> = ({ source }) => {
    const identityMatch = checkIdentityMatch(source.source_url, source.username);
    const isValid = isValidSourceUrl(source.source_url);

    return (
        <div className="bg-slate-900/30 rounded-2xl p-6 border border-slate-700/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/10 p-2.5 rounded-xl">
                        <Database className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tighter">Source Attribution</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Origin Metadata</p>
                    </div>
                </div>
                {!identityMatch && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[9px] font-bold uppercase animate-pulse">
                        <ShieldAlert className="w-3 h-3" />
                        Identity Mismatch
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Platform</span>
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-slate-800 rounded border border-slate-700">
                            <ExternalSourceIcon platform={source.platform} className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="text-sm text-white font-mono font-black uppercase tracking-tight">{source.platform}</span>
                    </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Operator Handle</span>
                    <div className="flex items-center gap-2 text-sm text-white font-medium">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className={identityMatch ? "text-white" : "text-amber-400 font-bold"}>
                            @{source.username.replace(/^@/, '')}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 overflow-hidden">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">System Author ID</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50">
                        {source.author_id}
                    </span>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Discovery Lock</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(source.timestamp).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/50">
                <SourceLinkButton 
                    url={source.source_url} 
                    label="View Original Context"
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl justify-center shadow-xl shadow-black/20"
                />
            </div>
        </div>
    );
};

