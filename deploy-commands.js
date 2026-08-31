const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const { discordToken, clientId, guildId } = require('./config.js');

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST().setToken(discordToken);

(async () => {
    try {
        if (!discordToken || !clientId) {
            throw new Error('DISCORD_TOKEN หรือ CLIENT_ID ไม่มีค่าใน .env');
        }

        if (!guildId) {
            console.warn('[WARN] GUILD_ID ว่าง — จะลงทะเบียนเป็น global commands แทน guild-scoped commands');
        }

        console.log('กำลังรีเฟรช Application (/) commands...');

        const route = guildId
            ? Routes.applicationGuildCommands(clientId, guildId)
            : Routes.applicationCommands(clientId);

        await rest.put(route, { body: commands });

        console.log(`ลงทะเบียน Slash Commands สำเร็จแล้ว! (${commands.length} commands)`);
    } catch (error) {
        console.error('[DEPLOY ERROR]', error.message || error);
    }
})();