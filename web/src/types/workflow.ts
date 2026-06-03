export type CtaLevel =
  | "trust_only"
  | "educational_cta"
  | "resource_cta"
  | "conversation_cta"
  | "course_awareness_cta"
  | "enrollment_cta";

export type DestinationAsset =
  | "course_description"
  | "course_overview_page"
  | "gime_landing_page"
  | "confidence_checklist"
  | "scope_safe_explainer"
  | "faq_assets"
  | "no_asset";

export type FinalAction =
  | "save_for_later"
  | "respond_manually"
  | "copy_response"
  | "open_source_post"
  | "insert_draft"
  | "mark_follow_up"
  | "disqualify";

export type EngagementState =
  | "new"
  | "reviewed"
  | "needs_response"
  | "response_drafted"
  | "waiting"
  | "follow_up_needed"
  | "not_fit"
  | "closed";

export interface WorkflowPanelState {
  signal_id: string;
  qualification_confirmed: boolean;
  selected_cta_level: CtaLevel;
  selected_destination_asset: DestinationAsset;
  final_action: FinalAction;
  engagement_state: EngagementState;
  last_action?: string;
  follow_up_required: boolean;
  operator_note?: string;
  updated_at: string;
}
