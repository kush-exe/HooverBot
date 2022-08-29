const Discord = require('discord.js');

const { Client, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
    console.log('Ready');
})

client.on('message', message => {
    if (message.content === '$test') {
        message.reply("Help stepbro I\'m stuck!");
    }
})

//Leave at end
client.login(process.env.BOT_TOKEN); //BOT_TOKEN is the Client Secret
