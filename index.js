const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { discordToken } = require('./config.js');
const logger = require('./logger.js');

// โหลด token จาก .env / config
const TOKEN = discordToken;

// 1. ตั้งค่า Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// 2. โหลด Commands ทั้งหมดจากโฟลเดอร์ commands/
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // ตั้งค่า command ใน Collection ด้วยชื่อ command (name)
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// 3. โหลด Events ทั้งหมดจากโฟลเดอร์ events/
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// 4. เข้าสู่ระบบ (Login)
client.login(TOKEN);

// 5. Global Error Handlers
process.on('unhandledRejection', (err) => {
    console.error('[FATAL] Unhandled Rejection:', err);
    logger.error('Unhandled Rejection', { error: err.message, stack: err.stack });
});

process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    gracefulShutdown('Uncaught exception detected');
});

client.on('error', (err) => {
    console.error('[BOT ERROR]', err);
    logger.error('Bot error', { error: err.message });
});

// 6. Graceful Shutdown Handler
function gracefulShutdown(reason = 'SIGTERM') {
    console.log(`\n[SHUTDOWN] Reason: ${reason}`);
    logger.info('Bot shutting down', { reason });
    
    // Close Discord connection
    if (client.isReady()) {
        client.destroy();
    }
    
    // Close database
    try {
        const { closeDatabase } = require('./database.js');
        closeDatabase();
    } catch (err) {
        console.error('[ERROR] Failed to close database:', err.message);
    }
    
    logger.info('Graceful shutdown complete');
    process.exit(0);
}

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));