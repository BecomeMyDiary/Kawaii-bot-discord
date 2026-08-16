const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db, getUser, updateBalance, getCoinflipSession, addCoinflipBet, getSettings } = require('../database.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // 1. จัดการ Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`ไม่พบคำสั่ง ${interaction.commandName}`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'เกิดข้อผิดพลาดในการทำงานคำสั่งนี้!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'เกิดข้อผิดพลาดในการทำงานคำสั่งนี้!', ephemeral: true });
                }
            }
        }

        // 2. จัดการ StringSelectMenu (ของ settings)
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'settings_select_menu') {
                const selectedValue = interaction.values[0];

                if (selectedValue === 'edit_pet') {
                    const modal = new ModalBuilder()
                        .setCustomId('modal_edit_pet')
                        .setTitle('ตั้งค่าคำสั่ง /pet');

                    const minInput = new TextInputBuilder()
                        .setCustomId('pet_min_input')
                        .setLabel('คะแนนขั้นต่ำ (Min)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const maxInput = new TextInputBuilder()
                        .setCustomId('pet_max_input')
                        .setLabel('คะแนนสูงสุด (Max)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const cooldownInput = new TextInputBuilder()
                        .setCustomId('pet_cooldown_input')
                        .setLabel('คูลดาวน์ (นาที)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(minInput),
                        new ActionRowBuilder().addComponents(maxInput),
                        new ActionRowBuilder().addComponents(cooldownInput)
                    );

                    await interaction.showModal(modal);
                }
                else if (selectedValue === 'edit_snuggle') {
                    const modal = new ModalBuilder()
                        .setCustomId('modal_edit_snuggle')
                        .setTitle('ตั้งค่าคำสั่ง /snuggle');

                    const minInput = new TextInputBuilder()
                        .setCustomId('snuggle_min_input')
                        .setLabel('คะแนนขั้นต่ำ (Min)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const maxInput = new TextInputBuilder()
                        .setCustomId('snuggle_max_input')
                        .setLabel('คะแนนสูงสุด (Max)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const cooldownInput = new TextInputBuilder()
                        .setCustomId('snuggle_cooldown_input')
                        .setLabel('คูลดาวน์ (นาที)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(minInput),
                        new ActionRowBuilder().addComponents(maxInput),
                        new ActionRowBuilder().addComponents(cooldownInput)
                    );

                    await interaction.showModal(modal);
                }
                else if (selectedValue === 'edit_pick') {
                    const modal = new ModalBuilder()
                        .setCustomId('modal_edit_pick')
                        .setTitle('ตั้งค่าคำสั่ง /pick');

                    const minInput = new TextInputBuilder()
                        .setCustomId('pick_min_input')
                        .setLabel('คะแนนขั้นต่ำ (Min)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const maxInput = new TextInputBuilder()
                        .setCustomId('pick_max_input')
                        .setLabel('คะแนนสูงสุด (Max)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    const cooldownInput = new TextInputBuilder()
                        .setCustomId('pick_cooldown_input')
                        .setLabel('คูลดาวน์ (นาที)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(minInput),
                        new ActionRowBuilder().addComponents(maxInput),
                        new ActionRowBuilder().addComponents(cooldownInput)
                    );

                    await interaction.showModal(modal);
                }
            }
            // ===== Help Guide Select Menu =====
            if (interaction.isStringSelectMenu() && interaction.customId === 'help_guide_menu') {
                const selected = interaction.values[0];
                const currency = process.env.CURRENCY_SYMBOL || '🍩';

                let embed = new EmbedBuilder().setColor('#ffb6c1');

                if (selected === 'guide_earning') {
                    embed
                        .setAuthor({ name: '🔍 การหาเงินในเซิร์ฟเวอร์', iconURL: interaction.client.user.displayAvatarURL() })
                        .setDescription(
                            '• **แชทในห้องที่กำหนด** = ได้รับเงินอัตโนมัติ (เช็กด้วย `/balance`)\n' +
                            '• **`/pick`** = กดรับเงินตอนบอทสุ่มโผล่ข้อความแจ้งเตือน\n' +
                            '• **`/pet` & `/snuggle`** = หาเงินฟรี มี Cooldown ตามที่เซิร์ฟเวอร์ตั้งไว้\n' +
                            '• **`/balance`** = เพื่อดูเงินคงเหลือและสัตว์เลี้ยงที่มี'
                        );
                }
                else if (selected === 'guide_shop') {
                    embed
                        .setAuthor({ name: '🏪 ร้านค้า Role & สัตว์เลี้ยง', iconURL: interaction.client.user.displayAvatarURL() })
                        .setDescription(
                            '🏆 **ร้านค้า Role**\n' +
                            '• `/shop view` ดูของทั้งหมด (ต้องซื้อ Bronze ➔ Silver ➔ Gold ตามลำดับ ห้ามข้ามขั้น)\n\n' +
                            '🐾 **ร้านสัตว์เลี้ยง**\n' +
                            '• พิมพ์ `/petshop` เพื่อดูและซื้อสัตว์เลี้ยง\n' +
                            '• มีสัตว์เลี้ยงแล้วจะปลดล็อกคำสั่งพิเศษเพิ่ม!'
                        );
                }
                else if (selected === 'guide_gambling') {
                    embed
                        .setAuthor({ name: '🎲 เกมเดิมพันเสี่ยงโชค', iconURL: interaction.client.user.displayAvatarURL() })
                        .setDescription(
                            '🎰 **คำสั่งเล่นเดิมพัน**\n' +
                            '• **`/coinflip`** = โยนเหรียญเดิมพันคนเดียว (Heads / Tails)\n' +
                            '• **`/group-coinflip`** = เปิดห้องโยนเหรียญแทงร่วมกับเพื่อนในเซิร์ฟเวอร์ (รับ 2x)\n' +
                            '• **`/slots`** = หมุนสล็อตลุ้นรางวัลใหญ่'
                        );
                }

                // อัปเดต Embed บนข้อความเดิมทันทีโดยไม่ต้องส่งข้อความใหม่
                await interaction.update({ embeds: [embed] });
            }
        }

        // 2b. จัดการ Button (coinflip)
        else if (interaction.isButton()) {
            const customId = interaction.customId;

            if (customId.startsWith('coinflip_heads_') || customId.startsWith('coinflip_tails_')) {
                const side = customId.startsWith('coinflip_heads_') ? 'heads' : 'tails';
                const sessionId = customId.replace(`coinflip_${side}_`, '');

                const session = getCoinflipSession(sessionId);
                if (!session || session.resolved) {
                    return interaction.reply({ content: '❌ การพนันรอบนี้สิ้นสุดแล้ว!', ephemeral: true });
                }

                // เช็คว่าเคยเดิมพันไปแล้วหรือยัง
                if (session.bets.has(interaction.user.id)) {
                    return interaction.reply({ content: '❌ คุณเดิมพันในรอบนี้ไปแล้ว!', ephemeral: true });
                }

                // แสดง Modal ให้กรอกจำนวนเงิน
                const modal = new ModalBuilder()
                    .setCustomId(`coinflip_bet_${side}_${sessionId}`)
                    .setTitle(`🪙 เดิมพัน ${side === 'heads' ? 'Heads' : 'Tails'}`);
                const amountInput = new TextInputBuilder()
                    .setCustomId('coinflip_amount')
                    .setLabel('จำนวนเงินที่ต้องการเดิมพัน')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('เช่น 500')
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
                await interaction.showModal(modal);
            }
        }

        // 3. จัดการ Modal Submit (ของ settings และ coinflip)
        else if (interaction.isModalSubmit()) {
            const guildId = interaction.guild.id;

            // ===== Coinflip Bet Modal =====
            if (interaction.customId.startsWith('coinflip_bet_')) {
                // รูปแบบ: coinflip_bet_<side>_<sessionId>
                const parts = interaction.customId.replace('coinflip_bet_', '');
                const underscoreIdx = parts.indexOf('_');
                const side = parts.substring(0, underscoreIdx); // 'heads' or 'tails'
                const sessionId = parts.substring(underscoreIdx + 1);

                const session = getCoinflipSession(sessionId);
                if (!session || session.resolved) {
                    return interaction.reply({ content: '❌ การพนันรอบนี้สิ้นสุดแล้ว!', ephemeral: true });
                }

                if (session.bets.has(interaction.user.id)) {
                    return interaction.reply({ content: '❌ คุณเดิมพันในรอบนี้ไปแล้ว!', ephemeral: true });
                }

                const amountRaw = interaction.fields.getTextInputValue('coinflip_amount');
                const amount = parseInt(amountRaw);
                const currency = process.env.CURRENCY_SYMBOL || '🍩';

                if (isNaN(amount) || amount <= 0) {
                    return interaction.reply({ content: '❌ กรุณากรอกจำนวนเงินที่ถูกต้อง (ตัวเลขมากกว่า 0)', ephemeral: true });
                }

                const userData = getUser(interaction.user.id);
                if (userData.balance < amount) {
                    return interaction.reply({
                        content: `❌ ยอดเงินไม่พอ! คุณมีเพียง **${currency} ${userData.balance.toLocaleString()}** แต่ต้องการเดิมพัน **${currency} ${amount.toLocaleString()}**`,
                        ephemeral: true
                    });
                }

                // หักเงินทันที
                updateBalance(interaction.user.id, -amount);

                // บันทึก bet
                const added = addCoinflipBet(sessionId, interaction.user.id, side, amount);
                if (!added) {
                    // คืนเงินถ้าเพิ่มไม่ได้ (race condition)
                    updateBalance(interaction.user.id, amount);
                    return interaction.reply({ content: '❌ ไม่สามารถเดิมพันได้ กรุณาลองอีกครั้ง', ephemeral: true });
                }

                await interaction.reply({
                    content: `✅ เดิมพัน **${side === 'heads' ? '🪙 Heads' : '💀 Tails'}** จำนวน **${currency} ${amount.toLocaleString()}** เรียบร้อย!
> หากชนะจะได้รับ **${currency} ${(amount * 2).toLocaleString()}**`,
                    ephemeral: true
                });

                // อัปเดต embed ให้แสดงสถานะล่าสุด
                try {
                    const channel = await interaction.client.channels.fetch(session.channelId);
                    const message = await channel.messages.fetch(session.messageId);
                    const hostUser = interaction.client.users.cache.get(session.hostId);
                    const hostName = hostUser ? hostUser.displayName : 'ไม่ทราบชื่อ';

                    const timeLeft = Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));
                    let headsCount = 0, tailsCount = 0, headsTotal = 0, tailsTotal = 0;
                    for (const [, bet] of session.bets) {
                        if (bet.side === 'heads') { headsCount++; headsTotal += bet.amount; }
                        else { tailsCount++; tailsTotal += bet.amount; }
                    }

                    const updatedEmbed = new EmbedBuilder()
                        .setColor('#ffb6c1')
                        .setTitle('🎴 Coinflip — Group Betting')
                        .setDescription(`เปิดรับเดิมพันอีก **${timeLeft} วินาที**!\nกดปุ่มด้านล่างเพื่อเลือกฝั่งและกรอกจำนวนเดิมพัน\n\n> ⚠️ ผู้เล่นแต่ละคนเดิมพันได้ **1 ครั้ง** และ**ชนะได้รับ 2x** ของที่เดิมพัน`)
                        .addFields(
                            { name: '🪙 Heads', value: `ผู้เดิมพัน: **${headsCount}** คน\nรวม: **${currency} ${headsTotal.toLocaleString()}**`, inline: true },
                            { name: '💀 Tails', value: `ผู้เดิมพัน: **${tailsCount}** คน\nรวม: **${currency} ${tailsTotal.toLocaleString()}**`, inline: true },
                            { name: '\u200b', value: `💰 Total Pool: **${currency} ${(headsTotal + tailsTotal).toLocaleString()}**`, inline: false }
                        )
                        .setFooter({
                            text: `เปิดโดย ${hostName} • ผลตอบแทน 2x`,
                            iconURL: hostUser.displayAvatarURL()
                        })
                        .setTimestamp();

                    await message.edit({ embeds: [updatedEmbed] });
                } catch (e) {
                    // ไม่ต้อง throw ถ้า edit ไม่ได้
                }

                return;
            }

            // ===== Settings Modals =====
            if (interaction.customId === 'modal_edit_pet') {
                const rawMin = interaction.fields.getTextInputValue('pet_min_input');
                const rawMax = interaction.fields.getTextInputValue('pet_max_input');
                const rawCooldown = interaction.fields.getTextInputValue('pet_cooldown_input');

                const currentSettings = getSettings(guildId);

                const minPoints = rawMin.trim() !== '' ? parseInt(rawMin) : currentSettings.pet_min;
                const maxPoints = rawMax.trim() !== '' ? parseInt(rawMax) : currentSettings.pet_max;
                const cooldown = rawCooldown.trim() !== '' ? parseInt(rawCooldown) : currentSettings.pet_cooldown;

                if (isNaN(minPoints) || isNaN(maxPoints) || isNaN(cooldown)) {
                    return interaction.reply({ content: '❌ กรุณากรอกเฉพาะตัวเลขเท่านั้น!', flags: MessageFlags.Ephemeral });
                }

                db.prepare('UPDATE server_settings SET pet_min = ?, pet_max = ?, pet_cooldown = ? WHERE guildId = ?')
                    .run(minPoints, maxPoints, cooldown, guildId);

                await interaction.reply({ content: '✅ บันทึกการตั้งค่า `/pet` สำเร็จเรียบร้อย!', ephemeral: true });
            }
            else if (interaction.customId === 'modal_edit_snuggle') {
                const rawMin = interaction.fields.getTextInputValue('snuggle_min_input');
                const rawMax = interaction.fields.getTextInputValue('snuggle_max_input');
                const rawCooldown = interaction.fields.getTextInputValue('snuggle_cooldown_input');

                const currentSettings = getSettings(guildId);

                const minPoints = rawMin.trim() !== '' ? parseInt(rawMin) : currentSettings.snuggle_min;
                const maxPoints = rawMax.trim() !== '' ? parseInt(rawMax) : currentSettings.snuggle_max;
                const cooldown = rawCooldown.trim() !== '' ? parseInt(rawCooldown) : currentSettings.snuggle_cooldown;

                if (isNaN(minPoints) || isNaN(maxPoints) || isNaN(cooldown)) {
                    return interaction.reply({ content: '❌ กรุณากรอกเฉพาะตัวเลขเท่านั้น!', ephemeral: true });
                }

                db.prepare('UPDATE server_settings SET snuggle_min = ?, snuggle_max = ?, snuggle_cooldown = ? WHERE guildId = ?')
                    .run(minPoints, maxPoints, cooldown, guildId);

                await interaction.reply({ content: '✅ บันทึกการตั้งค่า `/snuggle` สำเร็จเรียบร้อย!', ephemeral: true });
            }
            else if (interaction.customId === 'modal_edit_pick') {
                const rawMin = interaction.fields.getTextInputValue('pick_min_input');
                const rawMax = interaction.fields.getTextInputValue('pick_max_input');
                const rawCooldown = interaction.fields.getTextInputValue('pick_cooldown_input');

                const currentSettings = getSettings(guildId);

                const minPoints = rawMin.trim() !== '' ? parseInt(rawMin) : currentSettings.pick_min;
                const maxPoints = rawMax.trim() !== '' ? parseInt(rawMax) : currentSettings.pick_max;
                const cooldown = rawCooldown.trim() !== '' ? parseInt(rawCooldown) : currentSettings.pick_cooldown;

                if (isNaN(minPoints) || isNaN(maxPoints) || isNaN(cooldown)) {
                    return interaction.reply({ content: '❌ กรุณากรอกเฉพาะตัวเลขเท่านั้น!', ephemeral: true });
                }

                db.prepare('UPDATE server_settings SET pick_min = ?, pick_max = ?, pick_cooldown = ? WHERE guildId = ?')
                    .run(minPoints, maxPoints, cooldown, guildId);

                await interaction.reply({ content: '✅ บันทึกการตั้งค่า `/pick` สำเร็จเรียบร้อย!', ephemeral: true });
            }
        }
    },
};
