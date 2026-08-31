const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getGuildCurrencySymbol, getPetRoles } = require('../database.js');

function createBalanceEmbed(member) {
    const petRoles = getPetRoles(member.guild.id);
    
    const userPets = petRoles
        .filter(pet => member.roles.cache.has(pet.roleId))
        .map(pet => `${pet.petEmoji} ${pet.petName}`);

    let petText = userPets.length > 0 ? userPets.join('\n') : "you don't have a pet yet! ask an admin to set up pet roles.";

    const userData = getUser(member.id);
    const currency = getGuildCurrencySymbol(member.guild.id);
    const balanceText = `${currency} ${userData.balance.toLocaleString()}`;

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
