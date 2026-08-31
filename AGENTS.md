# Kawaii Bot - Agent Instructions

## Project Overview

**Kawaii Bot** is a Discord bot built with [discord.js v14](https://discord.js.org/) and [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) that provides an economy/currency system with interactive pet mechanics for Discord servers. The bot uses **Thai language** throughout its codebase and user-facing text.

## Architecture

### Core Files

| File | Purpose |
|------|---------|
| [index.js](index.js) | Bot startup and initialization. Loads all commands and events dynamically. |
| [config.js](config.js) | Environment-based configuration (token, IDs, database path, currency symbol). |
| [database.js](database.js) | SQLite database management, user data, cooldowns, and guild settings. |
| [deploy-commands.js](deploy-commands.js) | (Stub) Command registration with Discord. |
| [package.json](package.json) | Dependencies: discord.js, better-sqlite3, dotenv. |

### Directory Structure

- **`commands/`** — Slash commands. Each file exports `{ data, execute }`.
- **`events/`** — Event handlers (ready, messageCreate, interactionCreate, welcome). Each file exports `{ name, once?, execute }`.
- **`tests/`** — Unit tests (currently minimal).

## Key Conventions

### Command Format

All command files in `commands/` must export:

```javascript
module.exports = {
    data: new SlashCommandBuilder()
        .setName('command-name')
        .setDescription('Description in Thai'),
    async execute(interaction) {
        // Handle the command
    }
};
```

**Auto-loading**: Commands are discovered and registered at startup by [index.js](index.js#L21-L31). No manual registration needed.

### Event Format

All event files in `events/` must export:

```javascript
module.exports = {
    name: Events.EventName,  // e.g., Events.InteractionCreate
    once: false,             // Optional; set true for one-time events
    async execute(...args, client) {
        // Handle the event
    }
};
```

**Auto-loading**: Events are wired at startup by [index.js](index.js#L35-L47).

### Database Patterns

The bot uses **three core tables**:

1. **`users`** — User balances:
   - `userId` (PRIMARY KEY)
   - `balance` — Wallet/on-hand currency
   - `bank` — Bank savings

2. **`user_cooldowns`** — Cooldown tracking:
   - `userId` (PRIMARY KEY)
   - `nextPick`, `nextPet`, `nextSnuggle` — Unix timestamps (milliseconds)

3. **`pet_roles`** — Pet roles per guild (dynamic configuration):
   - `guildId`, `roleId` (COMPOSITE PRIMARY KEY)
   - `petName` — Display name (e.g., "น้องหมา", "น้องแมว")
   - `petEmoji` — Display emoji (e.g., "🐶", "🐱")

**Helper functions** in [database.js](database.js):
- `getUser(userId)` — Fetch or create user record
- `updateBalance(userId, amount)` — Add/subtract wallet balance
- `addPoints(userId, amount)` — Alias for updateBalance
- `setNextPetTime(userId, timestamp)` — Set pet cooldown
- `getSettings(guildId)` — Fetch guild-specific settings (cooldowns, currency symbol)
- `getGuildCurrencySymbol(guildId)` — Get per-guild currency emoji
- **`getPetRoles(guildId)`** — Get all pet roles for a guild
- **`addPetRole(guildId, roleId, petName, petEmoji)`** — Add a pet role
- **`removePetRole(guildId, roleId)`** — Remove a pet role
- **`hasPetRole(guildId, roleId)`** — Check if role is a pet role

Use these functions; do not write raw SQL except for migrations.

## Configuration

See [config.js](config.js). Environment variables (`.env` or runtime):

```
DISCORD_TOKEN        - Bot token from Discord Developer Portal
CLIENT_ID            - Bot's application ID
GUILD_ID             - Target server ID
DB_PATH              - Path to SQLite database (default: economy.db)
CURRENCY_SYMBOL      - Currency emoji (default: 🍩)
BOT_NAME             - Bot display name (default: Kawaii Bot)
NODE_ENV             - development or production
```

**Load order**: `dotenv` loads `.env` at startup ([config.js](config.js#L1)).

## Common Development Tasks

### Managing Pet Roles (Admin)

Use `/admin-pet-roles` to manage pet roles for the server:

1. **Add a Pet Role**:
   - Click the role dropdown
   - Select the role you want to add as a pet role
   - Fill in the modal with:
     - `Pet Name` (required): Name displayed to users (e.g., "น้องหมา", "น้องแมว")
     - `Pet Emoji` (optional): Emoji to display (default: 🐾)
   - Role is saved to database and shown in `/balance` command

2. **Remove a Pet Role**:
   - Click "➖ Remove Pet Role" button
   - Select the pet role from the dropdown
   - Confirm the deletion

**Database**: Pet roles are stored per-guild in the `pet_roles` table. Each role can be used across multiple servers with different names/emojis.

### Adding a New Command

1. Create `commands/mycommand.js`:
   ```javascript
   const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
   const { getUser, getGuildCurrencySymbol } = require('../database.js');

   module.exports = {
       data: new SlashCommandBuilder()
           .setName('mycommand')
           .setDescription('Description in Thai'),
       async execute(interaction) {
           const user = getUser(interaction.user.id);
           await interaction.reply({ content: '...' });
       }
   };
   ```

2. Restart the bot. The command is auto-loaded.

### Adding a New Event

1. Create `events/myevent.js`:
   ```javascript
   const { Events } = require('discord.js');

   module.exports = {
       name: Events.MessageCreate,
       once: false,
       async execute(message, client) {
           if (message.author.bot) return;
           // Handle event
       }
   };
   ```

2. Restart the bot. The event is auto-wired.

### Modifying Database Schema

1. Add migration code in [database.js](database.js) after table creation (see existing `ALTER TABLE` examples).
2. Use try-catch to handle existing columns gracefully.
3. Test with a fresh database to ensure new users get the schema correct.

### Currency and Cooldowns

- **Currency symbol** is per-guild and configurable via guild settings (see [database.js](database.js)).
- **Cooldowns** are stored as Unix timestamps (milliseconds) in `user_cooldowns`. Check with `Date.now()`.
- **Helper function** `formatRemaining(ms)` in commands formats remaining cooldown time in Thai.

## Language & Localization

- **All user-facing text should be in Thai**, including embed descriptions, error messages, and command descriptions.
- Comments can be in Thai or English; Thai is preferred for consistency.
- Example: `"นั่นเร็วเกินไป! กรุณารอ" + formatRemaining(remaining)` ← Thai error message

## Testing & Debugging

- **Unit tests** are in `tests/`. Currently minimal; expand as needed.
- **Local testing**: Use `.env.dev` or test server guild ID to avoid polluting production.
- **Enable debug logging** in [index.js](index.js) by uncommenting or adding `console.log` statements.
- **Database queries**: Test directly with better-sqlite3 REPL or add temporary test routes.

## Common Pitfalls

1. **Missing user in database**: Always call `getUser()` before accessing balance; it auto-creates missing users.
2. **Timezone issues**: Cooldowns use `Date.now()` (UTC). Ensure all timestamps are in milliseconds.
3. **Per-guild settings**: Always fetch settings via `getSettings(guildId)` for user-configurable values.
4. **Pet roles must be set up**: Admin must use `/admin-pet-roles` to add pet roles; hardcoded role IDs are no longer used.
5. **Thai language bugs**: Test with Thai text in embeds and buttons; some Unicode rendering issues can occur in Windows terminals.
6. **Pet role uniqueness**: Each `(guildId, roleId)` pair must be unique; attempting to add the same role twice will fail silently.

## Deployment

- **Docker**: `Dockerfile` and `docker-compose.yml` are present; see them for container build/run commands.
- **Environment**: Set `NODE_ENV=production` and all required `.env` vars before running.
- **Database**: Ensure `DB_PATH` points to a persistent volume if containerized.

## Links & Resources

- [discord.js Documentation](https://discord.js.org/)
- [Discord API Docs](https://discord.com/developers/docs)
- [better-sqlite3 Docs](https://github.com/WiseLibs/better-sqlite3)
- Codebase entry point: [index.js](index.js)
