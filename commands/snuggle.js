const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags
} = require('discord.js');
const { addPoints, setNextSnuggleTime, getSettings, db } = require('../database.js');

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
        .setName('snuggle')
        .setDescription('กอดน้อง'),
    async execute(interaction) {
        const now = Date.now();

        // ดึงการตั้งค่า cooldown ของเซิร์ฟเวอร์
        const settings = getSettings(interaction.guildId);
        const cooldownMs = (settings.snuggle_cooldown || 60) * 60 * 1000; // นาที → มิลลิวินาที

        // เช็ค cooldown จาก database
        const cooldownData = db.prepare('SELECT nextSnuggle FROM user_cooldowns WHERE userId = ?').get(interaction.user.id);

        if (cooldownData && cooldownData.nextSnuggle > now) {
            const remaining = cooldownData.nextSnuggle - now;
            return interaction.reply({
                content: `⏳ ยังอยู่ใน Cooldown! ต้องรออีก **${formatRemaining(remaining)}** ก่อนจะ snuggle ได้อีกครั้ง`,
                flags: MessageFlags.Ephemeral
            });
        }

        // หมด cooldown แล้ว — ให้แต้มและตั้ง cooldown ใหม่
        const points = getRandomPoints(settings.snuggle_min || 30, settings.snuggle_max || 60);
        addPoints(interaction.user.id, points);
        setNextSnuggleTime(interaction.user.id, now + cooldownMs);

        const customId = `remind_snuggle_${interaction.user.id}_${Date.now()}`;

        const embed = new EmbedBuilder()
            .setColor('#ffb6c1')
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTitle(`Snuggle timeeeeeeeee ~ ~ ^ ^ !!!`)
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
            withResponse: true
        });

        const message = response.resource.message;
        const filter = i => i.customId === customId && i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ filter, time: cooldownMs });

        collector.on('collect', async i => {
            try {
                remindButton.setDisabled(true).setLabel('⟡ Reminder set!');
                await i.update({ components: [new ActionRowBuilder().addComponents(remindButton)] });

                await i.followUp({
                    content: '⏰ ตั้งเวลาเรียบร้อยแล้ว! ระบบจะส่ง DM ไปหาเมื่อหมดเวลา Cooldown',
                    flags: MessageFlags.Ephemeral
                });

                // คำนวณเวลาที่เหลือจริงๆ จาก DB
                const cd = db.prepare('SELECT nextSnuggle FROM user_cooldowns WHERE userId = ?').get(interaction.user.id);
                const delay = cd ? Math.max(0, cd.nextSnuggle - Date.now()) : cooldownMs;

                setTimeout(async () => {
                    const reminderEmbed = new EmbedBuilder()
                        .setColor('#ffb6c1')
                        .setTitle('🔔 Cooldown is Over!')
                        .setDescription('หมดเวลาคูลดาวน์ของคำสั่ง `/snuggle` แล้วนะ! กลับมากอดน้องได้แล้ว~ 🐾')
                        .setTimestamp();
                    try {
                        await interaction.user.send({ embeds: [reminderEmbed] });
                    } catch (err) {
                        const reminderPublicEmbed = new EmbedBuilder()
                            .setColor('#ffb6c1')
                            .setTitle('🔔 Hey it\'s time to snuggle again!')
                            .setDescription(`หมดเวลาคูลดาวน์ของคำสั่ง \`/snuggle\` แล้วนะ! <@${interaction.user.id}> กลับมากอดน้องได้แล้ว~ 🐾`)
                            .setTimestamp();
                        await interaction.channel.send({ embeds: [reminderPublicEmbed] });
                    }
                }, delay);

            } catch (err) {
                console.error('Error collecting button interaction:', err);
                await i.followUp({ content: 'เกิดข้อผิดพลาดในการตั้งเตือน', flags: MessageFlags.Ephemeral });
            }
        });

        collector.on('end', async (collected, reason) => {
            if (collected.size === 0) {
                remindButton.setDisabled(true).setLabel('Cooldown ended');
                await message.edit({ components: [new ActionRowBuilder().addComponents(remindButton)] }).catch(() => { });
            }
        });
    },
};