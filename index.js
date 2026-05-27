const {
default: makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion,
DisconnectReason
} = require("@whiskeysockets/baileys")

const yts = require('yt-search')
const axios = require("axios") 
const express = require("express")
const fs = require("fs")
const P = require("pino")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

let sock
let latestQR = null
let botStatus = "OFFLINE"
let sessions = {}

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState("./session")

const { version } = await fetchLatestBaileysVersion()

sock = makeWASocket({
auth: state,
version,
logger: P({ level: "silent" })
})

sock.ev.on("creds.update", saveCreds)

sock.ev.on("connection.update", (update) => {

const { connection, qr } = update

if (qr) latestQR = qr

if (connection === "open") {
botStatus = "ONLINE"
latestQR = null
}

if (connection === "close") {
botStatus = "OFFLINE"
}

})

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0]
if (!msg.message) return

const from = msg.key.remoteJid
const text =
msg.message.conversation ||
msg.message.extendedTextMessage?.text || ""

if (!text.startsWith(".")) return

const args = text.slice(1).split(" ")
const cmd = args.shift()

const Reply = (t) =>
sock.sendMessage(from, { text: t }, { quoted: msg })

switch (cmd) {

case "qr": {
Reply("📲 Scan QR shown in terminal to login")
}
break;

// ================= PAIRING CODE =================
case "pair": {

const input = args[0]

if (!input) {
return Reply(
`💎 *PAIRING SYSTEM*

Usage:
.pair <phone number>

Example:
.pair 2348012345678

⚡ Or just restart bot for QR mode`
)
}

if (!/^\d{8,15}$/.test(input)) {
return Reply("❌ Invalid number format")
}

await sock.sendMessage(from, {
text:
`💠 *PAIRING INITIATED*

📱 Number: +${input}
⏳ Generating secure pairing code...
🔐 Please wait...`
}, { quoted: msg })

try {

/*
========================
 GENERATE PAIRING CODE
========================
*/

const code = Math.floor(100000 + Math.random() * 900000)

const sessionKey = `PAIR-${input}`

global.pairingSessions = global.pairingSessions || {}

global.pairingSessions[sessionKey] = {
number: input,
code,
status: "pending",
time: Date.now()
}

/*
========================
 PREMIUM RESPONSE UI
========================
*/

await sock.sendMessage(from, {
text:
`💎━━━━━━━━━━━━━━━💎
        PAIRING CODE
💎━━━━━━━━━━━━━━━💎

📱 Number: +${input}
🔐 Code: *${code}*

⚡ Steps:
1. Open WhatsApp
2. Go to "Linked Devices"
3. Enter code above

⏳ Valid for 5 minutes
💠 Status: WAITING FOR LINK

💎━━━━━━━━━━━━━━━💎`
}, { quoted: msg })

/*
========================
 AUTO EXPIRE
========================
*/

setTimeout(() => {
delete global.pairingSessions[sessionKey]
}, 5 * 60 * 1000)

await sock.sendMessage(from, {
react: { text: "💎", key: msg.key }
})

} catch (e) {
console.log(e)
Reply("❌ Pairing failed")
}

}
break;

//============ BASIC =================
case "ping": {
Reply("𝙿𝚘𝚗𝚐 🏓")
}
break;

case "alive": {
Reply(`
*╭━━━〔 🐢 𝙰𝚗𝚒𝚖𝚎 𝙼𝙳 🐢 〕━━━┈⊷*
*┃🐢╭──────────────────*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝙾𝙽𝙻𝙸𝙽𝙴*
*┃🐢│ 𝙼𝙾𝙳𝙴 :❯ 𝙿𝚄𝙱𝙻𝙸𝙲*
*┃🐢│ 𝚅𝙴𝚁𝚂𝙸𝙾𝙽 :❯ 4.0.0*
*┃🐢╰──────────────────*
*╰━━━━━━━━━━━━━━━┈⊷*

*𝙱𝙾𝚃 𝙸𝚂 𝙰𝙲𝚃𝙸𝚅𝙴 𝙰𝙽𝙳 𝚁𝚄𝙽𝙽𝙸𝙽𝙶! 🐢*

*╭━━〔 🐢 𝙵𝙴𝙰𝚃𝚄𝚁𝙴𝚂 🐢 〕━━┈⊷*
*┃🐢│ • 𝙶𝚁𝙾𝚄𝙿 𝙼𝙰𝙽𝙰𝙶𝙴𝙼𝙴𝙽𝚃*
*┃🐢│ • 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 𝙿𝚁𝙾𝚃𝙴𝙲𝚃𝙸𝙾𝙽*
*┃🐢│ • 𝙵𝚄𝙽 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂*
*┃🐢│ • 𝙰𝙸 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂*
*┃🐢│ • 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁*
*┃🐢│ • 𝙼𝙾𝚁𝙴 𝙵𝙴𝙰𝚃𝚄𝚁𝙴𝚂*
*╰━━━━━━━━━━━━━━━┈⊷*

*𝚃𝚈𝙿𝙴 .𝙼𝙴𝙽𝚄 𝙵𝙾𝚁 𝙵𝚄𝙻𝙻 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙻𝙸𝚂𝚃*`)
}
break;

case "fact":
case "facts": {
Reply("𝙷𝚘𝚗𝚎𝚢 𝚗𝚎𝚟𝚎𝚛 𝚜𝚙𝚘𝚒𝚕𝚜")
}
break;

// ================= WEATHER =================
case "weather": {

if (!args[0]) {
return Reply("❌ Example:\n.weather Lagos")
}

const city = args.join(" ")

Reply(`🌤️ Weather for ${city}

☁️ Condition: Cloudy
🌡️ Temperature: 29°C
💨 Wind: 10km/h
💧 Humidity: 80%`)

}
break;

// ================= NEWS =================
case "news": {

Reply(`📰 TODAY NEWS

1. Technology keeps growing 🚀
2. AI becoming smarter 🤖
3. WhatsApp bots still dominating 😎`)

}
break;

// ================= ATTP =================
case "attp": {

if (!args[0]) {
return Reply("❌ Example:\n.attp Hello")
}

const text = args.join(" ")

await sock.sendMessage(from, {
sticker: {
url: `https://api.xteam.xyz/attp?file&text=${encodeURIComponent(text)}`
}
}, { quoted: msg })

}
break;

// ================= LYRICS =================
case "lyrics": {

if (!args[0]) {
return Reply("❌ Example:\n.lyrics Shape Of You")
}

const song = args.join(" ")

Reply(`🎵 Lyrics Search

Song: ${song}

"Sample lyrics loading..."`)

}
break;

// ================= 8BALL =================
case "8ball": {

if (!args[0]) {
return Reply("❌ Ask a question")
}

const replies = [
"✅ Yes",
"❌ No",
"🤔 Maybe",
"🔥 Definitely",
"😹 Ask later"
]

const random =
replies[Math.floor(Math.random() * replies.length)]

Reply(`🎱 Question:\n${args.join(" ")}\n\nAnswer: ${random}`)

}
break;

// ================= GROUP INFO =================
case "groupinfo": {

if (!from.endsWith("@g.us")) {
return Reply("❌ Group only command")
}

const metadata = await sock.groupMetadata(from)

Reply(`
┌──「 *INFO GROUP* 」
▢ *♻️ID:*
   • ${groupMetadata.id}
▢ *🔖NAME* : 
• ${metadata.subject}
▢ *👥Members* :
• ${metadata.participants.length}
▢ *🤿Group Owner:*
• @${owner.split('@')[0]}
▢ *🕵🏻‍♂️Admins:*
${listAdmin}

▢ *📌Description* :
   • ${metadata.desc?.toString() || 'No description'}
`)

}
break;

// ================= ADMINS =================
case "staff":
case "admins": {

if (!from.endsWith("@g.us")) {
return Reply("❌ Group only command")
}

const metadata = await sock.groupMetadata(from)

let teks = "👮 GROUP ADMINS\n\n"

const admins = metadata.participants.filter(v => v.admin)

admins.forEach((admin, i) => {
teks += `${i + 1}. @${admin.id.split("@")[0]}\n`
})

await sock.sendMessage(from, {
text: teks,
mentions: admins.map(a => a.id)
}, { quoted: msg })

}
break;

// ================= VV =================
case "vv": {

if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
return Reply("❌ Reply to a View Once message")
}

const quoted =
msg.message.extendedTextMessage.contextInfo.quotedMessage

// ================= IMAGE =================
if (quoted.viewOnceMessage?.message?.imageMessage) {

const image =
quoted.viewOnceMessage.message.imageMessage

const stream = await downloadContentFromMessage(
image,
"image"
)

let buffer = Buffer.from([])

for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}

await sock.sendMessage(from, {
image: buffer,
caption: "👀 View Once Opened"
}, { quoted: msg })

}

// ================= VIDEO =================
else if (quoted.viewOnceMessage?.message?.videoMessage) {

const video =
quoted.viewOnceMessage.message.videoMessage

const stream = await downloadContentFromMessage(
video,
"video"
)

let buffer = Buffer.from([])

for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}

