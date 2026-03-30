import mongoose, { Schema, Document } from 'mongoose';

export interface ISignal extends Document {
  signal_id: string;
  source: string;
  raw_text: string;
  metadata?: any;
  topics: string[];
  subtopics: string[];
  context_summary?: string;
  flags: string[];
  actionable: boolean;
  ingested_at: Date;
  status: 'accepted' | 'rejected';
  governance_status: 'passed' | 'blocked';
}

const SignalSchema: Schema = new Schema({
  signal_id: { type: String, required: true, unique: true },
  source: { type: String, required: true, default: 'tiktok' },
  raw_text: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  topics: [{ type: String }],
  subtopics: [{ type: String }],
  context_summary: { type: String },
  flags: [{ type: String }],
  actionable: { type: Boolean, default: false },
  ingested_at: { type: Date, default: Date.now },
  status: { type: String, enum: ['accepted', 'rejected'], default: 'accepted' },
  governance_status: { type: String, enum: ['passed', 'blocked'], default: 'passed' },
});

// Index for dashboard performance
SignalSchema.index({ ingested_at: -1 });

export default mongoose.model<ISignal>('Signal', SignalSchema);
