const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');
const {
    getUser,
    updateBalance,
    getSettings,
    createCoinflipSession,
    getCoinflipSession,
    resolveCoinflipSession,
    deleteCoinflipSession
} = require('../database.js');

// 🔴 ปรับเป็น async และดึงข้อมูล owner ของเซิร์ฟเวอร์เพื่อนำชื่อมาแสดงใน Footer
async function buildCoinflipEmbed(interaction, session, status = 'open') {
    const currency = process.env.CURRENCY_SYMBOL || '🍩';

    let headsCount = 0, tailsCount = 0;
    let headsTotal = 0, tailsTotal = 0;

    for (const [, bet] of session.bets) {
        if (bet.side === 'heads') { headsCount++; headsTotal += bet.amount; }
        else { tailsCount++; tailsTotal += bet.amount; }
    }

    const totalPool = headsTotal + tailsTotal;
    const timeLeft = Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));

    // ดึงข้อมูล Owner ของเซิร์ฟเวอร์อย่างถูกต้อง
    let ownerName = 'Server Owner';
    let ownerAvatar = null;
    try {
        const owner = await interaction.guild.fetchOwner();
        ownerName = owner.user.displayName || owner.user.username;
        ownerAvatar = owner.user.displayAvatarURL();
    } catch (e) {
        console.error('ไม่สามารถดึงข้อมูล Owner ได้:', e);
    }

    const embed = new EmbedBuilder()
        .setColor(status === 'open' ? '#f5c518' : (status === 'heads' ? '#a8d8f0' : '#f0a8a8'))
        .setTitle('🪙 Coinflip — Group Betting')
        .setDescription(
            status === 'open'
                ? `เปิดรับเดิมพันอีก **${timeLeft} วินาที**!\nกดปุ่มด้านล่างเพื่อเลือกฝั่งและกรอกจำนวนเดิมพัน\n\n> ⚠️ ผู้เล่นแต่ละคนเดิมพันได้ **1 ครั้ง** และ**ชนะได้รับ 2x** ของที่เดิมพัน`
                : `🎰 **ผลการโยนเหรียญ: ${status === 'heads' ? '🪙 Heads ชนะ!' : '💀 Tails ชนะ!'}**`
        )
        .addFields(
            {
                name: '🪙 Heads',
                value: `ผู้เดิมพัน: **${headsCount}** คน\nรวม: **${currency} ${headsTotal.toLocaleString()}**`,
                inline: true
            },
            {
                name: '💀 Tails',
                value: `ผู้เดิมพัน: **${tailsCount}** คน\nรวม: **${currency} ${tailsTotal.toLocaleString()}**`,
                inline: true
            },
            {
                name: '\u200b',
                value: `💰 Total Pool: **${currency} ${totalPool.toLocaleString()}**`,
                inline: false
            }
        )
        .setFooter({
            text: `เปิดโดย ${ownerName} • ผลตอบแทน 2x`,
            iconURL: ownerAvatar
        })
        .setTimestamp();

    return embed;
}

