const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db, addPoints, getGuildCurrencySymbol } = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pick')
        .setDescription('รับของรางวัลจาก pick ที่ดรอป'),
    async execute(interaction) {
        if (!interaction.client.activePicks) {
            interaction.client.activePicks = new Map();
        }

        const activePick = interaction.client.activePicks.get(interaction.user.id);
        const now = Date.now();

        if (activePick) {
            if (now <= activePick.expireAt) {
                // เก็บแต้มสำเร็จ
                addPoints(interaction.user.id, activePick.points);
                interaction.client.activePicks.delete(interaction.user.id);

                const currency = getGuildCurrencySymbol(interaction.guildId);
                const embed = new EmbedBuilder()
                    .setColor('#ffb6c1')
                    .setDescription(`🎁 **${interaction.user.displayName}** ทำการ pick สำเร็จ! ได้รับโบนัสคะแนนพิเศษ **+${activePick.points}** ${currency}!`);
                await interaction.reply({ embeds: [embed] });
                setTimeout(async () => {
                    await interaction.deleteReply().catch(err => console.error('Failed to delete message:', err));
                }, 5000);
                return;
            } else {
                // หมดเวลา
                interaction.client.activePicks.delete(interaction.user.id);
                return interaction.reply({ content: `⌛ pick ของคุณหมดเวลาไปแล้ว! พิมพ์ข้อความในแชทเพื่อลุ้น pick drop ใหม่`, ephemeral: true });
            }
        }

        const userData = db.prepare('SELECT nextPick FROM user_cooldowns WHERE userId = ?').get(interaction.user.id);

        if (userData && userData.nextPick > now) {
            const remaining = userData.nextPick - now;
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            return interaction.reply({ content: `⏳ ยังอยู่ใน Cooldown! ต้องรออีก **${minutes} นาที ${seconds} วินาที** ถึงจะมีโอกาสได้ pick drop ใหม่เมื่อพิมพ์ข้อความ`, ephemeral: true });
        }

        return interaction.reply({ content: `🎯 ยังไม่มี pick ดรอปสำหรับคุณตอนนี้! ลองพิมพ์ข้อความในแชทเพื่อลุ้น pick drop!`, ephemeral: true });
    },
};
