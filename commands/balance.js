const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../database.js');

const PET_ROLES = [
    { id: '1532432480089542717', name: '🐶 น้องหมา' },
    { id: '1532432401119186944', name: '🐱 น้องแมว' },
    { id: '1532432532434325705', name: '🐥 น้องเป็ด' },
    { id: '1532432504441798676', name: '🐹 น้องแฮมสเตอร์' },
    { id: '1532432441740886306', name: '🐷 น้องหมู' },
    { id: '1532432562830704710', name: '🦭 น้องแมวน้ำ' },
    { id: '1532432585953906753', name: '🦛 น้องหมูเด้ง' },
    { id: '1532432608779174029', name: '🐉 มังกร' }
];

function createBalanceEmbed(member) {
    const userPets = PET_ROLES
        .filter(pet => member.roles.cache.has(pet.id))
        .map(pet => pet.name);

    let petText = userPets.length > 0 ? userPets.join('\n') : "you don't have a pet!\nget one at <#1532427792724131992>";

    const userData = getUser(member.id);
    const balanceText = `${process.env.CURRENCY_SYMBOL || '🍩'} ${userData.balance.toLocaleString()}`;

    const embed = new EmbedBuilder()
        .setColor('#ffb6c1')
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .addFields(
            { name: 'Pet', value: petText, inline: true },
            { name: 'Balance', value: balanceText, inline: true }
        );

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('ดูยอดเงินของคุณ'),
    createBalanceEmbed,
    async execute(interaction) {
        const embed = createBalanceEmbed(interaction.member);
        await interaction.reply({ embeds: [embed] });
    },
};
