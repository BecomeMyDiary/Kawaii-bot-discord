const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db, getUser, updateBalance, getCoinflipSession, addCoinflipBet, getSettings, getGuildCurrencySymbol, getPetRoles, addPetRole, removePetRole } = require('../database.js');
const { createPetRolePages, createPetRolePageButtons } = require('../commands/admin-pet-roles.js');
const logger = require('../logger.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            // Validate critical interaction properties
            if (!interaction.user || !interaction.guildId) {
                console.warn('[WARN] Interaction missing user or guildId, skipping');
                return;
            }

            logger.debug('Interaction received', {
                type: interaction.type,
                user: interaction.user.id,
                guild: interaction.guildId
            });

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

                if (selectedValue === 'edit_currency') {
                    const modal = new ModalBuilder()
                        .setCustomId('modal_edit_currency')
                        .setTitle('ตั้งค่า Currency Symbol');

                    const symbolInput = new TextInputBuilder()
                        .setCustomId('currency_symbol_input')
                        .setLabel('สัญลักษณ์เงิน (เช่น 🍩, 💰, 🪙)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setPlaceholder('🍩');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(symbolInput)
                    );

                    await interaction.showModal(modal);
                }
                else if (selectedValue === 'edit_pet') {
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
                const currency = getGuildCurrencySymbol(interaction.guildId);

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

        // 2a. จัดการ RoleSelectMenu (pet roles)
        else if (interaction.isRoleSelectMenu()) {
            if (interaction.customId.startsWith('pet_role_select_')) {
                const guildId = interaction.values.length > 0 ? interaction.guild.id : null;
                
                if (!guildId || interaction.values.length === 0) {
                    return interaction.reply({ content: '❌ กรุณาเลือก role ก่อน', ephemeral: true });
                }

                const selectedRoleId = interaction.values[0];

                // เปิด Modal เพื่อให้ input ชื่อ pet และ emoji
                const modal = new ModalBuilder()
                    .setCustomId(`pet_role_modal_${selectedRoleId}`)
                    .setTitle('เพิ่ม Pet Role ใหม่');

                const petNameInput = new TextInputBuilder()
                    .setCustomId('pet_name')
                    .setLabel('ชื่อสัตว์เลี้ยง (เช่น น้องหมา, น้องแมว)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(30);

                const petEmojiInput = new TextInputBuilder()
                    .setCustomId('pet_emoji')
                    .setLabel('Emoji ของสัตว์เลี้ยง (เช่น 🐶, 🐱)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setMaxLength(5)
                    .setPlaceholder('🐾');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(petNameInput),
                    new ActionRowBuilder().addComponents(petEmojiInput)
                );

                await interaction.showModal(modal);
            }

            // ===== Pet Roles Delete Select =====
            else if (interaction.customId.startsWith('pet_role_delete_select_')) {
                const guildId = interaction.customId.replace('pet_role_delete_select_', '');
                const selectedRoleId = interaction.values[0];

                // เก็บข้อมูลเพื่อใช้ใน confirm button
                if (!interaction.client.pendingPetRoleDelete) {
                    interaction.client.pendingPetRoleDelete = new Map();
                }
                interaction.client.pendingPetRoleDelete.set(`${guildId}_${interaction.user.id}`, selectedRoleId);

                const embed = new EmbedBuilder()
                    .setColor('#ff6b6b')
                    .setTitle('⚠️ ยืนยันการลบ')
                    .setDescription(`คุณแน่ใจว่าต้องการลบ pet role <@&${selectedRoleId}> หรือไม่?`)
                    .setFooter({ text: 'การลบนี้ไม่สามารถกู้คืนได้' });

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        // 2b. จัดการ Button (coinflip and pet roles)
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
            
            // ===== Pet Roles Management Buttons =====
            else if (customId.startsWith('pet_roles_page_')) {
                const pagePayload = customId.replace('pet_roles_page_', '');
                const [guildId, pageRaw] = pagePayload.split('_');
                const currentPage = Number.isInteger(Number(pageRaw)) ? Number(pageRaw) : 0;
                const pages = createPetRolePages(guildId);
                const safePage = Math.max(0, Math.min(currentPage, pages.length - 1));

                const pageRow = createPetRolePageButtons(guildId, safePage, pages.length);
                const row1 = new ActionRowBuilder().addComponents(
                    new (require('discord.js')).RoleSelectMenuBuilder()
                        .setCustomId(`pet_role_select_${guildId}`)
                        .setPlaceholder('เลือก role ที่ต้องการ add เป็น pet role')
                        .setMinValues(1)
                        .setMaxValues(5)
                );
                const row2 = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pet_role_add_${guildId}`)
                        .setLabel('➕ Add Pet Role')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`pet_role_remove_${guildId}`)
                        .setLabel('➖ Remove Pet Role')
                        .setStyle(ButtonStyle.Danger)
                );

                await interaction.update({
                    embeds: [pages[safePage]],
                    components: [pageRow, row1, row2],
                    ephemeral: true
                });
            }

            else if (customId.startsWith('pet_role_add_')) {
                return interaction.reply({ content: '👉 กรุณาเลือก role จาก dropdown ด้านบนแล้วกรอกข้อมูลสัตว์เลี้ยง', ephemeral: true });
            }
            
            else if (customId.startsWith('pet_role_remove_')) {
                const guildId = customId.replace('pet_role_remove_', '');
                const petRoles = getPetRoles(guildId);
                
                if (petRoles.length === 0) {
                    return interaction.reply({ content: '❌ ยังไม่มี pet roles สำหรับลบ', ephemeral: true });
                }

                // สร้าง dropdown สำหรับเลือก role ที่จะลบ
                const roleSelectDelete = new (require('discord.js')).RoleSelectMenuBuilder()
                    .setCustomId(`pet_role_delete_select_${guildId}`)
                    .setPlaceholder('เลือก pet role ที่ต้องการลบ')
                    .setMinValues(1)
                    .setMaxValues(1);

                const deleteRow = new ActionRowBuilder().addComponents(roleSelectDelete);
                const confirmBtn = new ButtonBuilder()
                    .setCustomId(`pet_role_confirm_delete_${guildId}`)
                    .setLabel('✅ Confirm Delete')
                    .setStyle(ButtonStyle.Danger);
                
                const cancelBtn = new ButtonBuilder()
                    .setCustomId('pet_role_cancel_delete')
                    .setLabel('❌ Cancel')
                    .setStyle(ButtonStyle.Secondary);

                const confirmRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

                await interaction.reply({
                    content: '🗑️ เลือก pet role ที่ต้องการลบ:',
                    components: [deleteRow, confirmRow],
                    ephemeral: true
                });
            }

            else if (customId.startsWith('pet_role_confirm_delete_')) {
                const guildId = customId.replace('pet_role_confirm_delete_', '');
                const key = `${guildId}_${interaction.user.id}`;

                if (!interaction.client.pendingPetRoleDelete || !interaction.client.pendingPetRoleDelete.has(key)) {
                    return interaction.reply({ content: '❌ ไม่มีการเลือก role ในการลบ', ephemeral: true });
                }

                const roleId = interaction.client.pendingPetRoleDelete.get(key);
                const success = removePetRole(guildId, roleId);

                if (success) {
                    interaction.client.pendingPetRoleDelete.delete(key);
                    const embed = new EmbedBuilder()
                        .setColor('#51cf66')
                        .setTitle('✅ ลบ Pet Role สำเร็จ!')
                        .setDescription(`<@&${roleId}> ถูกลบออกจากระบบ pet แล้ว`)
                        .setTimestamp();

                    return interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    return interaction.reply({ content: '❌ ไม่สามารถลบ pet role ได้', ephemeral: true });
                }
            }

            else if (customId === 'pet_role_cancel_delete') {
                const key = Array.from(interaction.client.pendingPetRoleDelete || new Map()).find(([k]) => k.endsWith(interaction.user.id));
                if (key) {
                    interaction.client.pendingPetRoleDelete.delete(key[0]);
                }
                return interaction.reply({ content: '❌ ยกเลิกการลบแล้ว', ephemeral: true });
            }
        }

        // 3. จัดการ Modal Submit (ของ settings, coinflip, และ pet roles)
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
                const currency = getGuildCurrencySymbol(interaction.guildId);

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

            // ===== Pet Roles Modal =====
            if (interaction.customId.startsWith('pet_role_modal_')) {
                const roleId = interaction.customId.replace('pet_role_modal_', '');
                const petName = interaction.fields.getTextInputValue('pet_name').trim();
                const petEmoji = interaction.fields.getTextInputValue('pet_emoji').trim() || '🐾';

                if (!petName) {
                    return interaction.reply({ content: '❌ ชื่อสัตว์เลี้ยงไม่สามารถว่างได้', ephemeral: true });
                }

                // ตรวจสอบว่า role นี้มีอยู่ใน server หรือไม่
                try {
                    const role = await interaction.guild.roles.fetch(roleId);
                    if (!role) {
                        return interaction.reply({ content: '❌ Role ที่เลือกไม่พบในเซิร์ฟเวอร์นี้', ephemeral: true });
                    }
                } catch (err) {
                    return interaction.reply({ content: '❌ ไม่สามารถดึงข้อมูล role ได้', ephemeral: true });
                }

                // เพิ่ม pet role เข้าฐานข้อมูล
                const success = addPetRole(guildId, roleId, petName, petEmoji);
                
                if (success) {
                    const embed = new EmbedBuilder()
                        .setColor('#ffb6c1')
                        .setTitle('✅ เพิ่ม Pet Role สำเร็จ!')
                        .setDescription(`${petEmoji} **${petName}** - <@&${roleId}> เพิ่มเข้าระบบ pet แล้ว`)
                        .setTimestamp();

                    return interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    return interaction.reply({ content: `⚠️ Role <@&${roleId}> มีอยู่ในระบบแล้ว`, ephemeral: true });
                }
            }

            // ===== Settings Modals =====
            if (interaction.customId === 'modal_edit_currency') {
                const rawSymbol = interaction.fields.getTextInputValue('currency_symbol_input');
                const currentSettings = getSettings(guildId);
                const symbol = rawSymbol.trim() !== '' ? rawSymbol.trim() : (currentSettings.currency_symbol || '🍩');

                if (!symbol || symbol.length > 8) {
                    return interaction.reply({ content: '❌ กรุณากรอกสัญลักษณ์เงินให้ถูกต้อง', ephemeral: true });
                }

                db.prepare('UPDATE server_settings SET currency_symbol = ? WHERE guildId = ?').run(symbol, guildId);

                await interaction.reply({ content: `✅ บันทึกสัญลักษณ์เงินสำหรับเซิร์ฟเวอร์นี้เป็น **${symbol}** แล้ว`, ephemeral: true });
            }
            else if (interaction.customId === 'modal_edit_pet') {
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
        } catch (err) {
            logger.error('Interaction handler error', {
                error: err.message,
                stack: err.stack,
                user: interaction.user?.id,
                type: interaction.type
            });

            // Notify user safely
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
                        ephemeral: true 
                    });
                }
            } catch (replyErr) {
                console.error('[ERROR] Failed to send error reply:', replyErr.message);
            }
        }
    },
};
