const Discord = require('discord.js');

const client = new Discord.Client();

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