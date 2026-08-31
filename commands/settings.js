const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getSettings } = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('ตั้งค่าระบบต่างๆภายในเซิฟเวอร์'),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageGuild')) {
            return interaction.reply({ content: '❌ คุณต้องมีสิทธิ์ Manage Guild จึงจะสามารถใช้งานคำสั่งนี้ได้', ephemeral: true });
        }

        const settings = getSettings(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
            .setTitle('✨ Bot Settings Panel !')
            .setDescription('เลือกหัวข้อที่ต้องการตั้งค่าจากเมนูด้านล่างนี้ได้เลยครับ')
            .addFields(
                {
                    name: '� Currency',
                    value: `• symbol: **${settings.currency_symbol || '🍩'}**`,
                    inline: true
                },
                {
                    name: '�🐾 `/pet` command',
                    value: `• amount given: between 🍩 **${settings.pet_min}** to **${settings.pet_max}**\n• cooldown: **${settings.pet_cooldown}** minutes`,
                    inline: true
                },
                {
                    name: '🤗 `/snuggle` command',
                    value: `• amount given: between 🍩 **${settings.snuggle_min}** to **${settings.snuggle_max}**\n• cooldown: **${settings.snuggle_cooldown}** minutes`,
                    inline: true
                },
                {
                    name: '✋ `/pick` command',
                    value: `• amount given: between 🍩 **${settings.pick_min}** to **${settings.pick_max}**\n• cooldown: **${settings.pick_cooldown}** minutes`,
                    inline: true
                }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('settings_select_menu')
                    .setPlaceholder('choose a specific setting to edit . . . ✧')
                    .addOptions([
                        {
                            label: 'ตั้งค่า Currency',
                            description: 'เปลี่ยนสัญลักษณ์เงินที่ใช้แสดงในเซิร์ฟเวอร์นี้',
                            value: 'edit_currency',
                            emoji: '💰'
                        },
                        {
                            label: 'ตั้งค่า /pet',
                            description: 'เปลี่ยนช่วงคะแนนและเวลาคูลดาวน์ของคำสั่ง pet',
                            value: 'edit_pet',
                            emoji: '🐾'
                        },
                        {
                            label: 'ตั้งค่า /snuggle',
                            description: 'เปลี่ยนช่วงคะแนนและเวลาคูลดาวน์ของคำสั่ง snuggle',
                            value: 'edit_snuggle',
                            emoji: '🤗'
                        },
                        {
                            label: 'ตั้งค่า /pick',
                            description: 'เปลี่ยนช่วงคะแนนและเวลาคูลดาวน์ของคำสั่ง pick',
                            value: 'edit_pick',
                            emoji: '✋'
                        }
                    ])
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