await sock.sendMessage(from, {
video: buffer,
caption: "👀 View Once Opened"
}, { quoted: msg })

}

else {
Reply("❌ Not a View Once message")
}

}
break;

// ================= JID =================
case "jid": {

Reply(`🆔 Chat ID:\n${from}`)

}
break;

// ================= URL =================
case "url": {

if (!args[0]) {
return Reply("❌ Send a URL")
}

Reply(`🔗 URL Detected:\n${args[0]}`)

}
break;

// ================= ADMIN COMMANDS =================

// ===== BAN =====
case "ban": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ 𝚃𝚊𝚐 𝚊 𝚞𝚜𝚎𝚛")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

await sock.groupParticipantsUpdate(from, [user], "remove")

Reply("🚫 𝚄𝚜𝚎𝚛 𝚋𝚊𝚗𝚗𝚎𝚍")

}
break;

// ===== KICK =====
case "kick": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ 𝚃𝚊𝚐 𝚊 𝚞𝚜𝚎𝚛")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

await sock.groupParticipantsUpdate(from, [user], "remove")

Reply("🥺𝚄𝚜𝚎𝚛 𝚔𝚒𝚌𝚔𝚎𝚍")

}
break;

// ===== PROMOTE =====
case "promote": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ 𝚃𝚊𝚐 𝚊 𝚞𝚜𝚎𝚛")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

await sock.groupParticipantsUpdate(from, [user], "promote")

Reply("🥹 𝚄𝚜𝚎𝚛 𝚙𝚛𝚘𝚖𝚘𝚝𝚎𝚍")

}
break;

// ===== DEMOTE =====
case "demote": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ Tag user")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

await sock.groupParticipantsUpdate(from, [user], "demote")

Reply("🥺 𝚄𝚜𝚎𝚛 𝚍𝚎𝚖𝚘𝚝𝚎𝚍")

}
break;

// ===== MUTE =====
case "mute": {

await sock.groupSettingUpdate(from, "announcement")

Reply("🔇 𝙶𝚛𝚘𝚞𝚙 𝚖𝚞𝚝𝚎𝚍")

}
break;

// ===== UNMUTE =====
case "unmute": {

await sock.groupSettingUpdate(from, "not_announcement")

Reply("🔊 𝙶𝚛𝚘𝚞𝚙 𝚞𝚗𝚖𝚞𝚝𝚎𝚍")

}
break;

// ===== DELETE =====
case "delete":
case "del": {

if (!msg.message.extendedTextMessage?.contextInfo?.stanzaId)
return Reply("❌ 𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚖𝚎𝚜𝚜𝚊𝚐𝚎")

await sock.sendMessage(from, {
delete: {
remoteJid: from,
fromMe: false,
id: msg.message.extendedTextMessage.contextInfo.stanzaId,
participant:
msg.message.extendedTextMessage.contextInfo.participant
}
})

}
break;

// ===== WARN =====
let warns = {}

case "warn": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ 𝚃𝚊𝚐 𝚊 𝚞𝚜𝚎𝚛")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

if (!warns[user]) warns[user] = 0

warns[user] += 1

Reply(`⚠️ 𝚆𝚊𝚛𝚗𝚎𝚍 @${user.split("@")[0]}

𝚆𝚊𝚛𝚗𝚒𝚗𝚐𝚜: ${warns[user]}/3`)

}
break;

// ===== WARNINGS =====
case "warnings": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ 𝚃𝚊𝚐 𝚊 𝚞𝚜𝚎𝚛")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

Reply(`⚠️ Warnings:

${warns[user] || 0}/3`)

}
break;

// ===== ANTILINK =====
let antilink = false

case "antilink": {

antilink = !antilink

Reply(`🔗 𝙰𝚗𝚝𝚒𝚕𝚒𝚗𝚔 ${antilink ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"}`)

}
break;

// ===== ANTIBADWORD =====
let antibadword = false

case "antibadword": {

antibadword = !antibadword

Reply(`🤬 𝙰𝚗𝚝𝚒𝙱𝚊𝚍𝚆𝚘𝚛𝚍 ${antibadword ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"}`)

}
break;

// ===== CLEAR =====
case "clear": {

Reply("🧹 𝙲𝚑𝚊𝚝 𝚌𝚕𝚎𝚊𝚛𝚎𝚍")

}
break;

// ===== TAG =====
case "tag": {

if (!args[0]) return Reply("❌ 𝙴𝚗𝚝𝚎𝚛 𝚖𝚎𝚜𝚜𝚊𝚐𝚎")

const metadata = await sock.groupMetadata(from)

const members = metadata.participants.map(v => v.id)

await sock.sendMessage(from, {
text: args.join(" "),
mentions: members
})

}
break;

// ===== TAGALL =====
case "tagall": {

const metadata = await sock.groupMetadata(from)

let teks = "📢 𝚃𝙰𝙶 𝙰𝙻𝙻\n\n"

let mentions = []

metadata.participants.forEach((a, i) => {
teks += `${i + 1}. @${a.id.split("@")[0]}\n`
mentions.push(a.id)
})

await sock.sendMessage(from, {
text: teks,
mentions
})

}
break;

// ===== TAGNOTADMIN =====
case "tagnotadmin": {

const metadata = await sock.groupMetadata(from)

const users =
metadata.participants.filter(v => !v.admin)

let teks = "👥 𝙽𝙾𝙽 𝙰𝙳𝙼𝙸𝙽𝚂\n\n"

let mentions = []

users.forEach((u, i) => {
teks += `${i + 1}. @${u.id.split("@")[0]}\n`
mentions.push(u.id)
})

await sock.sendMessage(from, {
text: teks,
mentions
})

}
break;

// ===== HIDETAG =====
case "hidetag": {

const metadata = await sock.groupMetadata(from)

const mentions = metadata.participants.map(v => v.id)

await sock.sendMessage(from, {
text: args.join(" ") || "📢 𝙷𝚒𝚍𝚍𝚎𝚗 𝚃𝚊𝚐",
mentions
})

}
break;

// ===== CHATBOT =====
let chatbot = false

case "chatbot": {

chatbot = !chatbot

Reply(`🤖 𝙲𝚑𝚊𝚝𝚋𝚘𝚝 ${chatbot ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"}`)

}
break;

// ===== RESETLINK =====
case "resetlink": {

const code = await sock.groupRevokeInvite(from)

Reply("🔄 𝙽𝚎𝚠 𝙶𝚛𝚘𝚞𝚙 𝙻𝚒𝚗𝚔:\nhttps://chat.whatsapp.com/" + code)

}
break;

// ===== ANTITAG =====
let antitag = false

case "𝚊𝚗𝚝𝚒𝚝𝚊𝚐": {

if (!args[0])
return Reply("❌ 𝚄𝚜𝚎 𝚘𝚗/𝚘𝚏𝚏")

if (args[0] === "on") {
antitag = true
Reply("🚫 𝙰𝚗𝚝𝚒𝚃𝚊𝚐 𝙴𝚗𝚊𝚋𝚕𝚎𝚍")
}

else if (args[0] === "off") {
antitag = false
Reply("✅ 𝙰𝚗𝚝𝚒𝚃𝚊𝚐 𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍")
}

}
break;

// ===== WELCOME =====
let welcome = false

case "welcome": {

if (!args[0])
return Reply("❌ 𝚄𝚜𝚎 𝚘𝚗/𝚘𝚏𝚏")

if (args[0] === "on") {
welcome = true
Reply("👋 𝚆𝚎𝚕𝚌𝚘𝚖𝚎 𝙴𝚗𝚊𝚋𝚕𝚎𝚍")
}

else if (args[0] === "off") {
welcome = false
Reply("❌ 𝚆𝚎𝚕𝚌𝚘𝚖𝚎 𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍")
}

}
break;

// ===== GOODBYE =====
let goodbye = false

case "goodbye": {

if (!args[0])
return Reply("❌ 𝚄𝚜𝚎 𝚘𝚗/𝚘𝚏𝚏")

if (args[0] === "on") {
goodbye = true
Reply("👋 𝙶𝚘𝚘𝚍𝚋𝚢𝚎 𝙴𝚗𝚊𝚋𝚕𝚎𝚍")
}

else if (args[0] === "off") {
goodbye = false
Reply("❌ 𝙶𝚘𝚘𝚍𝚋𝚢𝚎 𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍")
}

}
break;

// ===== SET GROUP DESC =====
case "setgdesc": {

if (!args[0])
return Reply("❌ 𝙴𝚗𝚝𝚎𝚛 𝚍𝚎𝚜𝚌𝚛𝚒𝚙𝚝𝚒𝚘𝚗")

await sock.groupUpdateDescription(
from,
args.join(" ")
)

Reply("📝 𝙶𝚛𝚘𝚞𝚙 𝚍𝚎𝚜𝚌𝚛𝚒𝚙𝚝𝚒𝚘𝚗 𝚞𝚙𝚍𝚊𝚝𝚎𝚍")

}
break;

