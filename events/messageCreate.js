const { Events, EmbedBuilder } = require('discord.js');
const { createBalanceEmbed } = require('../commands/balance.js');
const { addPoints, setNextPickTime, db } = require('../database.js');

function getRandomPoints(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        // --- ตั้งค่าไอดีห้องที่อนุญาตให้ระบบ pick ทำงานได้ (สามารถเพิ่มไอดีห้องลงใน array นี้ได้เลย) ---
        const ALLOWED_PICK_CHANNELS = [
            '1532425580749000804', // แทนที่ด้วย ID ห้องของคุณ
        ];

        // ระบบ pick อัตโนมัติเมื่อพิมแชท (เฉพาะในห้องที่อนุญาต)
        if (ALLOWED_PICK_CHANNELS.includes(message.channel.id)) {
            const userData = db.prepare('SELECT nextPick FROM user_cooldowns WHERE userId = ?').get(message.author.id);
            const now = Date.now();

            if (!userData || userData.nextPick <= now) {
                const points = getRandomPoints(10, 30);

                const nextTime = now + (5 * 60 * 1000);
                setNextPickTime(message.author.id, nextTime);

                if (!message.client.activePicks) {
                    message.client.activePicks = new Map();
                }

                message.client.activePicks.set(message.author.id, {
                    points: points,
                    expireAt: now + (120 * 1000) // ให้เวลา 120 วินาทีในการพิมพ์ /pick
                });

                const pickCmdId = message.client.commandIds?.pick;
                const pickMention = pickCmdId ? `</pick:${pickCmdId}>` : '`/pick`';

                const sentMsg = await message.channel.send(`🎁 <@${message.author.id}>, มี pick ดรอป! กด ${pickMention} ภายใน 2 นาทีเพื่อรับ **${points}** ${process.env.CURRENCY_SYMBOL || 'แต้ม'}!`);
                setTimeout(() => {
                    sentMsg.delete().catch(err => console.error('Failed to delete pick notification:', err));
                }, 120 * 1000); // ลบอัตโนมัติหลัง 2 นาที
            }
        } // จบเงื่อนไขเช็คห้องของระบบ pick

        // 1. คำสั่ง .balance / !balance
        if (message.content === '.balance' || message.content === '!balance') {
            const embed = createBalanceEmbed(message.member);
            await message.channel.send({ embeds: [embed] });
        }

        // 2. จำกัดข้อความในห้อง .petshop
        const PETSHOP_CHANNEL_ID = '1532427792724131992';
        if (message.channel.id === PETSHOP_CHANNEL_ID) {
            if (message.content !== '.petshop') {
                try {
                    await message.delete();
                } catch (err) {
                    console.error('ไม่สามารถลบข้อความได้:', err);
                }
            }
        }

        // 3. จำกัดข้อความในห้อง /shop view
        const SHOPVIEW_CHANNEL_ID = '1532428050418106368';
        if (message.channel.id === SHOPVIEW_CHANNEL_ID) {
            if (message.content !== '/shop view') {
                try {
                    await message.delete();
                } catch (err) {
                    console.error('ไม่สามารถลบข้อความได้:', err);
                }
            }
        }

        // 4. คำสั่ง .clearallvoices / !clearallvoices
        const TARGET_VOICE_TEXT_CHANNELS = [
            '1531922242546565191',
            '1534991096059269291',
            '1534992676582199456',
            '1528696612006793287'
        ];

        if (message.content === '.clearallvoices' || message.content === '!clearallvoices') {
            if (!message.member.permissions.has('ManageMessages')) {
                return message.reply({ content: 'คุณไม่มีสิทธิ์ใช้งานคำสั่งนี้ (ต้องการสิทธิ์ Manage Messages)', ephemeral: true });
            }

            const statusMessage = await message.reply('กำลังทยอยลบข้อความในห้องเสียงทั้งหมด...');
            let successCount = 0;

            for (const channelId of TARGET_VOICE_TEXT_CHANNELS) {
                try {
                    const channel = await message.client.channels.fetch(channelId);

                    if (channel && channel.isTextBased()) {
                        const fetchedMessages = await channel.messages.fetch({ limit: 100 });

                        if (fetchedMessages.size > 0) {
                            await channel.bulkDelete(fetchedMessages);
                            successCount++;
                        }
                    }
                } catch (error) {
                    console.error(`ไม่สามารถลบข้อความในห้อง ID: ${channelId} ได้:`, error);
                }
            }

            await statusMessage.edit(`เคลียร์ข้อความในห้องเสียงเรียบร้อยแล้วทั้งหมด ${successCount} ห้อง!`);
        }
    },
};
