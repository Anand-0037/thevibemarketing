import type { Founder, Memo, Signal, StoreData } from '../types';

/** Canonical sourcing channels we expect to cover (demo + live connectors). */
export const KNOWN_SOURCING_CHANNELS = [
  'github',
  'hackernews',
  'producthunt',
  'twitter',
  'linkedin',
  'reddit',
  'arxiv',
  'accelerator',
  'hackathon',
  'substack',
] as const;

export type ChannelStat = {
  source: string;
  count: number;
  /** Mean stars-like gravity proxy across signals from this source. */
  avg_stars: number;
  /** Mean HN-points-like gravity proxy across signals from this source. */
  avg_hn: number;
  /** Distinct founders (entity_id) touched by this source. */
  founders_touched: number;
  /** Mean Founder Score of founders touched by this channel (quality). */
  avg_founder_score: number;
  /** Count of $100K YES memos among founders touched (when memos present). */
  yes_decisions: number;
  /** Simple rank: volume × (1 + log1p(gravity)) × quality multiplier. */
  rank_score: number;
};

export type ChannelIntelligence = {
  channels: ChannelStat[];
  underexplored: string[];
  tip: string;
};

export type ChannelIntelInput =
  | Pick<StoreData, 'signals' | 'founders' | 'memos'>
  | StoreData
  | { signals: Signal[]; founders?: Founder[]; memos?: Memo[] };

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return 0;
}

function signalStars(s: Signal): number {
  const p = s.payload;
  return Math.max(
    0,
    num(p.stars ?? p.stargazers_count ?? p.github_stars),
  );
}

function signalHn(s: Signal): number {
  const p = s.payload;
  return Math.max(0, num(p.hn_points ?? p.points ?? p.score));
}

function normalizeSource(source: string): string {
  const s = source.trim().toLowerCase();
  if (s === 'x' || s === 'twitter.com') return 'twitter';
  if (s === 'hn' || s === 'hacker news') return 'hackernews';
  if (s === 'gh' || s === 'github.com') return 'github';
  if (s === 'ph' || s === 'product hunt') return 'producthunt';
  return s;
}

/**
 * Aggregate signals by source → counts, gravity proxies, founder quality.
 * Ranks channels by volume × signal strength × Founder Score / YES outcomes.
 */
export function channelIntelligence(input: ChannelIntelInput): ChannelIntelligence {
  const signals = input.signals ?? [];
  const founders = input.founders ?? [];
  const memos = input.memos ?? [];

  const founderById = new Map(founders.map((f) => [f.id, f]));
  const yesByFounder = new Set(
    memos.filter((m) => m.decision === 'yes').map((m) => m.founder_id),
  );

  const buckets = new Map<
    string,
    {
      count: number;
      starsSum: number;
      hnSum: number;
      founders: Set<string>;
    }
  >();

  for (const s of signals) {
    const source = normalizeSource(s.source || 'unknown');
    let b = buckets.get(source);
    if (!b) {
      b = { count: 0, starsSum: 0, hnSum: 0, founders: new Set() };
      buckets.set(source, b);
    }
    b.count += 1;
    b.starsSum += signalStars(s);
    b.hnSum += signalHn(s);
    if (s.entity_type === 'founder' || s.entity_id) {
      b.founders.add(s.entity_id);
    }
  }

  const channels: ChannelStat[] = [...buckets.entries()]
    .map(([source, b]) => {
      const avg_stars = b.count ? b.starsSum / b.count : 0;
      const avg_hn = b.count ? b.hnSum / b.count : 0;
      const gravityProxy = avg_stars + avg_hn;

      let scoreSum = 0;
      let scoreN = 0;
      let yes_decisions = 0;
      for (const fid of b.founders) {
        const f = founderById.get(fid);
        if (f) {
          scoreSum += f.founder_score;
          scoreN += 1;
        }
        if (yesByFounder.has(fid)) yes_decisions += 1;
      }
      const avg_founder_score = scoreN ? scoreSum / scoreN : 0;
      // Quality multiplier: high-score founders + YES outcomes beat empty volume.
      const quality =
        1 +
        avg_founder_score / 100 +
        (yes_decisions > 0 ? 0.35 * Math.min(3, yes_decisions) : 0);
      const rank_score = b.count * (1 + Math.log1p(gravityProxy)) * quality;

      return {
        source,
        count: b.count,
        avg_stars: Math.round(avg_stars * 10) / 10,
        avg_hn: Math.round(avg_hn * 10) / 10,
        founders_touched: b.founders.size,
        avg_founder_score: Math.round(avg_founder_score * 10) / 10,
        yes_decisions,
        rank_score: Math.round(rank_score * 100) / 100,
      };
    })
    .sort((a, b) => b.rank_score - a.rank_score || b.count - a.count);

  const present = new Set(channels.map((c) => c.source));
  const medianCount =
    channels.length === 0
      ? 0
      : [...channels].sort((a, b) => a.count - b.count)[
          Math.floor(channels.length / 2)
        ]!.count;

  const underexplored = KNOWN_SOURCING_CHANNELS.filter((ch) => {
    if (!present.has(ch)) return true;
    const row = channels.find((c) => c.source === ch);
    return (row?.count ?? 0) < Math.max(1, Math.floor(medianCount * 0.35));
  }).slice(0, 5);

  const researchGap = underexplored.filter(
    (ch) => ch === 'arxiv' || ch === 'accelerator' || ch === 'hackathon',
  );

  const topQuality = [...channels]
    .filter((c) => c.founders_touched > 0)
    .sort((a, b) => b.avg_founder_score - a.avg_founder_score)[0];

  let tip =
    underexplored.length === 0
      ? 'Sourcing mix looks balanced across known channels.'
      : `Underexplored: prioritize ${underexplored.slice(0, 3).join(', ')} to widen cold-start coverage.`;

  if (topQuality && topQuality.avg_founder_score >= 50) {
    tip += ` Quality signal: ${topQuality.source} founders average score ${topQuality.avg_founder_score.toFixed(0)}${topQuality.yes_decisions ? ` · ${topQuality.yes_decisions} YES` : ''}.`;
  }

  if (researchGap.length > 0) {
    tip += ` Research/outbound gap: run ingest for ${researchGap.join(' + ')} (arXiv · accelerators · hackathons).`;
  } else if (
    !present.has('arxiv') ||
    !present.has('accelerator') ||
    !present.has('hackathon')
  ) {
    tip +=
      ' Tip: POST /api/ingest pulls live GitHub / HN / arXiv only.';
  }

  return { channels, underexplored, tip };
}
