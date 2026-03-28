













const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");


try { require("dotenv").config(); } catch {}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
if (!DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN env var.");
  process.exit(1);
}


const login = require("@dongdev/fca-unofficial");


const FB_ENTRY = path.join(__dirname, "index.js");
const APPSTATE_FILE = path.join(__dirname, "appstate.json");
const BACKUP_DIR = path.join(__dirname, "appstate_backups");
const STATE_FILE = path.join(__dirname, "controller_state.json");

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });


function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}
function saveState(s) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
  } catch {}
}
const state = loadState();


async function fetchText(url) {
  if (typeof fetch === "function") {
    const r = await fetch(url);
    return await r.text();
  }
  
  const nodeFetch = require("node-fetch");
  const r = await nodeFetch(url);
  return await r.text();
}


function nowStamp() {
  
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

function isAdminInteraction(interaction) {
  
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

function rememberNotifyTarget(interaction) {
  state.notifyGuildId = interaction.guildId;
  state.notifyChannelId = interaction.channelId;
  state.lastAdminUserId = interaction.user?.id;
  saveState(state);
}


let client = null;

async function notify(text) {
  try {
    if (!client?.isReady()) return;

    const guildId = state.notifyGuildId;
    const channelId = state.notifyChannelId;

    if (guildId && channelId) {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (channel && "send" in channel) {
        await channel.send(text.slice(0, 1800)).catch(() => {});
      }
    }
  } catch {}
}


let fbProc = null;
let fbStartedAt = null;
let restarting = false;
let replaceLock = false;

const MIN_RUNTIME_MS = 60_000;       
const RESTART_DELAY_MS = 5_000;      

function isFbRunning() {
  return !!fbProc;
}

function startFbBot() {
  if (fbProc) return;

  if (!fs.existsSync(FB_ENTRY)) {
    console.error(`FB entry not found: ${FB_ENTRY}`);
    return;
  }

  fbProc = spawn(process.execPath, [FB_ENTRY], {
    stdio: "inherit",
    env: process.env,
  });

  fbStartedAt = Date.now();
  notify("🟢 FB bot started.").catch(() => {});

  fbProc.on("exit", (code, signal) => {
    const ranFor = fbStartedAt ? (Date.now() - fbStartedAt) : 0;

    fbProc = null;
    fbStartedAt = null;

    
    void handleFbExit(code, signal, ranFor);
  });
}

function stopFbBot() {
  if (!fbProc) return;

  try {
    fbProc.kill("SIGINT");
  } catch {}

  
  const killTimer = setTimeout(() => {
    try { fbProc?.kill("SIGKILL"); } catch {}
  }, 4000);

  killTimer.unref?.();
}

function restartFbBot(reason = "manual restart") {
  if (restarting) return;
  restarting = true;

  notify(`🔄 Restarting FB bot (${reason})...`).catch(() => {});

  stopFbBot();
  setTimeout(() => {
    startFbBot();
    restarting = false;
  }, 1500);
}

async function handleFbExit(code, signal, ranForMs) {
  await notify(`🔴 FB bot stopped (code=${code ?? "?"}, signal=${signal ?? "?"}, ran=${Math.round(ranForMs / 1000)}s).`);

  
  if (restarting) return;

  
  if (ranForMs < MIN_RUNTIME_MS) {
    const probe = await probeAppStateFromDisk(12_000);
    if (!probe.ok) {
      await notify(`⚠️ Not auto-restarting: appstate probe failed (**${probe.reason}**). Use /replace with a fresh appstate.json.`);
      return;
    }
  }

  
  setTimeout(() => startFbBot(), RESTART_DELAY_MS);
}


function loadAppStateFromDisk() {
  try {
    const raw = fs.readFileSync(APPSTATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function looksLikeAppStateArray(v) {
  return Array.isArray(v) && v.length > 0;
}

function probeAppState(appState, timeoutMs = 12000) {
  
  
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ ok: false, reason: "timeout" });
    }, timeoutMs);

    try {
      login({ appState }, (err, api) => {
        if (done) return;
        clearTimeout(t);
        done = true;

        if (err) {
          const reason = (err?.error || err?.message || String(err)).slice(0, 180);
          resolve({ ok: false, reason });
          return;
        }

        
        try { api?.logout?.(); } catch {}
        resolve({ ok: true, reason: "ok" });
      });
    } catch (e) {
      clearTimeout(t);
      resolve({ ok: false, reason: (e?.message || String(e)).slice(0, 180) });
    }
  });
}

async function probeAppStateFromDisk(timeoutMs = 12000) {
  const appState = loadAppStateFromDisk();
  if (!looksLikeAppStateArray(appState)) {
    return { ok: false, reason: "missing/invalid appstate.json" };
  }
  return await probeAppState(appState, timeoutMs);
}


