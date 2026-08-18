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

        // ระบบ Auto-clear ห้องเสียง
        const TARGET_CHANNEL_IDS = [
            '1531922242546565191',
            '1534991096059269291',
            '1534992676582199456',
            '1528696612006793287',
        ];

        const THREE_HOUR = 3 * 60 * 60 * 1000;

        setInterval(async () => {
            for (const channelId of TARGET_CHANNEL_IDS) {
                try {
                    const channel = await client.channels.fetch(channelId);

                    if (channel && channel.isTextBased()) {
                        const fetchedMessages = await channel.messages.fetch({ limit: 100 });

                        if (fetchedMessages.size > 0) {
                            await channel.bulkDelete(fetchedMessages);
                            console.log(`[Auto-Clear] ลบข้อความในห้อง ${channel.name} สำเร็จแล้ว`);
                        }
                    }
                } catch (error) {
                    console.error(`[Auto-Clear Error] ไม่สามารถลบข้อความในห้อง ID: ${channelId} ได้:`, error);
                }
            }
        }, THREE_HOUR);
    },
};