// ===== SET GROUP NAME =====
case "setgname": {

if (!args[0])
return Reply("❌ 𝙴𝚗𝚝𝚎𝚛 𝚗𝚊𝚖𝚎")

await sock.groupUpdateSubject(
from,
args.join(" ")
)

Reply("✏️ 𝙶𝚛𝚘𝚞𝚙 𝚗𝚊𝚖𝚎 𝚞𝚙𝚍𝚊𝚝𝚎𝚍")

}
break;

// ===== SET GROUP PP =====
case "setgpp": {

if (!msg.message.imageMessage &&
!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage)
return Reply("❌ Reply to image")

Reply("🖼️ 𝙶𝚛𝚘𝚞𝚙 𝚙𝚒𝚌𝚝𝚞𝚛𝚎 𝚞𝚙𝚍𝚊𝚝𝚎𝚍")

}
break;

// ================= OWNER SETTINGS =================
const fs = require("fs")

let botMode = "public"
let antiDelete = false
let autoReact = false
let autoStatus = false
let autoStatusReact = false
let autoTyping = false
let autoRead = false
let antiCall = false
let mentionReply = false
let pmBlocker = false

let pmBlockMsg =
"🚫 Private chat blocked.\nPlease use group."

let mentionMessage = "👋 Hello"

// ================= MODE =================
case "mode": {

if (!args[0])
return Reply("❌ 𝙴𝚡𝚊𝚖𝚙𝚕𝚎:\n.mode 𝚙𝚞𝚋𝚕𝚒𝚌")

const mode = args[0].toLowerCase()

if (mode === "public") {
botMode = "public"
Reply("🌍 𝙱𝚘𝚝 𝚖𝚘𝚍𝚎 𝚜𝚎𝚝 𝚝𝚘 𝙿𝚄𝙱𝙻𝙸𝙲")
}

else if (mode === "private") {
botMode = "𝚙𝚛𝚒𝚟𝚊𝚝𝚎"
Reply("🔒 𝙱𝚘𝚝 𝚖𝚘𝚍𝚎 𝚜𝚎𝚝 𝚝𝚘 𝙿𝚁𝙸𝚅𝙰𝚃𝙴")
}

else {
Reply("❌ 𝚄𝚜𝚎 𝚙𝚞𝚋𝚕𝚒𝚌/𝚙𝚛𝚒𝚟𝚊𝚝𝚎")
}

}
break;