function backupAppStateIfExists() {
  if (!fs.existsSync(APPSTATE_FILE)) return null;
  const backupPath = path.join(BACKUP_DIR, `appstate.${nowStamp()}.json`);
  fs.copyFileSync(APPSTATE_FILE, backupPath);
  return backupPath;
}

function writeAppStateAtomic(jsonObj) {
  const tmp = `${APPSTATE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(jsonObj, null, 2));
  fs.renameSync(tmp, APPSTATE_FILE);
}


async function registerCommandsEverywhere() {
  const commands = [
    new SlashCommandBuilder()
      .setName("uptime")
      .setDescription("Show uptime of controller + FB bot"),

    new SlashCommandBuilder()
      .setName("status")
      .setDescription("Check if current appstate.json still works")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName("restart")
      .setDescription("Restart the FB bot process")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName("replace")
      .setDescription("Replace appstate.json (upload file or paste JSON) + restart FB bot")
      .addAttachmentOption(opt =>
        opt.setName("file").setDescription("Upload appstate.json").setRequired(false)
      )
      .addStringOption(opt =>
        opt.setName("json").setDescription("Paste appState JSON (small only; attachment recommended)").setRequired(false)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  ].map(c => c.toJSON());

  
  const guilds = await client.guilds.fetch();
  for (const [guildId] of guilds) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) continue;
    await guild.commands.set(commands).catch(() => {});
  }
}

async function main() {
  client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on("ready", async () => {
    console.log(`✅ Controller online as ${client.user.tag}`);

    await registerCommandsEverywhere();
    await notify("✅ Controller online. Use /status /replace /restart /uptime.");

    
    startFbBot();
  });

  client.on("guildCreate", async () => {
    
    await registerCommandsEverywhere().catch(() => {});
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const cmd = interaction.commandName;

    if (cmd === "uptime") {
      const controllerUp = formatUptime(process.uptime() * 1000);
      const fbUp = fbStartedAt ? formatUptime(Date.now() - fbStartedAt) : "not running";
      return interaction.reply({
        content: `🟦 Controller uptime: **${controllerUp}**\n🟩 FB bot uptime: **${fbUp}**`,
        ephemeral: true,
      });
    }

    
    if (!isAdminInteraction(interaction)) {
      return interaction.reply({ content: "Not allowed.", ephemeral: true });
    }
    rememberNotifyTarget(interaction);

    if (cmd === "status") {
      await interaction.deferReply({ ephemeral: true });

      const running = isFbRunning();
      const probe = await probeAppStateFromDisk(12_000);

      let msg = `FB bot process: **${running ? "running" : "not running"}**\n`;
      msg += `appstate.json probe: **${probe.ok ? "VALID" : "INVALID"}**`;
      if (!probe.ok) msg += `\nReason: \`${probe.reason}\``;

      return interaction.editReply(msg);
    }

    if (cmd === "restart") {
      restartFbBot("requested via /restart");
      return interaction.reply({ content: "🔄 Restarting FB bot now.", ephemeral: true });
    }

    if (cmd === "replace") {
      if (replaceLock) {
        return interaction.reply({ content: "⏳ Another /replace is in progress. Try again in a moment.", ephemeral: true });
      }
      replaceLock = true;

      try {
        await interaction.deferReply({ ephemeral: true });

        const file = interaction.options.getAttachment("file");
        const jsonStr = interaction.options.getString("json");

        if (!file && !jsonStr) {
          return interaction.editReply("❌ Provide either an uploaded file (`file`) or pasted JSON (`json`). Upload is recommended.");
        }

        let parsed;
        if (file) {
          const text = await fetchText(file.url);
          parsed = JSON.parse(text);
        } else {
          parsed = JSON.parse(jsonStr);
        }

        if (!looksLikeAppStateArray(parsed)) {
          return interaction.editReply("❌ That JSON doesn’t look like a valid appState array.");
        }

        const backupPath = backupAppStateIfExists();
        writeAppStateAtomic(parsed);

        
        const probe = await probeAppState(parsed, 12_000);
        if (!probe.ok) {
          
          if (backupPath && fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, APPSTATE_FILE);
          }
          return interaction.editReply(`❌ New appstate probe failed: \`${probe.reason}\`\n(Backup restored.)`);
        }

        restartFbBot("appstate replaced");
        const backupMsg = backupPath ? `Backup saved: \`${path.basename(backupPath)}\`` : "No previous appstate to back up.";
        return interaction.editReply(`✅ appstate.json replaced + verified.\n${backupMsg}\n🔄 FB bot restarting.`);
      } catch (e) {
        const msg = (e?.message || String(e)).slice(0, 180);
        return interaction.editReply(`❌ Replace failed: \`${msg}\``);
      } finally {
        replaceLock = false;
      }
    }
  });

  client.login(DISCORD_TOKEN);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
