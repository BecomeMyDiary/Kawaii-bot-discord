const { Events, REST, Routes } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} Ready to start!`);

        // โหลด Slash Commands
        const rest = new REST({ version: '10' }).setToken(client.token);

        // รวบรวม commands ที่โหลดมาจาก index.js ไว้ใน client.commands
        const commands = client.commands.map(cmd => cmd.data.toJSON());

        try {
            console.log('⏳ Updating Slash Commands...');
            const registeredCommands = await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );

            // เก็บ ID ของ Slash Command ไว้ใน client เพื่อให้สามารถทำปุ่มคลิก </command:id> ได้
            client.commandIds = {};
            for (const cmd of registeredCommands) {
                client.commandIds[cmd.name] = cmd.id;
            }

            console.log('✅ Update Slash Commands Success!');
        } catch (error) {
            console.error('❌ Error updating commands:', error);
        }
    },
};