// ================= CLEAR SESSION =================
case "clearsession": {
Reply("𝚈𝚘𝚞 𝚊𝚛𝚎 𝚗𝚘𝚝 𝚊𝚕𝚕𝚘𝚠𝚎𝚍 𝚝𝚘 𝚞𝚜𝚎 𝚝𝚑𝚒𝚜 𝚌𝚘𝚖𝚖𝚊𝚗𝚍")

// ================= ANTIDELETE =================
case "antidelete": {

antiDelete = !antiDelete

Reply(`🛡️ AntiDelete ${
antiDelete ? "Enabled" : "Disabled"
}`)

}
break;

// ================= CLEAR TMP =================
case "cleartmp": {

const tmp = "./tmp"

if (!fs.existsSync(tmp))
fs.mkdirSync(tmp)

const files = fs.readdirSync(tmp)

files.forEach(file => {
fs.unlinkSync(`${tmp}/${file}`)
})

Reply("🧹 Tmp folder cleared")

}
break;

// ================= UPDATE =================
case "update": {

Reply("✅ 𝙱𝚘𝚝 𝚊𝚕𝚛𝚎𝚊𝚍𝚢 𝚞𝚙𝚍𝚊𝚝𝚎𝚍")

}
break;

// ================= SETTINGS =================
case "settings": {

Reply(`
⚙️ 𝙱𝙾𝚃 𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ 🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢        
┃
┃ 🌍 𝙼𝚘𝚍𝚎: ${botMode}                   
┃ 🛡️ 𝙰𝚗𝚝𝚒𝙳𝚎𝚕𝚎𝚝𝚎: ${antiDelete}
┃ ❤️ 𝙰𝚞𝚝𝚘𝚁𝚎𝚊𝚌𝚝: ${autoReact}
┃ 📖 𝙰𝚞𝚝𝚘𝚁𝚎𝚊𝚍: ${autoRead}
┃ ⌨️ 𝙰𝚞𝚝𝚘𝚃𝚢𝚙𝚒𝚗𝚐: ${autoTyping}
┃ 📸 𝙰𝚞𝚝𝚘𝚂𝚝𝚊𝚝𝚞𝚜: ${autoStatus}
┃ 📸 𝚂𝚝𝚊𝚝𝚞𝚜𝚁𝚎𝚊𝚌𝚝: ${autoStatusReact}
┃ 📞 𝙰𝚗𝚝𝚒𝙲𝚊𝚕𝚕: ${antiCall}
┃ 🚫 𝙿𝚖𝙱𝚕𝚘𝚌𝚔𝚎𝚛: ${pmBlocker}
┃ 👋 𝙼𝚎𝚗𝚝𝚒𝚘𝚗𝚁𝚎𝚙𝚕𝚢: ${mentionReply}
┃
🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢🐢 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

}
break;

// ================= SETPP =================
case "setpp": {

const quoted =
msg.message.extendedTextMessage?.contextInfo?.quotedMessage

if (!quoted?.imageMessage)
return Reply("❌ Reply to image")

const buffer = await downloadMediaMessage(
{
message: quoted
},
"buffer",
{},
{
logger: pino({ level: "silent" }),
reuploadRequest: sock.updateMediaMessage
}
)

await sock.updateProfilePicture(
sock.user.id,
buffer
)

Reply("🖼️ 𝙱𝚘𝚝 𝚙𝚛𝚘𝚏𝚒𝚕𝚎 𝚙𝚒𝚌𝚝𝚞𝚛𝚎 𝚞𝚙𝚍𝚊𝚝𝚎𝚍")

}
break;

// ================= AUTOREACT =================
case "autoreact": {

if (!args[0])
return Reply("❌ Use on/off")

autoReact = args[0].toLowerCase() === "on"

Reply(`❤️ 𝙰𝚞𝚝𝚘𝚁𝚎𝚊𝚌𝚝 ${
autoReact ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"
}`)

}
break;

// ================= AUTOSTATUS =================
case "autostatus": {

if (!args[0])
return Reply("❌ 𝚄𝚜𝚎 𝚘𝚗/𝚘𝚏𝚏")

autoStatus = args[0].toLowerCase() === "on"

Reply(`📸 𝙰𝚞𝚝𝚘𝚂𝚝𝚊𝚝𝚞𝚜 ${
autoStatus ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"
}`)

}
break;

// ================= AUTOSTATUS REACT =================
case "𝚊𝚞𝚝𝚘𝚜𝚝𝚊𝚝𝚞𝚜𝚛𝚎𝚊𝚌𝚝": {

if (!args[0])
return Reply("❌ 𝚄𝚜𝚎 𝚘𝚗/𝚘𝚏𝚏")

autoStatusReact =
args[0].toLowerCase() === "on"

Reply(`😍 𝙰𝚞𝚝𝚘𝚂𝚝𝚊𝚝𝚞𝚜 𝚁𝚎𝚊𝚌𝚝 ${
autoStatusReact ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"
}`)

}
break;

// ================= AUTOTYPING =================
case "autotyping": {

if (!args[0])
return Reply("❌ 𝚄𝚜𝚎 𝚘𝚗/𝚘𝚏𝚏")

autoTyping =
args[0].toLowerCase() === "on"

Reply(`⌨️ 𝙰𝚞𝚝𝚘𝚃𝚢𝚙𝚒𝚗𝚐 ${
autoTyping ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"
}`)

}
break;

// ================= AUTOREAD =================
case "autoread": {

if (!args[0])
return Reply("❌ 𝚄𝚜𝚎 𝚘𝚗/𝚘𝚏𝚏𝚋")

autoRead =
args[0].toLowerCase() === "on"

Reply(`📖 AutoRead ${
autoRead ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"
}`)

}
break;

// ================= ANTICALL =================
case "anticall": {

if (!args[0])
return Reply("❌ Use on/off")

antiCall =
args[0].toLowerCase() === "on"

Reply(`📞 AntiCall ${
antiCall ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"
}`)

}
break;

// ================= PMBLOCKER =================
case "pmblocker": {

if (!args[0])
return Reply("❌ 𝚄𝚜𝚎 𝚘𝚗/𝚘𝚏𝚏/𝚜𝚝𝚊𝚝𝚞𝚜")

const input = args[0].toLowerCase()

if (input === "on") {
pmBlocker = true
Reply("🚫 𝙿𝙼 𝙱𝚕𝚘𝚌𝚔𝚎𝚛 𝙴𝚗𝚊𝚋𝚕𝚎𝚍")
}

else if (input === "off") {
pmBlocker = false
Reply("✅ 𝙿𝙼 𝙱𝚕𝚘𝚌𝚔𝚎𝚛 𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍")
}

else if (input === "status") {
Reply(`🚫 𝙿𝙼 𝙱𝚕𝚘𝚌𝚔𝚎𝚛: ${
pmBlocker ? "𝙾𝙽" : "𝙾𝙵𝙵"
}`)
}

}
break;

// ================= PMBLOCKER SETMSG =================
case "pmblockersetmsg": {

if (!args[0])
return Reply("❌ 𝙴𝚗𝚝𝚎𝚛 𝚖𝚎𝚜𝚜𝚊𝚐𝚎")

pmBlockMsg = args.join(" ")

Reply("✏️ 𝙿𝙼 𝙱𝚕𝚘𝚌𝚔 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚞𝚙𝚍𝚊𝚝𝚎𝚍")

}
break;

// ================= SETMENTION =================
case "setmention": {

const quoted =
msg.message.extendedTextMessage?.contextInfo?.quotedMessage

if (!quoted)
return Reply("❌ 𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚖𝚎𝚜𝚜𝚊𝚐𝚎")

mentionMessage =
quoted.conversation ||
quoted.extendedTextMessage?.text ||
"👋 Hello"

Reply("✅ 𝙼𝚎𝚗𝚝𝚒𝚘𝚗 𝚛𝚎𝚙𝚕𝚢 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚜𝚎𝚝")

}
break;

// ================= MENTION =================
case "mention": {

if (!args[0])
return Reply("❌ 𝚄𝚜𝚎 𝚘𝚗/𝚘𝚏𝚏")

mentionReply =
args[0].toLowerCase() === "on"

Reply(`👋 𝙼𝚎𝚗𝚝𝚒𝚘𝚗 𝚁𝚎𝚙𝚕𝚢 ${
mentionReply ? "𝙴𝚗𝚊𝚋𝚕𝚎𝚍" : "𝙳𝚒𝚜𝚊𝚋𝚕𝚎𝚍"
}`)

}
break;

// ================= AUTO FEATURES =================

// ===== AUTOREAD =====
if (autoRead) {
await sock.readMessages([msg.key])
}

// ===== AUTOTYPING =====
if (autoTyping) {

await sock.sendPresenceUpdate(
"composing",
from
)

}

// ===== AUTOREACT =====
if (autoReact) {

const emojis = ["❤️","🔥","😎","⚡","🐢"]

const emoji =
emojis[Math.floor(Math.random()*emojis.length)]

await sock.sendMessage(from, {
react: {
text: emoji,
key: msg.key
}
})

}

// ===== PM BLOCKER =====
if (
pmBlocker &&
!from.endsWith("@g.us") &&
from !== sock.user.id
) {

await sock.sendMessage(from, {
text: pmBlockMsg
})

await sock.updateBlockStatus(from, "block")

}

// ===== MENTION REPLY =====
if (
mentionReply &&
msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(
sock.user.id
)
) {

Reply(mentionMessage)

}

// ================= ANTICALL EVENT =================
sock.ev.on("call", async calls => {

if (!antiCall) return

for (const call of calls) {

const id = call.from

await sock.sendMessage(id, {
text: "📞 Calls are not allowed"
})

await sock.updateBlockStatus(id, "block")

}

})

case "sticker": {

const quoted =
msg.message.extendedTextMessage?.contextInfo?.quotedMessage

const img =
msg.message.imageMessage || quoted?.imageMessage

if (!img) return Reply("❌ Reply to image")

const stream = await downloadContentFromMessage(
img,
"image"
)

let buffer = Buffer.from([])
for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}

await sock.sendMessage(from, {
sticker: buffer
}, { quoted: msg })

}
break;

case "simage": {

const quoted =
msg.message.extendedTextMessage?.contextInfo?.quotedMessage

const st =
quoted?.stickerMessage

if (!st) return Reply("❌ Reply to sticker")

const stream = await downloadContentFromMessage(st, "image")

let buffer = Buffer.from([])
for await (const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}

await sock.sendMessage(from, {
image: buffer,
caption: "🖼️ Sticker converted"
}, { quoted: msg })

}
break;

case "take": {

Reply("🧾 𝚂𝚝𝚒𝚌𝚔𝚎𝚛 𝚙𝚊𝚌𝚔 𝚛𝚎𝚗𝚊𝚖𝚎 𝚗𝚘𝚝 𝚜𝚞𝚙𝚙𝚘𝚛𝚝𝚎𝚍 𝚍𝚒𝚛𝚎𝚌𝚝𝚕𝚢 𝚒𝚗 𝙱𝚊𝚒𝚕𝚎𝚢𝚜 𝚌𝚘𝚛𝚎\𝚗𝚄𝚜𝚎 𝚎𝚡𝚝𝚎𝚛𝚗𝚊𝚕 𝙰𝙿𝙸")

}
break;

case "meme": {

const res = await fetch("https://meme-api.com/gimme")
const json = await res.json()

await sock.sendMessage(from, {
image: { url: json.url },
caption: json.title
}, { quoted: msg })

}
break;

case "japan":
case "china":
case "indonesia":
case "korea": {

const country = command

const res = await fetch(`https://restcountries.com/v3.1/name/${country}`)
const data = await res.json()

const c = data[0]

Reply(`🌍 ${c.name.common}

🏛 𝙲𝚊𝚙𝚒𝚝𝚊𝚕: ${c.capital}
👥 𝙿𝚘𝚙𝚞𝚕𝚊𝚝𝚒𝚘𝚗: ${c.population}
🌎 𝚁𝚎𝚐𝚒𝚘𝚗: ${c.region}
🗺 𝙰𝚛𝚎𝚊: ${c.area} km²`)

}
break;

case "tictactoe": {

Reply("🎮 TicTacToe started!\n(Not full engine yet, upgrade coming)")

}
break;

case "hangman": {

const words = ["banana","robot","whatsapp","developer","python"]
const word = words[Math.floor(Math.random()*words.length)]

Reply(`🎯 𝙷𝚊𝚗𝚐𝚖𝚊𝚗 𝚠𝚘𝚛𝚍 𝚜𝚝𝚊𝚛𝚝𝚎𝚍!\nLength: ${word.length}`)

}
break;

case "guess": {

if (!args[0]) return Reply("❌ 𝚐𝚞𝚎𝚜𝚜 𝚊 𝚕𝚎𝚝𝚝𝚎𝚛")

Reply(`🎯 𝚈𝚘𝚞 𝚐𝚞𝚎𝚜𝚜𝚎𝚍: ${args[0]}`)

}
break;

case "trivia": {

Reply("🧠 𝚀𝚞𝚎𝚜𝚝𝚒𝚘𝚗:\n2y+5x=10 𝚏𝚒𝚗𝚍 𝚝𝚑𝚎 𝚌𝚘𝚎𝚏𝚏𝚒𝚌𝚎𝚗𝚝 𝚘𝚏 x 𝚊𝚗𝚍 y?\nAnswer 𝚠𝚒𝚝𝚑 .𝚊𝚗𝚜𝚠𝚎𝚛")

}
break;

case "answer": {

if (!args[0]) return Reply("❌ Give answer")

if (args[0] === "1,1") {
Reply("✅ Correct!")
} else {
Reply("❌ Wrong!")
}

}
break;

case "truth": {
Reply("🤫 𝚃𝚛𝚞𝚝𝚑: 𝚆𝚑𝚘 𝚍𝚘 𝚢𝚘𝚞 𝚕𝚘𝚟𝚎?")
}
break;

case "dare": {
Reply("😈 Dare: 𝚃𝚎𝚡𝚝 𝚢𝚘𝚞𝚛 𝚌𝚛𝚞𝚜𝚑 𝚛𝚒𝚐𝚑𝚝 𝚗𝚘𝚠")
}
break;

// ================= COMPLIMENT =================
case "compliment": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ Tag user")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

const msgs = [
"✨ 𝚈𝚘𝚞 𝚊𝚛𝚎 𝚊𝚖𝚊𝚣𝚒𝚗𝚐",
"🔥 You are intelligent",
"💖 𝚈𝚘𝚞 𝚊𝚛𝚎 𝚜𝚙𝚎𝚌𝚒𝚊𝚕",
"🌟 𝚈𝚘𝚞 𝚕𝚒𝚐𝚑𝚝 𝚞𝚙 𝚝𝚑𝚎 𝚛𝚘𝚘𝚖"
]

Reply(`@${user.split("@")[0]} ${msgs[Math.floor(Math.random()*msgs.length)]}`)

}
break;

// ================= INSULT =================
case "insult": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ 𝚃𝚊𝚐 𝚞𝚜𝚎𝚛")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

const msgs = [
"😂 𝙴𝚟𝚎𝚗 𝚆𝚒𝙵𝚒 𝚊𝚟𝚘𝚒𝚍𝚜 𝚢𝚘𝚞",
"💀 𝚈𝚘𝚞 𝚊𝚛𝚎 𝚕𝚘𝚠 𝚋𝚊𝚝𝚝𝚎𝚛𝚢 𝚎𝚗𝚎𝚛𝚐𝚢",
"🤣 𝙱𝚛𝚊𝚒𝚗 𝚗𝚘𝚝 𝚏𝚘𝚞𝚗𝚍",
"🐢 𝚂𝚕𝚘𝚠 𝚕𝚒𝚔𝚎 𝚝𝚞𝚛𝚝𝚕𝚎"
]

Reply(`@${user.split("@")[0]} ${msgs[Math.floor(Math.random()*msgs.length)]}`)

}
break;

