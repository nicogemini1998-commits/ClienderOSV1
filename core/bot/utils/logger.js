const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function timestamp() {
  return new Date().toISOString().slice(11, 23);
}

export const logger = {
  info(msg, meta = {}) {
    console.log(`${colors.blue}[${timestamp()}] INFO${colors.reset} ${msg}`, Object.keys(meta).length ? meta : '');
  },
  success(msg, meta = {}) {
    console.log(`${colors.green}[${timestamp()}] OK  ${colors.reset} ${msg}`, Object.keys(meta).length ? meta : '');
  },
  warn(msg, meta = {}) {
    console.warn(`${colors.yellow}[${timestamp()}] WARN${colors.reset} ${msg}`, Object.keys(meta).length ? meta : '');
  },
  error(msg, meta = {}) {
    console.error(`${colors.red}[${timestamp()}] ERR ${colors.reset} ${msg}`, Object.keys(meta).length ? meta : '');
  },
};

export default logger;
