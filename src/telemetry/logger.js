function serialize(level, message, context = {}) {
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...context
  });
}

export const logger = {
  info(message, context) {
    console.log(serialize("info", message, context));
  },
  warn(message, context) {
    console.warn(serialize("warn", message, context));
  },
  error(message, context) {
    console.error(serialize("error", message, context));
  }
};