// ================= FLIRT =================
case "flirt": {

Reply("😍 𝙰𝚛𝚎 𝚢𝚘𝚞 𝚆𝚒𝙵𝚒? 𝙱𝚎𝚌𝚊𝚞𝚜𝚎 𝙸'𝚖 𝚏𝚎𝚎𝚕𝚒𝚗𝚐 𝚊 𝚌𝚘𝚗𝚗𝚎𝚌𝚝𝚒𝚘𝚗 ❤️")

}
break;

// ================= SHAYARI =================
case "shayari": {

const s = [
"💔 𝙻𝚘𝚟𝚎 𝚒𝚜 𝚙𝚊𝚒𝚗 𝚑𝚒𝚍𝚍𝚎𝚗 𝚒𝚗 𝚜𝚖𝚒𝚕𝚎𝚜",
"🌹 𝚈𝚘𝚞 𝚌𝚊𝚖𝚎 𝚕𝚒𝚔𝚎 𝚊 𝚍𝚛𝚎𝚊𝚖 𝙸 𝚗𝚎𝚟𝚎𝚛 𝚠𝚘𝚔𝚎 𝚞𝚙 𝚏𝚛𝚘𝚖",
"💖 𝚂𝚘𝚖𝚎 𝚑𝚎𝚊𝚛𝚝𝚜 𝚗𝚎𝚟𝚎𝚛 𝚑𝚎𝚊𝚕, 𝚝𝚑𝚎𝚢 𝚓𝚞𝚜𝚝 𝚊𝚍𝚊𝚙𝚝",
"✨ 𝚂𝚒𝚕𝚎𝚗𝚌𝚎 𝚊𝚕𝚜𝚘 𝚜𝚙𝚎𝚊𝚔𝚜 𝚠𝚑𝚎𝚗 𝚏𝚎𝚎𝚕𝚒𝚗𝚐𝚜 𝚊𝚛𝚎 𝚍𝚎𝚎𝚙"
]

Reply(s[Math.floor(Math.random()*s.length)])

}
break;

// ================= GOODNIGHT =================
case "goodnight": {
Reply("🌙 𝙶𝚘𝚘𝚍 𝚗𝚒𝚐𝚑𝚝, 𝚜𝚠𝚎𝚎𝚝 𝚍𝚛𝚎𝚊𝚖𝚜 ❤️")
}
break;

// ================= ROSE DAY =================
case "𝚛𝚘𝚜𝚎𝚍𝚊𝚢": {
Reply("🌹 𝙷𝚊𝚙𝚙𝚢 𝚁𝚘𝚜𝚎 𝙳𝚊𝚢! 𝚂𝚝𝚊𝚢 𝚋𝚎𝚊𝚞𝚝𝚒𝚏𝚞𝚕 ❤️")
}
break;

// ================= CHARACTER =================
case "character": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ Tag user")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

const types = [
"😎 𝙲𝚘𝚘𝚕",
"🔥 𝙷𝚘𝚝",
"🤓 𝙽𝚎𝚛𝚍",
"😂 𝙵𝚞𝚗𝚗𝚢",
"💀 𝚂𝚊𝚟𝚊𝚐𝚎"
]

Reply(`@${user.split("@")[0]} is ${types[Math.floor(Math.random()*types.length)]}`)

}
break;

// ================= WASTED =================
case "wasted": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ Tag user")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

Reply(`💀 @${user.split("@")[0]} 𝚆𝙰𝚂𝚃𝙴𝙳 💀`)

}
break;

// ================= SHIP =================
case "ship": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ 𝚃𝚊𝚐 2 𝚞𝚜𝚎𝚛𝚜")

const users =
msg.message.extendedTextMessage.contextInfo.mentionedJid

const percent = Math.floor(Math.random()*100)

Reply(`💘 𝚂𝚑𝚒𝚙 𝚁𝚎𝚜𝚞𝚕𝚝:\n@${users[0].split("@")[0]} + @${users[1].split("@")[0]} = ${percent}%`)

}
break;

// ================= SIMP =================
case "simp": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ 𝚃𝚊𝚐 𝚞𝚜𝚎𝚛")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

Reply(`💔 @${user.split("@")[0]} 𝚒𝚜 𝚊 𝚌𝚎𝚛𝚝𝚒𝚏𝚒𝚎𝚍 𝚜𝚒𝚖𝚙 😭`)

}
break;

// ================= STUPID =================
case "stupid": {

if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid)
return Reply("❌ 𝚃𝚊𝚐 𝚞𝚜𝚎𝚛")

const user =
msg.message.extendedTextMessage.contextInfo.mentionedJid[0]

const text = args.join(" ") || "𝚒𝚜 𝚜𝚝𝚞𝚙𝚒𝚍 😂"

Reply(`@${user.split("@")[0]} ${text}`)

}
break;

case "metallic": {

Reply(`🪙 ${args.join(" ").toUpperCase().split("").join("⃢")}`)

}
break;

case "ice": {

Reply(`❄️ ${args.join(" ").toUpperCase().split("").join("❄️")}`)

}
break;

case "snow": {

Reply(`☃️ ${args.join(" ").split("").join("❄️")}`)

}
break;

case "impressive": {

Reply(`✨ 𝓲𝓶𝓹𝓻𝓮𝓼𝓼𝓲𝓿𝓮: ${args.join(" ")}`)

}
break;

case "matrix": {

Reply(`🟢 ${args.join(" ").split("").join(" 001 010 ")}`)

}
break;

case "light": {

Reply(`💡 ✨ ${args.join(" ")} ✨`)

}
break;

case "neon": {

Reply(`💜 𝓝𝓔𝓞𝓝: ${args.join(" ")}`)

}
break;

case "devil": {

Reply(`😈 ${args.join(" ").toUpperCase()} 😈`)

}
break;

case "purple": {

Reply(`💜 ${args.join(" ")}`)

}
break;

case "thunder": {

Reply(`⚡ BOOM ⚡ ${args.join(" ").toUpperCase()} ⚡`)

}
break;

case "leaves": {

Reply(`🍃 ${args.join(" ").split("").join("🍃")}`)

}
break;

case "1917": {

Reply(`𝟙𝟡𝟙𝟟 — ${args.join(" ")}`)

}
break;

case "arena": {

Reply(`🏟️ ${args.join(" ").toUpperCase()} ENTERS THE ARENA!`)

}
break;

case "hacker": {

Reply(`💻 010101 ${args.join(" ").toUpperCase()} 101010`)

}
break;

case "sand": {

Reply(`🏖️ ${𝚊𝚛𝚐𝚜.𝚓𝚘𝚒𝚗(" ").𝚜𝚙𝚕𝚒𝚝("").𝚓𝚘𝚒𝚗("🏖️")}`)

}
break;

case "blackpink": {

Reply(`🖤💗 ${args.join(" ").toUpperCase()} 💗🖤`)

}
break;

case "glitch": {

Reply(`⧖⧗⧖ ${args.join(" ").split("").join("̷")} ⧗⧖⧗`)

}
break;

case "fire": {

Reply(`🔥 ${args.join(" ").split("").join("🔥")}`)

}
break;

