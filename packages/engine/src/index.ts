/**
 * @vibe/engine — VC Brain scoring + memory core
 * Deterministic math for scores; LLM optional for language only.
 */

export type * from "./types";

export {
  MemoryStore,
  DEFAULT_STORE_PATH,
  getStore,
} from "./memory/store";

export {
  extractGravityInputs,
  scoreGravity,
  scoreGravityFromSignals,
  scoreGravityFromSignals as computeGravity,
} from "./scoring/gravity";

export {
  composeFounderScore,
  composeFounderScoreFromGravity,
  composeFounderScoreFromGravity as computeFounderScore,
  type FounderScoreResult,
} from "./scoring/founder-score";

export { screenAxes, screenAxes as screenOpportunity } from "./scoring/axes";

export {
  evaluateClaims,
  parseClaimMetrics,
  dedupeClaims,
} from "./scoring/trust";

export {
  validateClaims,
  type ValidatorResult,
} from "./scoring/validator";

export {
  channelIntelligence,
  KNOWN_SOURCING_CHANNELS,
  type ChannelStat,
  type ChannelIntelligence,
  type ChannelIntelInput,
} from "./scoring/channels";

export {
  inferTrackRecord,
  coherenceFromSignals,
} from "./scoring/track-record";

export { firstPassScreen, type FirstPassResult } from "./scoring/first-pass";

export {
  thesisFit,
  scoreHistoryTrend,
  momentumDelta,
  type ThesisFit,
} from "./scoring/thesis-fit";

export { buildMemo, decide100k } from "./memo/build";

export {
  completeJson,
  completeJsonDetailed,
  openaiChatHealth,
  polishMemoSections,
  type PolishMemoOptions,
} from "./adapters/openai";

export { startRun, step, stepLocal, type TraceRun } from "./trace";

export { queryMemory, tokenizeQuery, extractFilters } from "./query";

export { runVcBrainPipeline, type PipelineResult } from "./pipeline";

export {
  runAgentLanes,
  runCodeForensicsLane,
  runWebResearchLane,
  runClaimValidatorLane,
  runHnScoutLane,
  runMemoryWriterLane,
  AGENT_ENDPOINT_CATALOG,
  type AgentLaneResult,
  type AgentFleetResult,
} from "./agents/lanes";

export {
  normalizeThesis,
  normalizeOwnershipTarget,
  ownershipToPercent,
  defaultThesis,
} from "./thesis";

export * from "./connectors/index";

export {
  UNTRUSTED_SCRAPE_SYSTEM,
  wrapUntrustedScrapedData,
  buildUntrustedExtractUser,
} from "./prompts/untrusted-scrape";

export {
  processOutboundSourcing,
  type OutboundSourcingResult,
  type OutboundFounderExtract,
} from "./pipeline/outbound";

export {
  executeAutomatedDiligence,
  type ClaimVerificationItem,
  type DiligenceRecord,
} from "./pipeline/diligence";

export {
  syncBrandMemory,
  recallBrandMemory,
  containerForBrand,
  type BrandMemoryInput,
  type BrandSyncResult,
} from "./memory/brand-memory";
