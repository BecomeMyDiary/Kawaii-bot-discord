const assert = require('node:assert/strict');

const { getSettings, getGuildCurrencySymbol, updateGuildCurrencySymbol } = require('../database.js');
const config = require('../config.js');

const guildId = 'test-guild';
const settings = getSettings(guildId);

assert.equal(typeof config.discordToken, 'string');
assert.equal(settings.guildId, guildId);
assert.equal(typeof settings.currency_symbol, 'string');
assert.equal(getGuildCurrencySymbol(guildId), settings.currency_symbol);

const saved = updateGuildCurrencySymbol(guildId, '💰');
assert.equal(saved, '💰');
assert.equal(getGuildCurrencySymbol(guildId), '💰');

updateGuildCurrencySymbol(guildId, '🍩');
console.log('config test passed');
