// In bảng agent (phân cấp, thanh thời gian, việc đang làm), tương tác spawn và dòng thời gian từ events.jsonl.
// Cờ: --color tô màu theo vai trò; --watch làm mới mỗi giây (chạy ở terminal riêng). Không tốn token LLM.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const watch = process.argv.includes('--watch');
const color = watch || process.argv.includes('--color');
const file = join(process.env.CLAUDE_PROJECT_DIR || '.', '_workspace', 'logs', 'events.jsonl');

// [mã màu 256 (khớp color: trong .claude/agents), độ sâu phân cấp, hạng]
const ROLE = {
  main: [250, 0, 'ORCHESTRATOR'],
  'opus-architect': [141, 1, 'ARCHITECT'],
  'haiku-router': [33, 1, 'ROUTER'],
  'haiku-monitor': [51, 1, 'ROUTER'],
  'sonnet-executor': [208, 2, 'EXECUTOR'],
};
const paint = (t, type) => (color ? `\x1b[38;5;${(ROLE[type] ?? ROLE.main)[0]}m${t}\x1b[0m` : t);
const fmt = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
};
const W = 30;

function render() {
  if (!existsSync(file)) return 'Chưa có phiên thực thi nào.';
  const rows = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  if (!rows.length) return 'Chưa có phiên thực thi nào.';
  const t0 = Date.parse(rows[0].ts);
  const now = Date.now();

  const agents = new Map();
  const spawns = [];
  for (const r of rows) {
    if (r.event === 'PreToolUse') {
      if (r.tool === 'Agent') spawns.push(r);
      const a = agents.get(r.agent_id);
      if (a) a.last = r; // việc gần nhất của agent
      continue;
    }
    const a = agents.get(r.agent_id) ?? { type: r.agent_type };
    a[r.event === 'SubagentStart' ? 'start' : 'stop'] = Date.parse(r.ts);
    agents.set(r.agent_id, a);
  }

  const running = [...agents.values()].some((a) => !a.stop);
  const end = running ? now : Math.max(...[...agents.values()].map((a) => a.stop ?? t0));
  const span = Math.max(1000, end - t0);

  const out = [];
  out.push(Object.keys(ROLE).map((t) => paint(`${t} [${ROLE[t][2]}]`, t)).join('  '));
  out.push('');
  for (const [id, a] of agents) {
    const start = a.start ?? a.stop; // thiếu START (hiếm) thì lấy STOP
    const stop = a.stop ?? now;
    const s = Math.min(W - 1, Math.floor(((start - t0) / span) * W));
    const len = Math.min(W - s, Math.max(1, Math.round(((stop - start) / span) * W)));
    const depth = (ROLE[a.type] ?? ROLE.main)[1];
    const label = `${'  '.repeat(Math.max(0, depth - 1))}${a.type} (${id.slice(0, 6)})`.padEnd(34);
    const state = a.stop ? 'done   ' : 'running';
    const doing = a.stop || !a.last ? '' : `${a.last.tool} ${a.last.target ?? ''}`.trim();
    out.push(`${paint(label, a.type)} ${state} +${fmt(start - t0).padEnd(6)} ${fmt(stop - start).padEnd(6)} |${paint(('·'.repeat(s) + '█'.repeat(len)).padEnd(W), a.type)}| ${doing}`);
  }
  if (spawns.length) {
    out.push('', 'Tương tác (ai gọi ai):');
    for (const r of spawns) {
      const from = r.agent_type ?? 'main';
      out.push(`+${fmt(Date.parse(r.ts) - t0).padEnd(6)} ${paint(from, from)} → ${paint(r.target, r.target)}`);
    }
  }
  out.push('', 'Dòng thời gian:');
  for (const r of rows.filter((x) => x.event !== 'PreToolUse')) {
    out.push(`+${fmt(Date.parse(r.ts) - t0).padEnd(6)} ${r.event === 'SubagentStart' ? 'START' : 'STOP '}  ${paint(r.agent_type, r.agent_type)}`);
  }
  return out.join('\n');
}

if (watch) {
  const tick = () => process.stdout.write('\x1b[2J\x1b[H' + render() + '\n');
  tick();
  setInterval(tick, 1000);
} else {
  console.log(render());
}
