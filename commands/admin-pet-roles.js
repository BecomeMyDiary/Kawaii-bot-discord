const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const { getPetRoles, addPetRole, removePetRole, db } = require('../database.js');
const logger = require('../logger.js');

function createPetRolePages(guildId, pageSize = 5) {
    const roles = getPetRoles(guildId);
    const totalPages = Math.max(1, Math.ceil(roles.length / pageSize));

    if (roles.length === 0) {
        return [
            new EmbedBuilder()
                .setColor('#ffb6c1')
                .setTitle('🐾 Pet Roles Management')
                .setDescription('จัดการ roles ของระบบ pet ในเซิร์ฟเวอร์นี้')
                .addFields({ name: 'Current Pet Roles', value: 'ยังไม่มี pet roles สร้างขึ้นมา' })
        ];
    }

    const pages = [];
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        const slice = roles.slice(start, end);

        const embed = new EmbedBuilder()
            .setColor('#ffb6c1')
            .setTitle('🐾 Pet Roles Management')
            .setDescription('จัดการ roles ของระบบ pet ในเซิร์ฟเวอร์นี้')
            .addFields({
                name: `Current Pet Roles (${pageIndex + 1}/${totalPages})`,
                value: slice
                    .map(r => `${r.petEmoji} **${r.petName}** - <@&${r.roleId}>`)
                    .join('\n')
            });

        pages.push(embed);
    }

    return pages;
}

function createPetRolePageButtons(guildId, pageIndex, totalPages) {
    const row = new ActionRowBuilder();

    const prevButton = new ButtonBuilder()
        .setCustomId(`pet_roles_page_${guildId}_${pageIndex - 1}`)
        .setLabel('◀ ก่อนหน้า')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageIndex === 0);

    const nextButton = new ButtonBuilder()
        .setCustomId(`pet_roles_page_${guildId}_${pageIndex + 1}`)
        .setLabel('ถัดไป ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageIndex >= totalPages - 1);

    row.addComponents(prevButton, nextButton);
    return row;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-pet-roles')
        .setDescription('จัดการ pet roles (admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    createPetRolePages,
    createPetRolePageButtons,
    async execute(interaction) {
        // ตรวจสอบสิทธิ์
        if (!interaction.member.permissions.has('ManageGuild')) {
            logger.warn('Unauthorized admin-pet-roles attempt', {
                user: interaction.user.id,
                guild: interaction.guildId
            });
            return interaction.reply({
                content: '❌ คุณต้องมีสิทธิ์ Manage Guild จึงจะสามารถใช้งานคำสั่งนี้ได้',
                ephemeral: true
            });
        }

        // Validate guild exists
        if (!interaction.guild) {
            logger.error('Invalid guild in admin-pet-roles', { guildId: interaction.guildId });
            return interaction.reply({
                content: '❌ ไม่สามารถดึงข้อมูลเซิร์ฟเวอร์ได้',
                ephemeral: true
            });
        }

        logger.info('Admin pet-roles menu opened', {
            user: interaction.user.id,
            guild: interaction.guildId
        });

        const pages = createPetRolePages(interaction.guildId);
        const totalPages = pages.length;
        const pageIndex = 0;

        // Role selector dropdown
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(`pet_role_select_${interaction.guildId}`)
            .setPlaceholder('เลือก role ที่ต้องการ add เป็น pet role')
            .setMinValues(1)
            .setMaxValues(5);

        // Buttons
        const addButton = new ButtonBuilder()
            .setCustomId(`pet_role_add_${interaction.guildId}`)
            .setLabel('➕ Add Pet Role')
            .setStyle(ButtonStyle.Success);

        const removeButton = new ButtonBuilder()
            .setCustomId(`pet_role_remove_${interaction.guildId}`)
            .setLabel('➖ Remove Pet Role')
            .setStyle(ButtonStyle.Danger);

        const row1 = new ActionRowBuilder().addComponents(roleSelect);
        const row2 = new ActionRowBuilder().addComponents(addButton, removeButton);
        const pageButtons = totalPages > 1 ? [createPetRolePageButtons(interaction.guildId, pageIndex, totalPages)] : [];

        await interaction.reply({
            embeds: [pages[pageIndex]],
            components: [...pageButtons, row1, row2],
            ephemeral: true
        });
    }
};
