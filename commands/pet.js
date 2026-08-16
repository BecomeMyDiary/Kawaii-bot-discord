const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { addPoints, setNextPetTime, getSettings, db } = require('../database.js');

function getRandomPoints(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatRemaining(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours} ชั่วโมง ${minutes} นาที ${seconds} วินาที`;
    if (minutes > 0) return `${minutes} นาที ${seconds} วินาที`;
    return `${seconds} วินาที`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pet')
        .setDescription('ลูบหัวน้อง')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('คนที่ต้องการลูบหัว')
                .setRequired(false)),
    async execute(interaction) {
        const now = Date.now();

        // ดึงการตั้งค่า cooldown ของเซิร์ฟเวอร์
        const settings = getSettings(interaction.guildId);
        const cooldownMs = (settings.pet_cooldown || 12) * 60 * 1000; // นาที → มิลลิวินาที

        // เช็ค cooldown จาก database
        const cooldownData = db.prepare('SELECT nextPet FROM user_cooldowns WHERE userId = ?').get(interaction.user.id);

        if (cooldownData && cooldownData.nextPet > now) {
            const remaining = cooldownData.nextPet - now;
            return interaction.reply({
                content: `⏳ ยังอยู่ใน Cooldown! ต้องรออีก **${formatRemaining(remaining)}** ก่อนจะ pet ได้อีกครั้ง`,
                ephemeral: true
            });
        }

        // หมด cooldown แล้ว — ให้แต้มและตั้ง cooldown ใหม่
        const points = getRandomPoints(settings.pet_min || 5, settings.pet_max || 15);
        addPoints(interaction.user.id, points);
        setNextPetTime(interaction.user.id, now + cooldownMs);

        const customId = `remind_pet_${interaction.user.id}_${Date.now()}`;

        const embed = new EmbedBuilder()
            .setColor('#ffb6c1')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTitle(`**${interaction.user.username}** petted Kawaii ~`)
            .setDescription(
                `🐾 <@${interaction.user.id}> earned **+${points}** ${process.env.CURRENCY_SYMBOL || 'แต้ม'}\n\n` +
                `*tip: click the button below to get reminded when the cooldown is over!*`
            );

        const remindButton = new ButtonBuilder()
            .setCustomId(customId)
            .setLabel('Remind me!')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(remindButton);

        const response = await interaction.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true
        });

        const filter = i => i.customId === customId && i.user.id === interaction.user.id;
        const collector = response.createMessageComponentCollector({ filter, time: cooldownMs });

        collector.on('collect', async i => {
            try {
                remindButton.setDisabled(true).setLabel('⟡ Reminder set!');
                await i.update({ components: [new ActionRowBuilder().addComponents(remindButton)] });

                await i.followUp({
                    content: '⏰ ตั้งเวลาเรียบร้อยแล้ว! ระบบจะส่ง DM ไปหาเมื่อหมดเวลา Cooldown',
                    ephemeral: true
                });

                // คำนวณเวลาที่เหลือจริงๆ จาก DB แทนการใช้ setTimeout เต็ม cooldown
                const cd = db.prepare('SELECT nextPet FROM user_cooldowns WHERE userId = ?').get(interaction.user.id);
                const delay = cd ? Math.max(0, cd.nextPet - Date.now()) : cooldownMs;

                setTimeout(async () => {
                    const reminderEmbed = new EmbedBuilder()
                        .setColor('#ffb6c1')
                        .setTitle('🔔 Cooldown is Over!')
                        .setDescription('หมดเวลาคูลดาวน์ของคำสั่ง `/pet` แล้วนะ! กลับมากอดน้องได้แล้ว~ 🐾')
                        .setTimestamp();
                    try {
                        await interaction.user.send({ embeds: [reminderEmbed] });
                    } catch (err) {
                        const reminderPublicEmbed = new EmbedBuilder()
                            .setColor('#ffb6c1')
                            .setTitle('🔔 Hey it\'s time to pet again!')
                            .setDescription(`หมดเวลาคูลดาวน์ของคำสั่ง \`/pet\` แล้วนะ! <@${interaction.user.id}> กลับมากอดน้องได้แล้ว~ 🐾`)
                            .setTimestamp();
                        await interaction.channel.send({ embeds: [reminderPublicEmbed] });
                    }
                }, delay);

            } catch (err) {
                console.error('Error collecting button interaction:', err);
                await i.followUp({ content: 'เกิดข้อผิดพลาดในการตั้งเตือน', ephemeral: true });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (collected.size === 0) {
                remindButton.setDisabled(true).setLabel('Cooldown ended');
                await interaction.editReply({ components: [new ActionRowBuilder().addComponents(remindButton)] }).catch(() => { });
            }
        });
    },
};