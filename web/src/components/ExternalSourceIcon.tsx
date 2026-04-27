import React from 'react';
import { ExternalLink, Instagram, Twitter, MessageSquare, Globe } from 'lucide-react';

interface Props {
    platform: string;
    className?: string;
}

export const ExternalSourceIcon: React.FC<Props> = ({ platform, className = "w-4 h-4" }) => {
    const p = platform.toLowerCase();
    
    // Custom TikTok icon since Lucide doesn't have a great one
    if (p === 'tiktok') {
        return (
            <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={className}
            >
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
            </svg>
        );
    }

    if (p === 'instagram') return <Instagram className={className} />;
    if (p === 'twitter' || p === 'x') return <Twitter className={className} />;
    if (p === 'reddit') return <MessageSquare className={className} />;
    
    return <Globe className={className} />;
};
