// In bảng trạng thái + dòng thời gian từ _workspace/logs/events.jsonl (không tốn token LLM)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const file = join(process.env.CLAUDE_PROJECT_DIR || '.', '_workspace', 'logs', 'events.jsonl');
if (!existsSync(file)) {
  console.log('Chưa có phiên thực thi nào.');
  process.exit(0);
}
const rows = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const fmt = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
};
const t0 = Date.parse(rows[0].ts);
const now = Date.now();

const agents = new Map();
for (const r of rows) {
  const a = agents.get(r.agent_id) ?? { type: r.agent_type };
  a[r.event === 'SubagentStart' ? 'start' : 'stop'] = Date.parse(r.ts);
  agents.set(r.agent_id, a);
}

console.log('| agent | trạng thái | bắt đầu | thời lượng |');
console.log('| :--- | :--- | :--- | :--- |');
for (const [id, a] of agents) {
  const start = a.start ?? a.stop; // thiếu START (hiếm) thì lấy STOP
  console.log(`| ${a.type} (${id.slice(0, 6)}) | ${a.stop ? 'done' : 'running'} | +${fmt(start - t0)} | ${fmt((a.stop ?? now) - start)} |`);
}
console.log('\nDòng thời gian:');
for (const r of rows) {
  console.log(`+${fmt(Date.parse(r.ts) - t0)}  ${r.event === 'SubagentStart' ? 'START' : 'STOP '}  ${r.agent_type}`);
}
