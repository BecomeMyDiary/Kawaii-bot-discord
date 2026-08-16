require('dotenv').config();
const { REST, Routes } = require('discord.js');


const commands = [

];

// ใส่ข้อมูลของคุณตรงนี้
const CLIENT_ID = '1537827016676745306';
const GUILD_ID = '1373557695453597858';

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('กำลังรีเฟรช Application (/) commands...');

        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('ลงทะเบียน Slash Commands สำเร็จแล้ว!');
    } catch (error) {
        console.error(error);
    }
})();