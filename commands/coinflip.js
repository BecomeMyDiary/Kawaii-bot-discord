const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags
} = require('discord.js');
const { getUser, updateBalance, getGuildCurrencySymbol } = require('../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin to bet')
        .addStringOption(option =>
            option
                .setName('choice')
                .setDescription('Select heads or tails')
                .setRequired(true)
                .addChoices(
                    { name: 'Heads', value: 'heads' },
                    { name: 'Tails', value: 'tails' }
                )
        )
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount to bet')
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {
        const choice = interaction.options.getString('choice');
        const amount = interaction.options.getInteger('amount');
        const userId = interaction.user.id;
        const currency = getGuildCurrencySymbol(interaction.guildId);

        // 1. ตรวจสอบยอดเงินของผู้เล่น
        const userData = getUser(userId);
        if (!userData || userData.balance < amount) {
            return interaction.reply({
                content: `❌ You don't have enough money! You have **${currency} ${(userData?.balance || 0).toLocaleString()}**`,
                flags: MessageFlags.Ephemeral
            });
        }

        // 2. สุ่มผลลัพธ์
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const isWin = choice === result;

        // 3. คำนวณเงิน
        if (isWin) {
            updateBalance(userId, amount);
        } else {
            updateBalance(userId, -amount);
        }

        // 4. สร้าง Embed ตามแบบ UI ในรูปภาพ
        const embed = new EmbedBuilder()
            .setColor('#ffb6c1') // สีฟ้าพาสเทลตามรูป
            .setAuthor({
                name: isWin ? `you were right, it was ${result}!` : `whoops, it was ${result}.`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription(
                isWin
                    ? `you have earned ${currency} ${amount.toLocaleString()}.`
                    : `better luck next time, you have lost ${currency} ${amount.toLocaleString()}.`
            );

        // 5. ส่งคำตอบ
        return interaction.reply({ embeds: [embed] });
    }
};