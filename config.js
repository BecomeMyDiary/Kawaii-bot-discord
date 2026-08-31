require('dotenv').config();

module.exports = {
  discordToken: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  dbPath: process.env.DB_PATH || 'economy.db',
  currencySymbol: process.env.CURRENCY_SYMBOL || '🍩',
  botName: process.env.BOT_NAME || 'Kawaii Bot',
  environment: process.env.NODE_ENV || 'development'
};
