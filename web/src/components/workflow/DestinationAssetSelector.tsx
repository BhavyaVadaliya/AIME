import React from 'react';
import { DestinationAsset } from '../../types/workflow';
import { FileText, ExternalLink } from 'lucide-react';

interface Props {
  selectedAsset: DestinationAsset;
  suggestedAsset: DestinationAsset;
  onChange: (asset: DestinationAsset) => void;
}

export const DestinationAssetSelector: React.FC<Props> = ({
  selectedAsset,
  suggestedAsset,
  onChange
}) => {
  const assetOptions: { value: DestinationAsset; label: string; url: string; description: string }[] = [
    { value: 'course_overview_page', label: 'Course Overview Page', url: '/pathways/nutrition-overview', description: 'Comprehensive guide showcasing curriculum, credentials, and schedule.' },
    { value: 'gime_landing_page', label: 'GIME Landing Page', url: '/gime/explore-pathway', description: 'Interactive entry hub presenting standard career paths and outcomes.' },
    { value: 'confidence_checklist', label: 'Confidence Checklist', url: '/resources/bedside-transition-checklist', description: 'Self-qualification list for nurse-to-nutrition career moves.' },
    { value: 'scope_safe_explainer', label: 'Scope-Safe Explainer', url: '/assets/scope-of-practice-explainer', description: 'Compliance boundaries explaining exactly what you can practice safely.' },
    { value: 'faq_assets', label: 'FAQ Assets', url: '/resources/faq-credentials', description: 'Pre-vetted answers to common professional pathway credential queries.' },
    { value: 'no_asset', label: 'No Asset', url: '', description: 'Direct text response with no supplementary external URL attached.' }
  ];

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-white text-base font-black uppercase tracking-tight">Step 3: Choose Destination Asset</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Attach a high-value landing page or resource file to the CTA</p>
      </div>

      {/* Selector Dropdown */}
      <div className="space-y-3">
        <label htmlFor="destination-asset-dropdown" className="text-xs font-bold text-slate-400">
          Destination Asset (Required)
        </label>
        <select
          id="destination-asset-dropdown"
          value={selectedAsset}
          onChange={(e) => onChange(e.target.value as DestinationAsset)}
          className="w-full bg-slate-950 border-2 border-slate-800 focus:border-indigo-500/50 text-white rounded-xl p-3 text-sm outline-none transition-all cursor-pointer font-bold"
        >
          {assetOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} {option.value === suggestedAsset ? ' (Suggested)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Asset Details */}
      {selectedAsset && (
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/50 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Asset Properties
            </span>
            {selectedAsset !== 'no_asset' && (
              <span className="text-[9px] text-indigo-400 font-mono flex items-center gap-1">
                Link: {assetOptions.find(o => o.value === selectedAsset)?.url} <ExternalLink className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            {assetOptions.find(o => o.value === selectedAsset)?.description}
          </p>
        </div>
      )}
    </div>
  );
};
