const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('คู่มือและวิธีการเล่นระบบเงินในเซิร์ฟเวอร์'),

    async execute(interaction) {
        // Embed หน้าแรก (Overview)
        const embed = new EmbedBuilder()
            .setColor('#ffb6c1')
            .setAuthor({
                name: '📖 คู่มือและวิธีเล่นระบบเงินในเซิร์ฟเวอร์',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription('เลือกหัวข้อที่คุณต้องการอ่านจาก Dropdown ด้านล่างนี้ได้เลยครับ ✨')
            .addFields(
                { name: '🔍 การหาเงิน', value: 'วิธีรับเงินฟรี, คำสั่งมินิเกม และ Cooldown', inline: true },
                { name: '🏧 ระบบธนาคาร', value: 'การฝาก-ถอนเงิน และโอนเงินให้เพื่อน', inline: true },
                { name: '🏪 ร้านค้า & สัตว์เลี้ยง', value: 'การซื้อ Role และสัตว์เลี้ยงสุดน่ารัก', inline: true }
            )
            .setFooter({ text: 'เลือกหัวข้อด้านล่างเพื่อดูรายละเอียดเพิ่มเติม' });

        // สร้าง Dropdown Menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_guide_menu')
            .setPlaceholder('choose a guide to read . . . ✧')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('การหาเงิน (How to earn)')
                    .setDescription('ดูวิธีหาเงินและคำสั่งสายฟรี')
                    .setValue('guide_earning')
                    .setEmoji('🔍'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('ร้านค้า Role & สัตว์เลี้ยง')
                    .setDescription('ดูรายละเอียดการซื้อยศและสัตว์เลี้ยง')
                    .setValue('guide_shop')
                    .setEmoji('🏪'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('เกมเดิมพัน (Gambling)')
                    .setDescription('คำสั่ง Coinflip และเกมเสี่ยงโชค')
                    .setValue('guide_gambling')
                    .setEmoji('🎲')
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        return interaction.reply({ embeds: [embed], components: [row] });
    }
};