export const logger = {
  success: (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`),
  info: (msg) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  error: (msg, err) => console.error(`\x1b[31m✗\x1b[0m ${msg}`, err || ''),
  warn: (msg) => console.warn(`\x1b[33m⚠\x1b[0m ${msg}`),
  debug: (msg) => console.log(`\x1b[90m◆\x1b[0m ${msg}`),
};
