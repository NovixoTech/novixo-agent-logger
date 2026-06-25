# novixo-agent-logger

> A lightweight, human-readable audit trail for AI agent actions.

## The problem

AI agents increasingly take actions on a user's or developer's behalf, calling tools, APIs, AI providers, without much visibility into what actually happened. `novixo-agent-logger` gives you a clear, timestamped trail of every action: what was called, with what input, what came back, and whether it succeeded.

## Install

```bash
npm install novixo-agent-logger
```

## Quick start

```js
const { AgentLogger } = require("novixo-agent-logger");

const logger = new AgentLogger();

const sendEmail = logger.wrap(async (to, subject) => {
  return { sent: true };
}, "send_email");

await sendEmail("user@example.com", "Welcome!");

console.log(logger.getLogs());
```

## Use with Novixo Engine

```js
const { AgentLogger } = require("novixo-agent-logger");
const { AIRequestManager } = require("novixo-engine");

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

## Works great with novixo-engine

novixo-agent-logger integrates directly with novixo-engine's Phase 8 AI Request Manager, giving you automatic visibility into every AI provider call, rate-limit event, and failover with zero extra code.

[View novixo-engine on npm](https://www.npmjs.com/package/novixo-engine)

## License

MIT © [NovixoTech](https://github.com/NovixoTech) 
