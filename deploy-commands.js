const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
    {
        name: 'coinflip',
        description: 'Flip a coin to bet',
        options: [
            {
                name: 'choice',
                description: 'Select heads or tails',
                type: 3,
                required: true,
                choices: [
                    { name: 'Heads', value: 'heads' },
                    { name: 'Tails', value: 'tails' }
                ]
            },
            {
                name: 'amount',
                description: 'Amount to bet',
                type: 4,
                required: true,
                minValue: 1,
            }
        ]
    }
];

// ใส่ข้อมูลของคุณตรงนี้
const CLIENT_ID = '1537827016676745306';
const GUILD_ID = '1373557695453597858';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

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