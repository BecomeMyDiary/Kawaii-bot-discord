const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed-post')
        .setDescription('สร้าง Embed พร้อมอัปโหลดรูปภาพจากเครื่อง')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('ใส่หัวข้อตรงนี้...')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('ใส่เนื้อหาตรงนี้...')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('ลากรูปภาพมาวาง หรือคลิกเพื่อแนบไฟล์')
                .setRequired(true)),
    
    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const imageAttachment = interaction.options.getAttachment('image');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(0x2ecc71) // สีเขียว
            .setFooter({
                text: `สร้างโดย ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        if (imageAttachment) {
            embed.setImage(imageAttachment.url);
        }

        await interaction.reply({ embeds: [embed] });
    },
};
