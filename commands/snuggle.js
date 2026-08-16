const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { addPoints } = require('../database.js');

function getRandomPoints(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const COOLDOWN_TIME = 60 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snuggle')
        .setDescription('กอดน้อง'),
    async execute(interaction) {
        const points = getRandomPoints(30, 60);
        addPoints(interaction.user.id, points);

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

        const customId = `remind_me_${interaction.user.id}_${Date.now()}`;

        const remindButton = new ButtonBuilder()
            .setCustomId(customId)
            .setLabel('Remind me!')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(remindButton);

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });

        // --- เพิ่ม Collector หลังจากส่งข้อความตอบกลับ ---

        const filter = i => i.customId === customId;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: COOLDOWN_TIME });

        collector.on('collect', async i => {
            try {
                // ปิดการใช้งานปุ่มทันทีหลังถูกกด
                remindButton.setDisabled(true).setLabel('⟡ Reminder set!');
                await i.update({ components: [new ActionRowBuilder().addComponents(remindButton)] });

                // แจ้งเตือนผู้ใช้ว่าตั้งเวลาแล้ว (ส่งแบบลับๆ ไม่ให้คนอื่นเห็น)
                await i.followUp({
                    content: '⏰ ตั้งเวลาเรียบร้อยแล้ว! ระบบจะส่ง DM ไปหาเมื่อหมดเวลา Cooldown',
                    ephemeral: true // เพื่อให้เห็นแค่เจ้าของคำสั่ง
                });

                // หน่วงเวลาตามเวลา Cooldown แล้วส่งข้อความเตือน
                setTimeout(async () => {
                    const reminderEmbed = new EmbedBuilder()
                        .setColor('#ffb6c1')
                        .setTitle('🔔 Cooldown is Over!')
                        .setDescription('หมดเวลาคูลดาวน์ของคำสั่ง `/snuggle` แล้วนะ! กลับมากอดน้องได้แล้ว~ 🐾')
                        .setTimestamp();
                    try {
                        // พยายามส่ง DM
                        await interaction.user.send({ embeds: [reminderEmbed] });
                    } catch (err) {
                        // ถ้าผู้ใช้ปิด DM หรือมีปัญหา ให้ส่งเตือนในแชทสาธารณะแทน
                        const reminderPublicEmbed = new EmbedBuilder()
                            .setColor('#ffb6c1')
                            .setTitle('🔔 Hey it\'s time to snuggle again!')
                            .setDescription(`หมดเวลาคูลดาวน์ของคำสั่ง \`/snuggle\` แล้วนะ! <@${interaction.user.id}> กลับมากอดน้องได้แล้ว~ 🐾`)
                            .setTimestamp();
                        await interaction.channel.send({ embeds: [reminderPublicEmbed] });
                    }
                }, COOLDOWN_TIME);

            } catch (err) {
                console.error('Error collecting button interaction:', err);
                await i.followUp({ content: 'เกิดข้อผิดพลาดในการตั้งเตือน', ephemeral: true });
            }
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                // ถ้าครบเวลาแล้วไม่มีใครกดปุ่มเลย ให้ปิดการใช้งานปุ่มทิ้งไป
                remindButton.setDisabled(true).setLabel('Cooldown ended (No one used this reminder)');
                await interaction.editReply({ components: [new ActionRowBuilder().addComponents(remindButton)] });
            }
        });


    },
};