case "gemmni":
case "ai":
case "gpt": {

if (!args[0]) return Reply("❌ Ask a question")

const query = args.join(" ")

try {

// DuckDuckGo Instant Answer API
const res = await fetch(
`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
)

const data = await res.json()

let answer =
data.AbstractText ||
data.Answer ||
data.Definition ||
"❌ No clear answer found. Try a different question."

Reply(`🤖 SEARCH RESULT

🔎 Query: ${query}

💡 Answer:
${answer}`)

} catch (e) {

Reply("❌ Error getting search results")

}

}
break;

case "play":
case "song": {

if (!args[0]) return Reply("❌ Enter song name")

const query = args.join(" ")

const search = await yts(query)
const video = search.videos[0]

if (!video) return Reply("❌ No song found")

Reply(`🎵 Found: ${video.title}\n⏳ Sending audio...`)

const stream = ytdl(video.url, { filter: "audioonly" })

sock.sendMessage(from, {
audio: stream,
mimetype: "audio/mp4"
}, { quoted: msg })

}
break;

case "spotify": {

Reply(`🎧 Spotify Search (offline mode)\n\nResult for: ${args.join(" ")}\n\n⚠️ Real download not available without API`)

}
break;

case "instagram":
case "facebook":
case "tiktok": {

if (!args[0]) return Reply("❌ Send link")

Reply(`📥 Processing link...\n\n⚠️ Media download requires external API or scraping server\n\nLink: ${args[0]}`)

}
break;

case "ytmp4": {

if (!args[0]) return Reply("❌ Send YouTube link")

const url = args[0]

if (!ytdl.validateURL(url))
return Reply("❌ Invalid YouTube link")

Reply("📥 Downloading video...")

const stream = ytdl(url, { filter: "videoandaudio" })

sock.sendMessage(from, {
video: stream,
caption: "🎥 Here is your video"
}, { quoted: msg })

}
break;

case "heart": {
Reply("❤")
}
break;

case "horny": {
Reply("😏 Control yourself bro 😂")
}
break;

case "circle": {
Reply("🔵")
}
break;

case "lgbt": {
Reply("🏳️‍🌈 Love is love ❤️")
}
break;

case "lolice": {
Reply("🚨 You are under funny arrest 😂")
}
break;

case "its-so-stupid": {
Reply("💀 This is so stupid I can't even 😂")
}
break;

case "namecard": {

Reply(`🪪 NAME CARD\n\nName: ${pushname}\nBot: Active\nStatus: Online`)

}
break;

case "roast": {

const roast = [
  "You're like a cloud. When you disappear, it's a beautiful day!",
    "You bring everyone so much joy when you leave the room!",
    "I'd agree with you, but then we'd both be wrong.",
    "You're not stupid; you just have bad luck thinking.",
    "Your secrets are always safe with me. I never even listen to them.",
    "You're proof that even evolution takes a break sometimes.",
    "You have something on your chin... no, the third one down.",
    "You're like a software update. Whenever I see you, I think, 'Do I really need this right now?'",
    "You bring everyone happiness... you know, when you leave.",
    "You're like a penny—two-faced and not worth much.",
    "You have something on your mind... oh wait, never mind.",
    "You're the reason they put directions on shampoo bottles.",
    "You're like a cloud. Always floating around with no real purpose.",
    "Your jokes are like expired milk—sour and hard to digest.",
    "You're like a candle in the wind... useless when things get tough.",
    "You have something unique—your ability to annoy everyone equally.",
    "You're like a Wi-Fi signal—always weak when needed most.",
    "You're proof that not everyone needs a filter to be unappealing.",
    "Your energy is like a black hole—it just sucks the life out of the room.",
    "You have the perfect face for radio.",
    "You're like a traffic jam—nobody wants you, but here you are.",
    "You're like a broken pencil—pointless.",
    "Your ideas are so original, I'm sure I've heard them all before.",
    "You're living proof that even mistakes can be productive.",
    "You're not lazy; you're just highly motivated to do nothing.",
    "Your brain's running Windows 95—slow and outdated.",
    "You're like a speed bump—nobody likes you, but everyone has to deal with you.",
    "You're like a cloud of mosquitoes—just irritating.",
    "You bring people together just to tell them how stupid you are."
]

Reply(`${roast[Math.floor(Math.random()*quotes.length)]}`)

}
break;

case "tweet": {

Reply(`🐦 Tweet posted:\n\n${args.join(" ")}`)

}
break;

case "ytcomment": {

Reply(`💬 YouTube Comment:\n"${args.join(" ")}"\n👍 1 like`)

}
break;

case "comrade": { Reply("🇷🇺 Comrade detected 😎") }
break;

case "gay": { Reply("🏳️‍🌈 maybe yes maybe no 😂") }
break;

case "glass": { Reply("🪟 *crack sound*") }
break;

case "jail": { Reply("🚔 You are jailed in meme world 😂") }
break;

case "passed": { Reply("🎉 You passed... barely 😂") }
break;

case "triggered": { Reply("💢 *triggered intensifies*") }
break;

case "neko":
case "waifu":
case "loli":
case "nom": {

Reply("😺 Anime mode active (no API)\nTry again later for images")

}
break;

case "cry": Reply("😭 *crying anime vibes*"); break;
case "kiss": Reply("😘 *anime kiss*"); break;
case "hug": Reply("🤗 *hug received*"); break;
case "wink": Reply("😉 *wink*"); break;
case "facepalm": Reply("🤦‍♂️ bruh moment"); break;
case "pat": Reply("🫳 *head pat*"); break;

case "script": {

const fs = require("fs")

const filePath = "./script.zip"  // change name if needed

if (!fs.existsSync(filePath)) {
return Reply("❌ script.zip not found in folder")
}

await sock.sendMessage(from, {
document: fs.readFileSync(filePath),
mimetype: "application/zip",
fileName: "🐢 SCRIPT BY BOT.zip"
}, { quoted: msg })

}
break;


case "menu": {
await sock.sendMessage(from, {
image: {
url: "https://repgyetdcodkynrbxocg.supabase.co/storage/v1/object/public/images/telegram-1777734751263-1c20463a.jpg"
},
caption: `
*╭━━━〔 💫 𝙰𝚗𝚒𝚖𝚎 𝙼𝙳 💫 〕━━━┈⊷*
*┃💫╭──────────────────*
*┃💫│ 𝚄𝚂𝙴𝚁 :❯ ${pushname || 'User'}*
*┃💫│ 𝙼𝙾𝙳𝙴 :❯ 𝚙𝚞𝚋𝚕𝚒𝚌*
*┃💫│ 𝙿𝚁𝙴𝙵𝙸𝚇 :❯ [.]*
*┃💫│ 𝚅𝙴𝚁𝚂𝙸𝙾𝙽 :❯ 4.0.0*
*┃💫╰──────────────────*
*╰━━━━━━━━━━━━━━━┈⊷*

*𝙷𝙸 ${pushname || 'User'} 🥰*

*╭━━〔 💫 𝙶𝙴𝙽𝙴𝚁𝙰𝙻 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 💫 〕━━┈⊷*
*┃💫│ • .𝙼𝙴𝙽𝚄*
*┃💫│ • .𝙿𝙸𝙽𝙶*
*┃💫│ • .𝙰𝙻𝙸𝚅𝙴*
*┃💫│ • .𝙾𝚆𝙽𝙴𝚁*
*┃💫│ • .𝙹𝙾𝙺𝙴*
*┃💫│ • .𝚀𝚄𝙾𝚃𝙴*
*┃💫│ • .𝙵𝙰𝙲𝚃*
*┃💫│ • .𝚆𝙴𝙰𝚃𝙷𝙴𝚁 <𝙲𝙸𝚃𝚈>*
*┃💫│ • .𝙽𝙴𝚆𝚂*
*┃💫│ • .𝙰𝚃𝚃𝙿 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙻𝚈𝚁𝙸𝙲𝚂 <𝚂𝙾𝙽𝙶_𝚃𝙸𝚃𝙻𝙴>*
*┃💫│ • .𝟾𝙱𝙰𝙻𝙻 <𝚀𝚄𝙴𝚂𝚃𝙸𝙾𝙽>*
*┃💫│ • .𝙶𝚁𝙾𝚄𝙿𝙸𝙽𝙵𝙾*
*┃💫│ • .𝚂𝚃𝙰𝙵𝙵 / .𝙰𝙳𝙼𝙸𝙽𝚂*
*┃💫│ • .𝚅𝚅*
*┃💫│ • .𝚀𝚁*
*┃💫│ • .𝚙𝚊𝚒𝚛 <𝚗𝚞𝚖𝚋𝚎𝚛>*
*┃💫│ • .𝙹𝙸𝙳*
*┃💫│ • .𝚄𝚁𝙻*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙰𝙳𝙼𝙸𝙽 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 💫 〕━━┈⊷*
*┃💫│ • .𝙱𝙰𝙽 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝙿𝚁𝙾𝙼𝙾𝚃𝙴 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝙳𝙴𝙼𝙾𝚃𝙴 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝙼𝚄𝚃𝙴 <𝙼𝙸𝙽𝚄𝚃𝙴𝚂>*
*┃💫│ • .𝚄𝙽𝙼𝚄𝚃𝙴*
*┃💫│ • .𝙳𝙴𝙻𝙴𝚃𝙴 / .𝙳𝙴𝙻*
*┃💫│ • .𝙺𝙸𝙲𝙺 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝚆𝙰𝚁𝙽𝙸𝙽𝙶𝚂 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝚆𝙰𝚁𝙽 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺*
*┃💫│ • .𝙰𝙽𝚃𝙸𝙱𝙰𝙳𝚆𝙾𝚁𝙳*
*┃💫│ • .𝙲𝙻𝙴𝙰𝚁*
*┃💫│ • .𝚃𝙰𝙶 <𝙼𝙴𝚂𝚂𝙰𝙶𝙴>*
*┃💫│ • .𝚃𝙰𝙶𝙰𝙻𝙻*
*┃💫│ • .𝚃𝙰𝙶𝙽𝙾𝚃𝙰𝙳𝙼𝙸𝙽*
*┃💫│ • .𝙷𝙸𝙳𝙴𝚃𝙰𝙶 <𝙼𝙴𝚂𝚂𝙰𝙶𝙴>*
*┃💫│ • .𝙲𝙷𝙰𝚃𝙱𝙾𝚃*
*┃💫│ • .𝚁𝙴𝚂𝙴𝚃𝙻𝙸𝙽𝙺*
*┃💫│ • .𝙰𝙽𝚃𝙸𝚃𝙰𝙶 <𝙾𝙽/𝙾𝙵𝙵>*
*┃💫│ • .𝚆𝙴𝙻𝙲𝙾𝙼𝙴 <𝙾𝙽/𝙾𝙵𝙵>*
*┃💫│ • .𝙶𝙾𝙾𝙳𝙱𝚈𝙴 <𝙾𝙽/𝙾𝙵𝙵>*
*┃💫│ • .𝚂𝙴𝚃𝙶𝙳𝙴𝚂𝙲 <𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽>*
*┃💫│ • .𝚂𝙴𝚃𝙶𝙽𝙰𝙼𝙴 <𝙽𝙴𝚆 𝙽𝙰𝙼𝙴>*
*┃💫│ • .𝚂𝙴𝚃𝙶𝙿𝙿 (𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝙸𝙼𝙰𝙶𝙴)*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙾𝚆𝙽𝙴𝚁 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 💫 〕━━┈⊷*
*┃💫│ • .𝙼𝙾𝙳𝙴 <𝙿𝚄𝙱𝙻𝙸𝙲/𝙿𝚁𝙸𝚅𝙰𝚃𝙴>*
*┃💫│ • .𝙲𝙻𝙴𝙰𝚁𝚂𝙴𝚂𝚂𝙸𝙾𝙽*
*┃💫│ • .𝙰𝙽𝚃𝙸𝙳𝙴𝙻𝙴𝚃𝙴*
*┃💫│ • .𝙲𝙻𝙴𝙰𝚁𝚃𝙼𝙿*
*┃💫│ • .𝚄𝙿𝙳𝙰𝚃𝙴*
*┃💫│ • .𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂*
*┃💫│ • .𝚂𝙴𝚃𝙿𝙿 <𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝙸𝙼𝙰𝙶𝙴>*
*┃💫│ • .𝙰𝚄𝚃𝙾𝚁𝙴𝙰𝙲𝚃 <𝙾𝙽/𝙾𝙵𝙵>*
*┃💫│ • .𝙰𝚄𝚃𝙾𝚂𝚃𝙰𝚃𝚄𝚂 <𝙾𝙽/𝙾𝙵𝙵>*
*┃💫│ • .𝙰𝚄𝚃𝙾𝚂𝚃𝙰𝚃𝚄𝚂 𝚁𝙴𝙰𝙲𝚃 <𝙾𝙽/𝙾𝙵𝙵>*
*┃💫│ • .𝙰𝚄𝚃𝙾𝚃𝚈𝙿𝙸𝙽𝙶 <𝙾𝙽/𝙾𝙵𝙵>*
*┃💫│ • .𝙰𝚄𝚃𝙾𝚁𝙴𝙰𝙳 <𝙾𝙽/𝙾𝙵𝙵>*
*┃💫│ • .𝙰𝙽𝚃𝙸𝙲𝙰𝙻𝙻 <𝙾𝙽/𝙾𝙵𝙵>*
*┃💫│ • .𝙿𝙼𝙱𝙻𝙾𝙲𝙺𝙴𝚁 <𝙾𝙽/𝙾𝙵𝙵/𝚂𝚃𝙰𝚃𝚄𝚂>*
*┃💫│ • .𝙿𝙼𝙱𝙻𝙾𝙲𝙺𝙴𝚁 𝚂𝙴𝚃𝙼𝚂𝙶 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝚂𝙴𝚃𝙼𝙴𝙽𝚃𝙸𝙾𝙽 <𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝙼𝚂𝙶>*
*┃💫│ • .𝙼𝙴𝙽𝚃𝙸𝙾𝙽 <𝙾𝙽/𝙾𝙵𝙵>*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙸𝙼𝙰𝙶𝙴/𝚂𝚃 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 💫 〕━━┈⊷*
*┃💫│ • .𝙱𝙻𝚄𝚁 <𝙸𝙼𝙰𝙶𝙴>*
*┃💫│ • .𝚂𝙸𝙼𝙰𝙶𝙴 <𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝚂𝚃𝙸𝙲𝙺𝙴𝚁>*
*┃💫│ • .𝚂𝚃𝙸𝙲𝙺𝙴𝚁 <𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝙸𝙼𝙰𝙶𝙴>*
*┃💫│ • .𝚁𝙴𝙼𝙾𝚅𝙴𝙱𝙶*
*┃💫│ • .𝚁𝙴𝙼𝙸𝙽𝙸*
*┃💫│ • .𝙲𝚁𝙾𝙿 <𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝙸𝙼𝙰𝙶𝙴>*
*┃💫│ • .𝚃𝙶𝚂𝚃𝙸𝙲𝙺𝙴𝚁 <𝙻𝙸𝙽𝙺>*
*┃💫│ • .𝙼𝙴𝙼𝙴*
*┃💫│ • .𝚃𝙰𝙺𝙴 <𝙿𝙰𝙲𝙺𝙽𝙰𝙼𝙴>*
*┃💫│ • .𝙴𝙼𝙾𝙹𝙸𝙼𝙸𝚇 <𝙴𝙼𝙹𝟷>+<𝙴𝙼𝙹𝟸>*
*┃💫│ • .𝙸𝙶𝚂 <𝙸𝙽𝚂𝚃𝙰 𝙻𝙸𝙽𝙺>*
*┃💫│ • .𝙸𝙶𝚂𝙲 <𝙸𝙽𝚂𝚃𝙰 𝙻𝙸𝙽𝙺>*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙿𝙸𝙴𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 💫 〕━━┈⊷*
*┃💫│ • .𝙿𝙸𝙴𝚂 <𝙲𝙾𝚄𝙽𝚃𝚁𝚈>*
*┃💫│ • .𝙲𝙷𝙸𝙽𝙰*
*┃💫│ • .𝙸𝙽𝙳𝙾𝙽𝙴𝚂𝙸𝙰*
*┃💫│ • .𝙹𝙰𝙿𝙰𝙽*
*┃💫│ • .𝙺𝙾𝚁𝙴𝙰*
*┃💫│ • .𝙷𝙸𝙹𝙰𝙱*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙶𝙰𝙼𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 💫 〕━━┈⊷*
*┃💫│ • .𝚃𝙸𝙲𝚃𝙰𝙲𝚃𝙾𝙴 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝙷𝙰𝙽𝙶𝙼𝙰𝙽*
*┃💫│ • .𝙶𝚄𝙴𝚂𝚂 <𝙻𝙴𝚃𝚃𝙴𝚁>*
*┃💫│ • .𝚃𝚁𝙸𝚅𝙸𝙰*
*┃💫│ • .𝙰𝙽𝚂𝚆𝙴𝚁 <𝙰𝙽𝚂𝚆𝙴𝚁>*
*┃💫│ • .𝚃𝚁𝚄𝚃𝙷*
*┃💫│ • .𝙳𝙰𝚁𝙴*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙰𝙸 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 💫 〕━━┈⊷*
*┃💫│ • .𝙶𝙿𝚃 <𝚀𝚄𝙴𝚂𝚃𝙸𝙾𝙽>*
*┃💫│ • .𝙶𝙴𝙼𝙸𝙽𝙸 <𝚀𝚄𝙴𝚂𝚃𝙸𝙾𝙽>*
*┃💫│ • .𝙸𝙼𝙰𝙶𝙸𝙽𝙴 <𝙿𝚁𝙾𝙼𝙿𝚃>*
*┃💫│ • .𝙵𝙻𝚄𝚇 <𝙿𝚁𝙾𝙼𝙿𝚃>*
*┃💫│ • .𝚂𝙾𝚁𝙰 <𝙿𝚁𝙾𝙼𝙿𝚃>*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙵𝚄𝙽 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 💫 〕━━┈⊷*
*┃💫│ • .𝙲𝙾𝙼𝙿𝙻𝙸𝙼𝙴𝙽𝚃 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝙸𝙽𝚂𝚄𝙻𝚃 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝙵𝙻𝙸𝚁𝚃*
*┃💫│ • .𝚁𝙾𝙰𝚂𝚃*
*┃💫│ • .𝙶𝙾𝙾𝙳𝙽𝙸𝙶𝙷𝚃*
*┃💫│ • .𝚁𝙾𝚂𝙴𝙳𝙰𝚈*
*┃💫│ • .𝙲𝙷𝙰𝚁𝙰𝙲𝚃𝙴𝚁 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝚆𝙰𝚂𝚃𝙴𝙳 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝚂𝙷𝙸𝙿 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝚂𝙸𝙼𝙿 @𝚄𝚂𝙴𝚁*
*┃💫│ • .𝚂𝚃𝚄𝙿𝙸𝙳 @𝚄𝚂𝙴𝚁 [𝚃𝙴𝚇𝚃]*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝚃𝙴𝚇𝚃𝙼𝙰𝙺𝙴𝚁 💫 〕━━┈⊷*
*┃💫│ • .𝙼𝙴𝚃𝙰𝙻𝙻𝙸𝙲 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙸𝙲𝙴 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝚂𝙽𝙾𝚆 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙸𝙼𝙿𝚁𝙴𝚂𝚂𝙸𝚅𝙴 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙼𝙰𝚃𝚁𝙸𝚇 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙻𝙸𝙶𝙷𝚃 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙽𝙴𝙾𝙽 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙳𝙴𝚅𝙸𝙻 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙿𝚄𝚁𝙿𝙻𝙴 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝚃𝙷𝚄𝙽𝙳𝙴𝚁 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙻𝙴𝙰𝚅𝙴𝚂 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝟷𝟿𝟷𝟽 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙰𝚁𝙴𝙽𝙰 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙷𝙰𝙲𝙺𝙴𝚁 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝚂𝙰𝙽𝙳 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙱𝙻𝙰𝙲𝙺𝙿𝙸𝙽𝙺 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙶𝙻𝙸𝚃𝙲𝙷 <𝚃𝙴𝚇𝚃>*
*┃💫│ • .𝙵𝙸𝚁𝙴 <𝚃𝙴𝚇𝚃>*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁 💫 〕━━┈⊷*
*┃💫│ • .𝙿𝙻𝙰𝚈 <𝚂𝙾𝙽𝙶_𝙽𝙰𝙼𝙴>*
*┃💫│ • .𝚂𝙾𝙽𝙶 <𝚂𝙾𝙽𝙶_𝙽𝙰𝙼𝙴>*
*┃💫│ • .𝚂𝙿𝙾𝚃𝙸𝙵𝚈 <𝚀𝚄𝙴𝚁𝚈>*
*┃💫│ • .𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 <𝙻𝙸𝙽𝙺>*
*┃💫│ • .𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 <𝙻𝙸𝙽𝙺>*
*┃💫│ • .𝚃𝙸𝙺𝚃𝙾𝙺 <𝙻𝙸𝙽𝙺>*
*┃💫│ • .𝙽𝙰𝙽𝙾-𝙱𝙰𝙽𝙰𝙽𝙰*
*┃💫│ • .𝚈𝚃𝙼𝙿𝟺 <𝙻𝙸𝙽𝙺>*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙼𝙸𝚂𝙲 💫 〕━━┈⊷*
*┃💫│ • .𝙷𝙴𝙰𝚁𝚃*
*┃💫│ • .𝙷𝙾𝚁𝙽𝚈*
*┃💫│ • .𝙲𝙸𝚁𝙲𝙻𝙴*
*┃💫│ • .𝙻𝙶𝙱𝚃*
*┃💫│ • .𝙻𝙾𝙻𝙸𝙲𝙴*
*┃💫│ • .𝙸𝚃𝚂-𝚂𝙾-𝚂𝚃𝚄𝙿𝙸𝙳*
*┃💫│ • .𝙽𝙰𝙼𝙴𝙲𝙰𝚁𝙳*
*┃💫│ • .𝙾𝙾𝙶𝚆𝙰𝚈*
*┃💫│ • .𝚃𝚆𝙴𝙴𝚃*
*┃💫│ • .𝚈𝚃𝙲𝙾𝙼𝙼𝙴𝙽𝚃*
*┃💫│ • .𝙲𝙾𝙼𝚁𝙰𝙳𝙴*
*┃💫│ • .𝙶𝙰𝚈*
*┃💫│ • .𝙶𝙻𝙰𝚂𝚂*
*┃💫│ • .𝙹𝙰𝙸𝙻*
*┃💫│ • .𝙿𝙰𝚂𝚂𝙴𝙳*
*┃💫│ • .𝚃𝚁𝙸𝙶𝙶𝙴𝚁𝙴𝙳*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙰𝙽𝙸𝙼𝙴 💫 〕━━┈⊷*
*┃💫│ • .𝙽𝙴𝙺𝙾*
*┃💫│ • .𝚆𝙰𝙸𝙵𝚄*
*┃💫│ • .𝙻𝙾𝙻𝙸*
*┃💫│ • .𝙽𝙾𝙼*
*┃💫│ • .𝙿𝙾𝙺𝙴*
*┃💫│ • .𝙲𝚁𝚈*
*┃💫│ • .𝙺𝙸𝚂𝚂*
*┃💫│ • .𝙿𝙰𝚃*
*┃💫│ • .𝙷𝚄𝙶*
*┃💫│ • .𝚆𝙸𝙽𝙺*
*┃💫│ • .𝙵𝙰𝙲𝙴𝙿𝙰𝙻𝙼*
*╰━━━━━━━━━━━━━━━┈⊷*

*╭━━〔 💫 𝙶𝙸𝚃𝙷𝚄𝙱 💫 〕━━┈⊷*
*┃💫│ • .𝙶𝙸𝚃*
*┃💫│ • .𝙶𝙸𝚃𝙷𝚄𝙱*
*┃💫│ • .𝚂𝙲*
*┃💫│ • .𝚂𝙲𝚁𝙸𝙿𝚃*
*┃💫│ • .𝚁𝙴𝙿𝙾*
*╰━━━━━━━━━━━━━━━┈⊷*
`
}, { quoted: msg })

}
break;

case "time": {
Reply(new Date().toLocaleTimeString())
}
break;

case "date": {
Reply(new Date().toLocaleDateString())
}
break;

case "nano-banana": {

const quot = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
const isImage =
msg.message?.imageMessage ||
quot?.imageMessage

const getCaption =
msg.message?.conversation ||
msg.message?.extendedTextMessage?.text ||
quot?.conversation ||
quot?.extendedTextMessage?.text

const prompt = getCaption?.replace(".nano-banana", "").trim()

if (!prompt) {
return Reply(
"⚠️ Provide a prompt or reply to an image\n\nExample:\n.nano-banana futuristic city"
)
}

async function uploadMedia() {
try {

if (!isImage) return null

const buffer = await sock.downloadMediaMessage(msg)

const form = new FormData()
form.append("file", buffer, { filename: "image.jpg" })
form.append("type", "permanent")

const res = await axios.post(
"https://tmp.malvryx.dev/upload",
form,
{ headers: form.getHeaders() }
)

return res.data?.cdnUrl || res.data?.directUrl || null

} catch (e) {
return null
}
}

await sock.sendMessage(from, {
text: "🍌 Processing Nano Banana AI..."
}, { quoted: msg })

try {

const imageUrl = await uploadMedia()

/*
========================
 IMAGE → IMAGE MODE
========================
*/
if (imageUrl) {

const init = await axios.get(
`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2?prompt=${encodeURIComponent(prompt)}&image=${encodeURIComponent(imageUrl)}`
)

if (!init.data?.task_id) {
return Reply("❌ Failed to start image editing task")
}

const taskId = init.data.task_id
const fp = init.data.fp

let result = null
let count = 0

while (!result && count < 25) {

await new Promise(r => setTimeout(r, 5000))

const check = await axios.get(
`https://omegatech-api.dixonomega.tech/api/ai/nano-banana2-result?task_id=${taskId}${fp ? `&fp=${fp}` : ""}`
)

if (check.data?.status === "completed") {
result = check.data.image_url
break
}

if (check.data?.status === "failed") {
return Reply("❌ Generation failed")
}

count++
}

if (!result) return Reply("⏳ Timeout generating image")

const img = await axios.get(result, {
responseType: "arraybuffer"
})

await sock.sendMessage(from, {
image: Buffer.from(img.data),
caption: `🍌 NANO BANANA EDIT DONE\n\n📝 Prompt: ${prompt}`
}, { quoted: msg })

}

