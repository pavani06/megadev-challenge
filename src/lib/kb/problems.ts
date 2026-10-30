// The problems inside one merged ticket, counted the desk's way. causes.ts tells parser from hint
// by tenant and channel, and files every report under one of them. The reports the desk read as a
// one-day move (desk-notes.json) are neither: no day and month swap in them, only a date one day
// off. They stay counted where the desk files them, and are also their own problem here.
import { groupByCause, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day';

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

function summary(problem: ProblemGroup['problem'], rs: Report[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const byCause = groupByCause(merged, tenantOf).map((g) => summary(g.cause, g.reports));
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  return moved.length ? [...byCause, summary('one-day', moved)] : byCause;
}
