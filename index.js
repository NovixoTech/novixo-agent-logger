/**
 * novixo-agent-logger
 * -------------------------------------------
 * A lightweight, human-readable audit trail for AI agent actions.
 *
 * Problem this solves: AI agents take actions on a user's or developer's
 * behalf (calling tools, APIs, AI providers). Once they're given autonomy,
 * almost nothing tells you exactly what they did, with what input, what
 * came back, and whether it succeeded. AgentLogger gives you that trail
 * with almost no setup.
 */

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

class AgentLogger {
  /**
   * @param {object} [options]
   * @param {number} [options.maxEntries] - caps memory use; oldest entries drop off (default 1000)
   */
  constructor(options = {}) {
    this.maxEntries = options.maxEntries ?? 1000;
    this._logs = [];
    this._listeners = {};
  }

  on(event, fn) {
    (this._listeners[event] ||= []).push(fn);
    return this;
  }

  _emit(event, payload) {
    (this._listeners[event] || []).forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[AgentLogger] listener error on "${event}":`, err);
      }
    });
  }

  /**
   * Manually record a log entry.
   * @param {object} entry
   * @param {string} entry.action - name of the action/tool (e.g. "send_email", "ai:groq")
   * @param {*} [entry.input]
   * @param {*} [entry.output]
   * @param {"success"|"error"|"rate_limited"|"queued"} [entry.status]
   * @param {number} [entry.durationMs]
   * @param {object} [entry.meta] - free-form extra context (provider, userId, etc.)
   */
  log(entry) {
    const record = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      status: "success",
      ...entry,
    };
    this._logs.push(record);
    if (this._logs.length > this.maxEntries) {
      this._logs.shift();
    }
    this._emit("logged", record);
    return record;
  }

  /**
   * Wrap any async function so every call is automatically logged
   * with timing, input, output, and success/error status.
   * @param {Function} fn - the function to wrap (sync or async)
   * @param {string} actionName - human-readable name for this action
   * @param {object} [meta] - extra context attached to every call
   */
  wrap(fn, actionName, meta = {}) {
    return async (...args) => {
      const start = Date.now();
      try {
        const result = await fn(...args);
        this.log({
          action: actionName,
          input: args.length === 1 ? args[0] : args,
          output: result,
          status: "success",
          durationMs: Date.now() - start,
          meta,
        });
        return result;
      } catch (err) {
        this.log({
          action: actionName,
          input: args.length === 1 ? args[0] : args,
          output: { error: err.message },
          status: "error",
          durationMs: Date.now() - start,
          meta,
        });
        throw err;
      }
    };
  }

  /**
   * Convenience integration: attach to a Novixo Engine AIRequestManager
   * (Phase 8) instance and auto-log its events without any extra wiring.
   * @param {object} aiManager - instance with an `.on(event, fn)` method
   */
  attachToNovixoAI(aiManager) {
    aiManager.on("onSuccess", ({ provider }) =>
      this.log({ action: `ai:${provider}`, status: "success", meta: { provider } })
    );
    aiManager.on("onRateLimit", ({ provider }) =>
      this.log({ action: `ai:${provider}`, status: "rate_limited", meta: { provider } })
    );
    aiManager.on("onProviderFailover", ({ from, to, reason }) =>
      this.log({
        action: `ai:failover`,
        status: "error",
        meta: { from, to, reason },
      })
    );
    aiManager.on("onQueued", ({ prompt, model, provider }) =>
      this.log({ action: `ai:${provider || "unspecified"}`, status: "queued", meta: { model } })
    );
    return this;
  }

  /** Get logs, optionally filtered. */
  getLogs({ action, status, since } = {}) {
    return this._logs.filter((entry) => {
      if (action && entry.action !== action) return false;
      if (status && entry.status !== status) return false;
      if (since && new Date(entry.timestamp) < new Date(since)) return false;
      return true;
    });
  }

  /** Export all logs as a JSON string (e.g. to save to a file or send to a server). */
  exportJSON() {
    return JSON.stringify(this._logs, null, 2);
  }

  clear() {
    this._logs = [];
  }
}

module.exports = { AgentLogger };
