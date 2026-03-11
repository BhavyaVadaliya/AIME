import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export type Platform = 'tiktok' | 'instagram';

export interface PartnerConfig {
  id: string;
  name: string;
  slug: string;          // e.g. "allmax", "adeeva", "gima"
  region: string[];      // e.g. ["CA", "US"]
  platforms: Platform[]; // which platforms are enabled
  mode: 'standard' | 'high_volume' | 'professional' | 'merged';
  landingUrl: string;
  commentTone: 'educational' | 'coaching' | 'motivational';
  signals: {
    focus: string[];     // e.g. ["health_professional_education"]
    excluded?: string[]; // any topics to filter out
  };
}

// Exported so analytics.ts can import it if needed
export type PartnerConfigSchema = PartnerConfig;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_DIR = path.join(__dirname, '..', 'config', 'partnerConfigs');

function readJsonConfig(fileName: string): PartnerConfig {
  const fullPath = path.join(CONFIG_DIR, fileName);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(raw) as PartnerConfig;
}

export function loadPartnerConfigBySlug(slug: string): PartnerConfig {
  switch (slug) {
    case 'allmax':
      return readJsonConfig('allmax_partner_config_v1.json');
    case 'adeeva':
      return readJsonConfig('adeeva_partner_config_v1.json');
    case 'gima':
      // canonical merged config for Sprint-2
      return readJsonConfig('gima_partner_config_v4.json');
    default:
      throw new Error(`Unknown partner slug: ${slug}`);
  }
}

export function listPartnerConfigs(): PartnerConfig[] {
  return ['allmax', 'adeeva', 'gima'].map(loadPartnerConfigBySlug);
}
