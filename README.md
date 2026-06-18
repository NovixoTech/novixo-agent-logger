# novixo-agent-logger
> A lightweight, human-readable audit trail for AI agent actions. 
## The problem

AI agents increasingly take actions on a user's or developer's behalf, calling tools, APIs, AI providers, without much visibility into what actually happened. `agent-logger` gives you a clear, timestamped trail of every action: what was called, with what input, what came back, and whether it succeeded.

## Install

```
npm install agent-logger
```

## Quick start

```js
const { AgentLogger } = require("agent-logger");

const logger = new AgentLogger();

// Wrap any function (sync or async) to auto-log every call
const sendEmail = logger.wrap(async (to, subject) => {
  // ... actually send the email
  return { sent: true };
}, "send_email");

await sendEmail("user@example.com", "Welcome!");

console.log(logger.getLogs());
```

## Use with Novixo Engine (Phase 8 AI Request Manager)

If you're using Novixo Engine's `AIRequestManager`, attach the logger directly, no manual wiring needed:

```js
const { AgentLogger } = require("agent-logger");
const { AIRequestManager } = require("novixo-engine"); // once Phase 8 ships

const logger = new AgentLogger();
const aiManager = new AIRequestManager();

logger.attachToNovixoAI(aiManager);
// every AI call, rate-limit, and failover is now automatically logged
```

## API

| Method | Description |
| --- | --- |
| `logger.log(entry)` | Manually record a log entry |
| `logger.wrap(fn, actionName, meta?)` | Wrap a function so every call is auto-logged |
| `logger.attachToNovixoAI(aiManager)` | Auto-log events from a Novixo Engine AI Request Manager |
| `logger.getLogs({ action?, status?, since? })` | Retrieve logs with optional filters |
| `logger.exportJSON()` | Export all logs as a JSON string |
| `logger.clear()` | Clear all stored logs |
| `logger.on("logged", fn)` | Subscribe to new log entries as they happen |

## License

MIT © NovixoTech
