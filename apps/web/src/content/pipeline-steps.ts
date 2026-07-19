/** Pipeline stage labels for ScreeningTheater (brief-aligned). */

export const PIPELINE_STEPS = [
  { id: "first_pass", label: "Screening · first-pass" },
  { id: "agent_lanes", label: "Sourcing · agent lanes" },
  { id: "gravity", label: "Screening · gravity" },
  { id: "trust_claims", label: "Diligence · Trust check" },
  { id: "validator", label: "Diligence · validator" },
  { id: "three_axis_screen", label: "Screening · 3 axes" },
  { id: "memo_decision", label: "Decision · $100K" },
] as const;
