import React from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';

interface Props {
    url?: string;
    label?: string;
    className?: string;
    showIcon?: boolean;
}

export const isValidSourceUrl = (url?: string): boolean => {
    if (!url || url.trim() === '') return false;
    
    try {
        const parsed = new URL(url);
        // Sprint 11: Primarily TikTok
        const allowedDomains = ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com'];
        return allowedDomains.some(domain => parsed.hostname.endsWith(domain));
    } catch (e) {
        return false;
    }
};

export const checkIdentityMatch = (url?: string, username?: string): boolean => {
    if (!url || !username) return true;
    try {
        const u = url.toLowerCase();
        const user = username.toLowerCase().replace(/^@/, '');
        return u.includes(`@${user}`) || u.includes(user);
    } catch (e) {
        return true;
    }
};

export const SourceLinkButton: React.FC<Props> = ({ 
    url, 
    label = "View Source", 
    className = "", 
    showIcon = true 
}) => {
    const isValid = isValidSourceUrl(url);

    if (!isValid) {
        return (
            <div className={`flex items-center gap-1.5 text-slate-500 cursor-not-allowed opacity-50 ${className}`}>
                <AlertCircle className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase italic">Source Unavailable</span>
            </div>
        );
    }

    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`flex items-center gap-1.5 text-cyan-500 hover:text-cyan-400 transition-colors group ${className}`}
            onClick={(e) => e.stopPropagation()} // Prevent card click
        >
            <span className="text-[10px] font-bold uppercase tracking-wider underline underline-offset-4 decoration-cyan-500/30 group-hover:decoration-cyan-400">
                {label}
            </span>
            {showIcon && <ExternalLink className="w-3 h-3" />}
        </a>
    );
};