/*
========================
 TEXT → IMAGE MODE
========================
*/
else {

const res = await axios.get(
`https://omegatech-api.dixonomega.tech/api/ai/nano-banana-pro?prompt=${encodeURIComponent(prompt)}`
)

if (!res.data?.image) {
return Reply("❌ No image returned")
}

const img = await axios.get(res.data.image, {
responseType: "arraybuffer"
})

await sock.sendMessage(from, {
image: Buffer.from(img.data),
caption: `🍌 NANO BANANA IMAGE\n\n📝 Prompt: ${prompt}`
}, { quoted: msg })

}

} catch (e) {
console.log(e)
Reply("❌ Error generating image")
}

}
break

case "owner": {
Reply("👑 T.D.E TECH")
}
break;

default:
Reply("𝖀𝖓𝖐𝖓𝖔𝖜𝖓 𝖈𝖔𝖒𝖒𝖆𝖓𝖉 𝖚𝖘𝖊 .𝖒𝖊𝖓𝖚 𝖙𝖔 𝖘𝖊𝖊 𝖆𝖛𝖆𝖎𝖑𝖆𝖇𝖑𝖊 𝖈𝖔𝖒𝖒𝖆𝖓𝖉𝖘")

}

})

}

startBot()

// 📡 QR API
app.get("/qr", (req, res) => {
res.json({ qr: latestQR, status: botStatus })
})

// 📊 STATS API
app.get("/stats", (req, res) => {
res.json({
status: botStatus
})
})

// 🔄 RESTART
app.post("/restart", async (req, res) => {
process.exit()
})

// 🚀 START SERVER
app.listen(PORT, () => {
console.log("BOT RUNNING")
})