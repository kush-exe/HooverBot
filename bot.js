const Discord = require('discord.js');
const { REST, Routes } = require('discord.js');

const { Client, GatewayIntentBits } = require('discord.js');
const { Events, ModalBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

//register commands
const commands = [
  {
    name: 'test',
    description: 'Test',
  },
  {
    name: 'resetorder',
    description: 'Resets the current order',
  },

  {
    name: 'order',
    description: 'Add to order',
  },
  {
    name: 'pay',
    description: 'Mark order as paid',
  },
  {
    name: 'vieworder',
    description: 'View yuor current order'
  },

];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands('1013680010273501184'), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

//ready
client.on('ready', () => {
    console.log('Ready');
})

//command handlers
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'test') {
    await interaction.reply('Help stepbro I\'m stuck');
  } else if (interaction.commandName === 'order') {
    await order(interaction);
  } else if (interaction.commandName === 'resetorder') {
    
  } else if (interaction.commandName === 'pay') {
    
  }
});

//functions

/**
 * Prompts a modal form with order stuff and adds to order
 * @param {*} interaction 
 */
async function order(interaction) {
  await interaction.reply('this works');
}

async function resetorder(interaction) {

}

async function pay(interaction) {

}
 


//Leave at end
client.login(process.env.BOT_TOKEN); //BOT_TOKEN is the Client Secret
