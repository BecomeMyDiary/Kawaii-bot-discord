const path = require('node:path');
const Database = require('better-sqlite3');
const { dbPath } = require('./config.js');
const db = new Database(path.resolve(__dirname, dbPath));

// สร้างตารางเก็บข้อมูลผู้ใช้ (ถ้ายังไม่มี)
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        bank INTEGER DEFAULT 0
    )
`).run();

// สร้างตารางเก็บเวลา cooldown (ถ้ายังไม่มี)
db.prepare(`
    CREATE TABLE IF NOT EXISTS user_cooldowns (
        userId TEXT PRIMARY KEY,
        nextPick INTEGER DEFAULT 0,
        nextPet INTEGER DEFAULT 0,
        nextSnuggle INTEGER DEFAULT 0
    )
`).run();

// เพิ่มคอลัมน์ nextPet และ nextSnuggle ให้กับตารางเก่าที่มีอยู่แล้ว (migration)
try { db.prepare('ALTER TABLE user_cooldowns ADD COLUMN nextPet INTEGER DEFAULT 0').run(); } catch (e) { /* คอลัมน์มีอยู่แล้ว */ }
try { db.prepare('ALTER TABLE user_cooldowns ADD COLUMN nextSnuggle INTEGER DEFAULT 0').run(); } catch (e) { /* คอลัมน์มีอยู่แล้ว */ }

// ฟังก์ชันดึงข้อมูลผู้ใช้
function getUser(userId) {
    let user = db.prepare('SELECT * FROM users WHERE userId = ?').get(userId);
    if (!user) {
        db.prepare('INSERT INTO users (userId, balance, bank) VALUES (?, ?, ?)').run(userId, 0, 0);
        user = { userId, balance: 0, bank: 0 };
    }
    return user;
}

// ฟังก์ชันอัปเดตยอดเงิน
function updateBalance(userId, amount) {
    getUser(userId); // เช็คว่ามี user หรือยัง
    db.prepare('UPDATE users SET balance = balance + ? WHERE userId = ?').run(amount, userId);
}

// เพิ่มฟังก์ชันใน database.js
function addPoints(userId, amount) {
    db.prepare('UPDATE users SET balance = balance + ? WHERE userId = ?').run(amount, userId);
}

// เก็บเวลาที่สามารถ pick ได้ครั้งถัดไป
function setNextPickTime(userId, timestamp) {
    db.prepare('INSERT OR IGNORE INTO user_cooldowns (userId) VALUES (?)').run(userId);
    db.prepare('UPDATE user_cooldowns SET nextPick = ? WHERE userId = ?').run(timestamp, userId);
}

// เก็บเวลาที่สามารถ pet ได้ครั้งถัดไป
function setNextPetTime(userId, timestamp) {
    db.prepare('INSERT OR IGNORE INTO user_cooldowns (userId) VALUES (?)').run(userId);
    db.prepare('UPDATE user_cooldowns SET nextPet = ? WHERE userId = ?').run(timestamp, userId);
}

// เก็บเวลาที่สามารถ snuggle ได้ครั้งถัดไป
function setNextSnuggleTime(userId, timestamp) {
    db.prepare('INSERT OR IGNORE INTO user_cooldowns (userId) VALUES (?)').run(userId);
    db.prepare('UPDATE user_cooldowns SET nextSnuggle = ? WHERE userId = ?').run(timestamp, userId);
}

db.prepare(`
    CREATE TABLE IF NOT EXISTS server_settings (
        guildId TEXT PRIMARY KEY,
        currency_symbol TEXT DEFAULT '🍩',
        pet_min INTEGER DEFAULT 5,
        pet_max INTEGER DEFAULT 15,
        pet_cooldown INTEGER DEFAULT 12,
        snuggle_min INTEGER DEFAULT 30,
        snuggle_max INTEGER DEFAULT 60,
        snuggle_cooldown INTEGER DEFAULT 60,
        pick_min INTEGER DEFAULT 5,
        pick_max INTEGER DEFAULT 15,
        pick_cooldown INTEGER DEFAULT 12,
        coinflip_duration INTEGER DEFAULT 30
    )
