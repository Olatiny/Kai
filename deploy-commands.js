const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
    new SlashCommandBuilder().setName('start')
		.setDescription('Play the song OR resume previous song'),

	new SlashCommandBuilder().setName('wait')
		.setDescription('Pause the song'),

	new SlashCommandBuilder().setName('stop')
		.setDescription('Get bot to leave chat'),

	new SlashCommandBuilder().setName('continue')
		.setDescription('Resume a paused song'),

	new SlashCommandBuilder().setName('finale')
		.setDescription('Switch between instrumental and vocal tracks'),

]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationCommands(clientId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);

// rest.get(Routes.applicationGuildCommands(clientId, guildId))
// 	.then(data => {
// 		const promises = [];
// 		for (const command of data) {
// 			const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
// 			promises.push(rest.delete(deleteUrl));
// 		}
// 		return Promise.all(promises);
// 	});