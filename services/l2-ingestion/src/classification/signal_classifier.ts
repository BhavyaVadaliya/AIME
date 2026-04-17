import * as fs from 'fs';
import * as path from 'path';

export type PrimaryCategory = 'Monetization' | 'Engagement' | 'Professional Pathway' | 'Education' | 'Lifestyle' | 'Promotion' | 'UNCLASSIFIED';
export type SignalType = 'Content' | 'Question' | 'Problem' | 'Offer' | 'CTA';
export type ContextTag = 'Clinical' | 'Coaching' | 'Fitness' | 'General Wellness';

export interface SignalClassification {
  primary_category: PrimaryCategory;
  signal_type: SignalType;
  context_tags: ContextTag[];
}

/**
 * Deterministic Signal Classifier for GIME signals.
 * Rules are non-overlapping and priority-based.
 */
export function classifySignal(text: string): SignalClassification {
  const t = text.toLowerCase();

  // 1. PRIMARY CATEGORY (Priority Order: Monetization > Professional Pathway > Education > Promotion > Lifestyle > Engagement)
  let primaryCategory: PrimaryCategory = 'UNCLASSIFIED'; // Strict Deterministic Root

  if (t.includes('price') || t.includes('cost') || t.includes('buy') || t.includes('earn')) {
    primaryCategory = 'Monetization';
  } else if (t.includes('become') || t.includes('certification') || t.includes('certified') || t.includes('career') || t.includes('professional')) {
    primaryCategory = 'Professional Pathway';
  } else if (t.includes('learn') || t.includes('course') || t.includes('training') || t.includes('study')) {
    primaryCategory = 'Education';
  } else if (t.includes('limited offer') || t.includes('sign up') || t.includes('join now')) {
    primaryCategory = 'Promotion';
  } else if (t.includes('routine') || t.includes('daily habits') || t.includes('habit')) {
    primaryCategory = 'Lifestyle';
  } else if (t.includes('follow') || t.includes('like') || t.includes('comment') || t.includes('subscribe')) {
    primaryCategory = 'Engagement';
  }

  // 1️⃣ Education Fallback (Runs if no stronger rule matched)
  if (primaryCategory === 'UNCLASSIFIED') {
    if (t.includes('tips') || t.includes('guide') || t.includes('explained') || 
        t.includes('how to') || t.includes('ways to') || t.includes('best way to') || 
        t.includes('what is') || t.includes('science')) {
      primaryCategory = 'Education';
    }
  }

  // 2. SIGNAL TYPE
  let signalType: SignalType = 'Content';

  if (t.includes('struggling') || t.includes("can't") || t.includes('issue') || t.includes('problem') || t.includes('trouble')) {
    signalType = 'Problem';
  } else if (t.includes('offering') || t.includes('available now')) {
    signalType = 'Offer';
  } else if (t.includes('buy') || t.includes('join') || t.includes('sign up') || t.includes('click link')) {
    signalType = 'CTA';
  }

  // 2️⃣ Question Type Fallback
  if (signalType === 'Content') {
    const trimmedText = t.trim();
    if (
      trimmedText.includes('?') || 
      trimmedText.startsWith('how') || 
      trimmedText.startsWith('what') || 
      trimmedText.startsWith('why') || 
      trimmedText.startsWith('when') || 
      trimmedText.startsWith('where') || 
      trimmedText.startsWith('is ') || 
      trimmedText.startsWith('are ') || 
      trimmedText.startsWith('can ') || 
      trimmedText.startsWith('should ')
    ) {
      signalType = 'Question';
    }
  }

  // 3️⃣ Question-Category Coverage Improvement (Hotfixed Path)
  if (primaryCategory === 'UNCLASSIFIED' && signalType === 'Question') {
    try {
      // Config-driven approach for multi-tenant readiness
      const configPath = path.resolve(__dirname, '..', '..', '..', '..', 'config', 'classification', 'question_category_mapping.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const professionalKeywords = config.professional_pathway_keywords || [];
        const monetizationKeywords = config.monetization_keywords || [];

        const containsKeyword = (keywords: string[]): boolean =>
          keywords.some(keyword => t.includes(keyword.toLowerCase()));

        if (containsKeyword(professionalKeywords)) {
          primaryCategory = 'Professional Pathway';
        } else if (containsKeyword(monetizationKeywords)) {
          primaryCategory = 'Monetization';
        } else {
          primaryCategory = 'Education';
        }
      } else {
        // Hardcoded safety fallback if config missing
        if (t.includes('career') || t.includes('certification') || t.includes('certified') || t.includes('course') || t.includes('become')) {
          primaryCategory = 'Professional Pathway';
        } else if (t.includes('cost') || t.includes('price')) {
          primaryCategory = 'Monetization';
        } else {
          primaryCategory = 'Education';
        }
      }
    } catch (e) {
      primaryCategory = 'Education';
    }
  }

  // 4️⃣ Hashtag-Aware Fallback (Calibration Enhancement)
  if (primaryCategory === 'UNCLASSIFIED') {
    try {
      const hashtags = (t.match(/#(\w+)/g) || []).map(tag => tag.substring(1));
      const mappingPath = path.resolve(__dirname, '..', '..', '..', '..', 'config', 'classification', 'hashtag_category_mapping.json');
      
      if (fs.existsSync(mappingPath)) {
        const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        
        if (hashtags.some(tag => mapping.professional_pathway_hashtags?.includes(tag))) {
          primaryCategory = 'Professional Pathway';
        } else if (hashtags.some(tag => mapping.monetization_hashtags?.includes(tag))) {
          primaryCategory = 'Monetization';
        } else if (hashtags.some(tag => mapping.education_hashtags?.includes(tag))) {
          primaryCategory = 'Education';
        }
      }
    } catch (e) {
      // Skip hashtag mapping on error
    }
  }

  // 4. CONTEXT TAGS (Multi-assignment)
  const contextTags: ContextTag[] = [];
  if (t.includes('patient') || t.includes('clinical') || t.includes('diagnosis')) {
    contextTags.push('Clinical');
  }
  if (t.includes('coach') || t.includes('client') || t.includes('program')) {
    contextTags.push('Coaching');
  }
  if (t.includes('workout') || t.includes('gym') || t.includes('exercise')) {
    contextTags.push('Fitness');
  }
  if (t.includes('wellness') || t.includes('lifestyle') || t.includes('health')) {
    contextTags.push('General Wellness');
  }

  return {
    primary_category: primaryCategory,
    signal_type: signalType,
    context_tags: contextTags
  };
}
