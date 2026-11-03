// Ghi sự kiện subagent (start/stop) kèm timestamp vào _workspace/logs/events.jsonl
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

let raw = '';
process.stdin.on('data', (d) => (raw += d)).on('end', () => {
  try {
    const e = JSON.parse(raw);
    const dir = join(process.env.CLAUDE_PROJECT_DIR || e.cwd || '.', '_workspace', 'logs');
    mkdirSync(dir, { recursive: true });
    const row = {
      ts: new Date().toISOString(),
      event: e.hook_event_name,
      agent_id: e.agent_id,
      agent_type: e.agent_type,
      session_id: e.session_id,
    };
    appendFileSync(join(dir, 'events.jsonl'), JSON.stringify(row) + '\n');
  } catch {
    // hook chỉ quan sát, không được làm hỏng phiên chính
  }
});