// ฟังก์ชัน resolve ผลพนัน
async function resolveCoinflip(client, interaction, sessionId) {
    const session = resolveCoinflipSession(sessionId);
    if (!session) return;

    const currency = process.env.CURRENCY_SYMBOL || '🍩';

    const winSide = Math.random() < 0.5 ? 'heads' : 'tails';
    const loseSide = winSide === 'heads' ? 'tails' : 'heads';

    const winners = [];
    const losers = [];

    for (const [userId, bet] of session.bets) {
        if (bet.side === winSide) {
            updateBalance(userId, bet.amount * 2);
            winners.push({ userId, amount: bet.amount });
        } else {
            losers.push({ userId, amount: bet.amount });
        }
    }

    let winnerText = winners.length > 0
        ? winners.map(w => `<@${w.userId}> +${currency}${w.amount.toLocaleString()}`).join('\n')
        : 'ไม่มีผู้เดิมพัน';
    let loserText = losers.length > 0
        ? losers.map(l => `<@${l.userId}> -${currency}${l.amount.toLocaleString()}`).join('\n')
        : 'ไม่มีผู้เดิมพัน';

    try {
        const channel = await client.channels.fetch(session.channelId);
        const message = await channel.messages.fetch(session.messageId);

        const resultEmbed = await buildCoinflipEmbed(interaction, session, winSide);

        resultEmbed.addFields(
            {
                name: `✅ ฝั่งชนะ (${winSide === 'heads' ? '🪙 Heads' : '💀 Tails'})`,
                value: winnerText,
                inline: true
            },
            {
                name: `❌ ฝั่งแพ้ (${loseSide === 'heads' ? '🪙 Heads' : '💀 Tails'})`,
                value: loserText,
                inline: true
            }
        );

        const disabledRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`coinflip_heads_${sessionId}`)
                    .setLabel('🪙 Heads')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`coinflip_tails_${sessionId}`)
                    .setLabel('💀 Tails')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );

        await message.edit({ embeds: [resultEmbed], components: [disabledRow] });
    } catch (err) {
        console.error('[Coinflip] Error editing message:', err);
    }

    deleteCoinflipSession(sessionId);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('group-coinflip')
        .setDescription('เปิดการพนันโยนเหรียญแบบ Group')
        .addIntegerOption(option =>
            option
                .setName('duration')
                .setDescription('ระยะเวลาในการเปิดรับเดิมพัน (วินาที)')
                .setMinValue(10)
                .setMaxValue(600)
                .setRequired(false)
        ),

    resolveCoinflip,

    async execute(interaction) {
        const ALLOWED_ROLE_IDS = ['1373607258352783360'];

        const isOwner = interaction.guild.ownerId === interaction.user.id;
        const hasRole = interaction.member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));

        if (!isOwner && !hasRole) {
            // 🔴 เปลี่ยน ephemeral: true เป็น flags: MessageFlags.Ephemeral เพื่อแก้ Deprecated Warning
            return interaction.reply({ content: '❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้!', flags: MessageFlags.Ephemeral });
        }
        const settings = getSettings(interaction.guild.id);
        const inputDuration = interaction.options.getInteger('duration');
        const duration = inputDuration || settings.coinflip_duration || 30;

        const sessionId = `${interaction.guild.id}_${interaction.channel.id}`;

        const existingSession = getCoinflipSession(sessionId);
        if (existingSession && !existingSession.resolved) {
            return interaction.reply({
                content: '❌ มีการพนัน Coinflip ที่กำลังดำเนินการอยู่ในช่องนี้แล้ว!',
                flags: MessageFlags.Ephemeral
            });
        }

        const endsAt = Date.now() + duration * 1000;

        const sessionData = {
            hostId: interaction.user.id,
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: null,
            duration,
            endsAt
        };

        createCoinflipSession(sessionId, sessionData);
        const session = getCoinflipSession(sessionId);

        const embed = await buildCoinflipEmbed(interaction, session, 'open');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`coinflip_heads_${sessionId}`)
                    .setLabel('🪙 Heads')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`coinflip_tails_${sessionId}`)
                    .setLabel('💀 Tails')
                    .setStyle(ButtonStyle.Danger)
            );

        const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
        session.messageId = reply.id;

        const client = interaction.client;

        const updateInterval = setInterval(async () => {
            const s = getCoinflipSession(sessionId);
            if (!s || s.resolved) {
                clearInterval(updateInterval);
                return;
            }
            try {
                const updatedEmbed = await buildCoinflipEmbed(interaction, s, 'open');
                await reply.edit({ embeds: [updatedEmbed], components: [row] });
            } catch (e) {
                clearInterval(updateInterval);
            }
        }, 10_000);

        session.timer = setTimeout(async () => {
            clearInterval(updateInterval);
            await resolveCoinflip(client, interaction, sessionId);
        }, duration * 1000);
    }
};