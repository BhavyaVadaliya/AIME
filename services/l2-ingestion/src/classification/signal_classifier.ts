export type PrimaryCategory = 'Monetization' | 'Engagement' | 'Professional Pathway' | 'Education' | 'Lifestyle' | 'Promotion';
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
  let primaryCategory: PrimaryCategory = 'Engagement'; // Default/Fallback

  if (t.includes('price') || t.includes('cost') || t.includes('buy') || t.includes('earn')) {
    primaryCategory = 'Monetization';
  } else if (t.includes('how do i become') || t.includes('certification') || t.includes('career') || t.includes('professional')) {
    primaryCategory = 'Professional Pathway';
  } else if (t.includes('learn') || t.includes('course') || t.includes('training') || t.includes('study')) {
    primaryCategory = 'Education';
  } else if (t.includes('limited offer') || t.includes('sign up') || t.includes('join now')) {
    primaryCategory = 'Promotion';
  } else if (t.includes('tips') || t.includes('routine') || t.includes('daily habits') || t.includes('habit')) {
    primaryCategory = 'Lifestyle';
  } else if (t.includes('follow') || t.includes('like') || t.includes('comment') || t.includes('subscribe')) {
    primaryCategory = 'Engagement';
  }

  // 2. SIGNAL TYPE
  let signalType: SignalType = 'Content';

  if (t.trim().endsWith('?')) {
    signalType = 'Question';
  } else if (t.includes('struggling') || t.includes("can't") || t.includes('issue') || t.includes('problem')) {
    signalType = 'Problem';
  } else if (t.includes('offering') || t.includes('available now')) {
    signalType = 'Offer';
  } else if (t.includes('buy') || t.includes('join') || t.includes('sign up') || t.includes('click link')) {
    signalType = 'CTA';
  }

  // 3. CONTEXT TAGS (Multi-assignment)
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
