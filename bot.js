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
    setTimeout(() => interaction.deleteReply(), 30000);
  } else if (interaction.commandName === 'order') {
    selectItem(interaction);
  } else if (interaction.commandName === 'resetorder') {
    resetOrder(interaction);
  } else if (interaction.commandName === 'pay') {
    pay(interaction);
  } else if (interaction.commandName === 'refresh') {
    await interaction.reply({ content: 'Refreshing Order!'});
    setTimeout(() => interaction.deleteReply(), 5000);
    refresh(interaction);
  } else if (interaction.commandName === 'removeorder') {
    remove(interaction);
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
    setTimeout(() => interaction.deleteReply(), 30000);
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
        setTimeout(() => interaction.deleteReply(), 30000);
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
  setTimeout(() => refresh(interaction), 2000);
  setTimeout(() => interaction.deleteReply(), 120000);
}

/**
 * refreshes the embed
 * @param {*} interaction 
 */
async function refresh(interaction) {
  
  let orders = JSON.parse(fs.readFileSync('orders.json'));
  let stock = JSON.parse(fs.readFileSync('stock.json'));
  let data = JSON.parse(fs.readFileSync('data.json'));
  let grandtotal = 0

  const order = new EmbedBuilder()
    .setColor(0xEB6E1F)
    .setTitle('Gun Order')
    .setURL('https://echorp.fandom.com/wiki/Category:Gangs')
    .setAuthor({ name: "Big Hoover ", iconUrl: "https://i.imgur.com/cLzGRhf.png"})
    .setThumbnail('https://i.imgur.com/cLzGRhf.png')
    .setTimestamp();
  
  for (member in orders) {
    let x = "";
    let total = 0;

    for (o in orders[member]) {
      if (o !== "paid" && o !== "nickname") {
        let sub = stock[o].price*orders[member][o];
        x = x + orders[member][o] + "x " + o + " $" + (sub) + "\n";
        total += sub;
      }
    }


    x = x + "**TOTAL: $" + total + "**\n";
    if (orders[member].paid) {
      x = x + 'Paid: YES';
    } else {
      x = x + 'Paid: NO';
    }
    order.addFields({ name: orders[member].nickname, value: x, inline: true });
    grandtotal += total;
  }

  order.setDescription('🔫**Grand Total: $' + grandtotal + '**');

  //save id
  if (data.embed) {
    client.channels.fetch(data.channel).then(channel => {
      channel.messages.delete(data.embed);
    }); 
  }

  const res = await interaction.channel.send({ embeds: [order] });
  data.embed = res.id;
  data.channel = interaction.channelId
  fs.writeFileSync('data.json', JSON.stringify(data));

}

/**
 * Resets the whole order
 * @param {*} interaction 
 */
async function resetOrder(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('resetmodal')
    .setTitle('💣Reset Order💣, are you sure you want to do this?');

  await interaction.showModal(modal);
  
  // Collect a modal submit interaction
  const filter = (interaction) => interaction.customId === 'resetmodal';
  interaction.awaitModalSubmit({ filter, time: 15_000 })
    .then(interaction => {
      interaction.reply({ content: '💣Order Cleared💣'});
      setTimeout(() => interaction.deleteReply(), 30000);
      fs.writeFileSync('orders.json', JSON.stringify({}));
      let stock = JSON.parse(fs.readFileSync('stock.json'));
      for (gun in stock) {
        stock[gun].available = stock[gun].stock;
      }
    })
    .catch(console.error);
  
}

/**
 * Removes your own order
 * @param {*} interaction 
 */
async function remove(interaction) {
  let orders = JSON.parse(fs.readFileSync('orders.json'));
  let stock = JSON.parse(fs.readFileSync('stock.json'));

  for (gun in orders[interaction.user.id]) {
    if (gun !== 'paid' && gun !== 'nickname')
      stock[gun].available += orders[interaction.user.id][gun];
  }

  delete orders[interaction.user.id];
  fs.writeFileSync('orders.json', JSON.stringify(orders));
  fs.writeFileSync('stock.json', JSON.stringify(stock));
  await interaction.reply({ content: "Your order has been **removed**, " + interaction.member.nickname});
  setTimeout(() => interaction.deleteReply(), 30000);
  refresh(interaction);
}

/**
 * marks order as paid
 * @param {*} interaction 
 */
async function pay(interaction) {
  let orders = JSON.parse(fs.readFileSync('orders.json'));
  orders[interaction.user.id].paid = true;
  fs.writeFileSync('orders.json', JSON.stringify(orders));
  await interaction.reply({ content: "Your order has been marked as **PAID**, " + interaction.member.nickname});
  setTimeout(() => interaction.deleteReply(), 30000);
  refresh(interaction);
}
 


//Leave at end
client.login(process.env.BOT_TOKEN); //BOT_TOKEN is the Client Secret
