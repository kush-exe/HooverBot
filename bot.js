const Discord = require('discord.js');
const { REST, Routes } = require('discord.js');
const fs = require('fs')
const { Client, GatewayIntentBits } = require('discord.js');
const { Events, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { EmbedBuilder } = require('discord.js');


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
    description: '💣Resets the ENTIRE order💣',
  },

  {
    name: 'removeorder',
    description: 'Removes your personal order',
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
    name: 'refresh',
    description: 'Refreshes the order viewer'
  }

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
    
  } else if (interaction.commandName === 'refresh') {
    refresh();
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

  setTimeout(() => interaction.deleteReply(), 120000);

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
    .then(interaction => {
      const quantity = Number(interaction.fields.getTextInputValue('quantityinput'));
      if (quantity > stock) {
        interaction.reply({ content: 'Not enough in stock'});
      } else {
        addOrder(interaction, item, quantity)
      }
    })
    .catch(console.error);
}

/**
 * Adds item to order
 * @param {*} interaction 
 * @param {*} item 
 * @param {*} quantity 
 */
async function addOrder(interaction, item, quantity) {

  let orders = JSON.parse(fs.readFileSync('orders.json'));
  let stock = JSON.parse(fs.readFileSync('stock.json'));

  //create order per discord id if not exists
  if (orders[interaction.user.id] === undefined) {
    orders[interaction.user.id] = {
      paid: false,
      nickname: interaction.member.nickname
    };
  }

  //add to quantity if item is already in order
  if (orders[interaction.user.id][item]) {
    orders[interaction.user.id][item] += quantity;
  } else { //otherwise create the field
    orders[interaction.user.id][item] = quantity;
  }

  //reduce quantity
  stock[item].available -= quantity;

  //write both json files
  fs.writeFileSync('orders.json', JSON.stringify(orders));
  fs.writeFileSync('stock.json', JSON.stringify(stock));

  await interaction.reply({ content: 'Added ' + quantity.toString() + 'x ' + item + ' to your order ' + interaction.member.nickname});
  setTimeout(() => interaction.deleteReply(), 120000);
}

async function refresh(interaction) {
  interaction.deferReply();
  await interaction.reply({ content: 'Refreshing Order!'});
  setTimeout(() => interaction.deleteReply(), 5000);
  let orders = JSON.parse(fs.readFileSync('orders.json'));

  const order = new EmbedBuilder()
    .setColor(0xEB6E1F)
    .setTitle('Gun Order')
    .setUrl('https://echorp.fandom.com/wiki/Category:Gangs')
    .setAuthor({ name: "Big Hoover ", iconUrl: "https://i.imgur.com/cLzGRhf.png"})
    .setDescription("🔫😈💣")
    .setThumbnail('https://i.imgur.com/cLzGRhf.png')
    .setTimeStamp();
  
  for (member in orders) {
    let x = "";

    for (o in orders[member]) {
      if (o !== "paid" && o !== "nickname") {
        x = x + orders[member][o] + "x " + o;
      }
    }

    if (o.length > 0)
      order.addFields({ name: orders[member].nickname, value: x, inline: true });
  }


  await interaction.channel.send({ embeds: [order] });

}
 


//Leave at end
client.login(process.env.BOT_TOKEN); //BOT_TOKEN is the Client Secret
