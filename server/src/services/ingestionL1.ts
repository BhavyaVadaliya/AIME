export type RawSignalInput = {
  platform: "tiktok" | "instagram";
  caption?: string;
  hashtags?: string[];
  userId?: string;
  externalPostId?: string;
  detectedAt: string; // ISO timestamp
};

export type NormalizedSignal = {
  platform: "tiktok" | "instagram";
  text: string;             // caption + hashtags merged
  hashtags: string[];
  userId: string | null;
  externalPostId: string | null;
  detectedAt: Date;
};

/**
 * L1 Ingestion: turns messy incoming post metadata into a normalized signal.
 * This will later feed the Signal Engine / PartnerConfig logic.
 */
export function normalizeSignal(input: RawSignalInput): NormalizedSignal {
  const hashtags = (input.hashtags || []).map((tag) =>
    tag.startsWith("#") ? tag.toLowerCase() : `#${tag.toLowerCase()}`
  );

  const caption = (input.caption || "").trim();
  const text =
    caption.length > 0
      ? `${caption} ${hashtags.join(" ")}`
      : hashtags.join(" ");

  return {
    platform: input.platform,
    text: text.trim(),
    hashtags,
    userId: input.userId || null,
    externalPostId: input.externalPostId || null,
    detectedAt: new Date(input.detectedAt),
  };
}