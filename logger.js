const fs = require('node:fs');
const path = require('node:path');
const { environment } = require('./config.js');

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, `bot-${new Date().toISOString().split('T')[0]}.log`);

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Enhanced logging with file + console output
 * @param {string} level - Log level: 'info', 'warn', 'error', 'debug'
 * @param {string} message - Log message
 * @param {object} data - Additional context (will be stringified)
 */
function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    
    // Format: [TIMESTAMP] [LEVEL] message | data
    const logEntry = `[${timestamp}] [${levelUpper}] ${message}${Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}`;
    
    // Console output
    if (level === 'error') {
        console.error(logEntry);
    } else if (level === 'warn') {
        console.warn(logEntry);
    } else {
        console.log(logEntry);
    }
    
    // File output (only in production)
    if (environment === 'production') {
        try {
            fs.appendFileSync(LOG_FILE, logEntry + '\n', 'utf8');
        } catch (err) {
            console.error(`[ERROR] Failed to write to log file: ${err.message}`);
        }
    }
}

module.exports = {
    info: (msg, data) => log('info', msg, data),
    warn: (msg, data) => log('warn', msg, data),
    error: (msg, data) => log('error', msg, data),
    debug: (msg, data) => environment === 'development' && log('debug', msg, data),
};
