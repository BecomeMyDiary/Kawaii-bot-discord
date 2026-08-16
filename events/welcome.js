const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        // 🔴 เปลี่ยนเป็น ID ของช่องที่ต้องการให้ส่งข้อความต้อนรับ
        const WELCOME_CHANNEL_ID = '1528677935483977858';

        const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#ffb6c1') // สีเส้นขอบ Embed ด้านข้าง
            .setAuthor({
                name: `◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇`,
                iconURL: member.guild.iconURL() || member.user.displayAvatarURL()
            })
            .setDescription(
                '◇◇◇◇◇◇◇◇\n\n' +
                `🌸 Welcome to the Diary : ${member}\n` +
                '☺️ พวกเด็กน้อยยย\n' +
                '---------Please follow the rules----------\n\n' +
                '◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇'
            )
            .setThumbnail(member.user.displayAvatarURL({ size: 256 })); // รูปโปรไฟล์สมาชิกใหม่ด้านขวา

        await channel.send({ embeds: [embed] });
    }
};