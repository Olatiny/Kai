const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

// Define your current commands
const commands = [
  new SlashCommandBuilder().setName('start').setDescription('Play the song OR resume previous song'),
  new SlashCommandBuilder().setName('wait').setDescription('Pause the song'),
  new SlashCommandBuilder().setName('stop').setDescription('Get bot to leave chat'),
  new SlashCommandBuilder().setName('continue').setDescription('Resume a paused song'),
  new SlashCommandBuilder().setName('next-phase').setDescription('progress to next phase'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Fetching existing guild commands...');
    const existingGuild = await rest.get(Routes.applicationGuildCommands(clientId, guildId));

    // Delete all guild commands
    await Promise.all(existingGuild.map(cmd =>
      rest.delete(`${Routes.applicationGuildCommands(clientId, guildId)}/${cmd.id}`)
    ));
    console.log('Old guild commands cleared.');

    console.log('Fetching existing global commands...');
    const existingGlobal = await rest.get(Routes.applicationCommands(clientId));

    // Delete all global commands
    await Promise.all(existingGlobal.map(cmd =>
      rest.delete(`${Routes.applicationCommands(clientId)}/${cmd.id}`)
    ));
    console.log('Old global commands cleared.');

    // Deploy new commands to the guild (instant update)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('New commands deployed successfully.');
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
})();