`).run();

// Migration: เพิ่มคอลัมน์ currency_symbol และ coinflip_duration ให้กับตารางเก่า
try { db.prepare('ALTER TABLE server_settings ADD COLUMN currency_symbol TEXT DEFAULT "🍩"').run(); } catch (e) { /* คอลัมน์มีอยู่แล้ว */ }
try { db.prepare('ALTER TABLE server_settings ADD COLUMN pick_min INTEGER DEFAULT 5').run(); } catch (e) { /* คอลัมน์มีอยู่แล้ว */ }
try { db.prepare('ALTER TABLE server_settings ADD COLUMN pick_max INTEGER DEFAULT 15').run(); } catch (e) { /* คอลัมน์มีอยู่แล้ว */ }
try { db.prepare('ALTER TABLE server_settings ADD COLUMN pick_cooldown INTEGER DEFAULT 12').run(); } catch (e) { /* คอลัมน์มีอยู่แล้ว */ }
try { db.prepare('ALTER TABLE server_settings ADD COLUMN coinflip_duration INTEGER DEFAULT 30').run(); } catch (e) { /* คอลัมน์มีอยู่แล้ว */ }

function getSettings(guildId) {
    let settings = db.prepare('SELECT * FROM server_settings WHERE guildId = ?').get(guildId);
    if (!settings) {
        db.prepare(`
            INSERT INTO server_settings (
                guildId,
                currency_symbol,
                pet_min, pet_max, pet_cooldown,
                snuggle_min, snuggle_max, snuggle_cooldown,
                pick_min, pick_max, pick_cooldown,
                coinflip_duration
            )
            VALUES (?, ?, 5, 15, 12, 30, 60, 60, 5, 15, 12, 30)
        `).run(guildId, '🍩');

        settings = {
            guildId,
            currency_symbol: '🍩',
            pet_min: 5, pet_max: 15, pet_cooldown: 12,
            snuggle_min: 30, snuggle_max: 60, snuggle_cooldown: 60,
            pick_min: 5, pick_max: 15, pick_cooldown: 12,
            coinflip_duration: 30
        };
    }
    return settings;
}

function getGuildCurrencySymbol(guildId) {
    const settings = getSettings(guildId);
    return settings.currency_symbol || process.env.CURRENCY_SYMBOL || '🍩';
}

function updateGuildCurrencySymbol(guildId, symbol) {
    const normalized = (symbol || '').trim();
    const value = normalized || '🍩';
    db.prepare('INSERT OR IGNORE INTO server_settings (guildId, currency_symbol) VALUES (?, ?)').run(guildId, value);
    db.prepare('UPDATE server_settings SET currency_symbol = ? WHERE guildId = ?').run(value, guildId);
    return value;
}

// ===== Pet Roles Management =====
db.prepare(`
    CREATE TABLE IF NOT EXISTS pet_roles (
        guildId TEXT NOT NULL,
        roleId TEXT NOT NULL,
        petName TEXT NOT NULL,
        petEmoji TEXT DEFAULT '🐾',
        PRIMARY KEY (guildId, roleId)
    )
`).run();

function getPetRoles(guildId) {
    const roles = db.prepare('SELECT roleId, petName, petEmoji FROM pet_roles WHERE guildId = ? ORDER BY rowid').all(guildId);
    return roles || [];
}

function addPetRole(guildId, roleId, petName, petEmoji = '🐾') {
    try {
        db.prepare('INSERT INTO pet_roles (guildId, roleId, petName, petEmoji) VALUES (?, ?, ?, ?)').run(guildId, roleId, petName, petEmoji);
        return true;
    } catch (e) {
        // Role already exists
        return false;
    }
}

function removePetRole(guildId, roleId) {
    const result = db.prepare('DELETE FROM pet_roles WHERE guildId = ? AND roleId = ?').run(guildId, roleId);
    return result.changes > 0;
}

function hasPetRole(guildId, roleId) {
    return db.prepare('SELECT 1 FROM pet_roles WHERE guildId = ? AND roleId = ?').get(guildId, roleId) !== undefined;
}

// ===== Coinflip Session (In-Memory) =====
// sessionId -> { hostId, guildId, channelId, messageId, duration, endsAt, bets: Map<userId, {side, amount}>, timer, resolved }
const activeCoinflipSessions = new Map();

function createCoinflipSession(sessionId, data) {
    activeCoinflipSessions.set(sessionId, {
        ...data,
        bets: new Map(),
        resolved: false
    });
}

function getCoinflipSession(sessionId) {
    return activeCoinflipSessions.get(sessionId) || null;
}

function addCoinflipBet(sessionId, userId, side, amount) {
    const session = activeCoinflipSessions.get(sessionId);
    if (!session) return false;
    if (session.resolved) return false;
    if (session.bets.has(userId)) return false; // ห้ามเดิมพันซ้ำ
    session.bets.set(userId, { side, amount });
    return true;
}

function resolveCoinflipSession(sessionId) {
    const session = activeCoinflipSessions.get(sessionId);
    if (!session || session.resolved) return null;
    session.resolved = true;
    return session;
}

function deleteCoinflipSession(sessionId) {
    activeCoinflipSessions.delete(sessionId);
}

// ดึงเวลา Cooldown ของผู้ใช้
function getUserCooldowns(userId) {
    let cooldowns = db.prepare('SELECT * FROM user_cooldowns WHERE userId = ?').get(userId);
    if (!cooldowns) {
        db.prepare('INSERT INTO user_cooldowns (userId, nextPick, nextPet, nextSnuggle) VALUES (?, 0, 0, 0)').run(userId);
        cooldowns = { userId, nextPick: 0, nextPet: 0, nextSnuggle: 0 };
    }
    return cooldowns;
}

// Graceful database close
function closeDatabase() {
    try {
        db.close();
        console.log('[DB] Database connection closed gracefully');
    } catch (err) {
        console.error('[DB] Error closing database:', err.message);
    }
}

module.exports = {
    getUser,
    updateBalance,
    addPoints,
    setNextPickTime,
    setNextPetTime,
    setNextSnuggleTime,
    getSettings,
    getGuildCurrencySymbol,
    updateGuildCurrencySymbol,
    getPetRoles,
    addPetRole,
    removePetRole,
    hasPetRole,
    createCoinflipSession,
    getCoinflipSession,
    addCoinflipBet,
    resolveCoinflipSession,
    deleteCoinflipSession,
    db,
    getUserCooldowns,
    closeDatabase
};