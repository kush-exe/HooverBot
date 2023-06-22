const Discord = require('discord.js');
const { REST, Routes } = require('discord.js');
const fs = require('fs')
const { Client, GatewayIntentBits } = require('discord.js');
const { Events, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');


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
    selectItem(interaction);
  } else if (interaction.commandName === 'resetorder') {
    
  } else if (interaction.commandName === 'pay') {
    
  }
});




//functions

/**
 * Prompts a form with order stuff and adds to order
 * @param {*} interaction 
 */
async function selectItem(interaction) {

  //read json to get stock
  let stock = JSON.parse(fs.readFileSync('stock.json'));

  //show options
  const select = new StringSelectMenuBuilder()
    .setCustomId('gunselection')
    .setPlaceholder('Please select your item');
  
  //stock checks
  for (var gun in stock) {
    if (stock[gun].available > 0) {
      select.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(gun)
          .setDescription(stock[gun].available + ' in stock')
          .setValue(gun)
      );
    }
  }


  const gunrow = new ActionRowBuilder().addComponents(select);

  const response = await interaction.reply({
    content: "Make a selection",
    components: [gunrow],
  });

  setTimeout(() => interaction.deleteReply(), 10000);

  const collectorFilter = i => i.user.id === interaction.user.id;

  try {
    const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });
    if (confirmation.customId === 'gunselection') {
      //show quantity
      await selectQuantity(confirmation, confirmation.values[0], stock[confirmation.values[0]].available);
    } 
  } catch (e) {
    console.log(e);
    await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
    return;
  }
  
}

/**
 * Prompts a modal to fill out for quantity
 * @param {*} interaction 
 * @param {String} item 
 * @param {Number} stock
 * @returns 
 */
async function selectQuantity(interaction, item, stock) {

  const modal = new ModalBuilder()
    .setCustomId('ordermodal')
    .setTitle('Gun Order: ' + item);

  const quantity = new TextInputBuilder()
    .setCustomId('quantityinput')
    .setLabel('Enter Quantity: (' + stock.toString() + 'x in stock)')
    .setStyle(TextInputStyle.Short);

  const quantrow = new ActionRowBuilder().addComponents(quantity);

  modal.addComponents(quantrow);

  await interaction.showModal(modal);
  
  // Collect a modal submit interaction
  const filter = (interaction) => interaction.customId === 'ordermodal';
  interaction.awaitModalSubmit({ filter, time: 15_000 })
    .then(interaction => addOrder(interaction, item))
    .catch(console.error);
}

/**
 * Adds item to order after modal submit
 * @param {*} interaction 
 */
async function addOrder(interaction) {
  console.log(interaction);
  await interaction.reply({ content: 'Added!' });
  let orders = JSON.parse(fs.readFileSync('orders.json'));

  if (orders[interaction.user.id]) {
    //orders[interaction.user.id].push()
  } else {

  }
}
 


//Leave at end
client.login(process.env.BOT_TOKEN); //BOT_TOKEN is the Client Secret
