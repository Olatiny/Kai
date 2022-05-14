// Require the necessary discord.js classes
const { Client, Intents, MessageButton, MessageActionRow, MessageEmbed, VoiceChannel, Message } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, getVoiceConnection, VoiceConnection, PlayerSubscription, NoSubscriberBehavior, DiscordStream, AudioPlayerStatus } = require('@discordjs/voice');
const { token, YTkey } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]});

/**
 * When the client is ready, run this code (only once)
 */
 client.once('ready', () => {
	console.log('Ready!');
    client.user.setPresence({activities: [{name: "you", type: "WATCHING"}]});
});

const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
    }
});

client.on("interactionCreate", async interaction => {
    const {commandName} = interaction;

    var voice_id = interaction.guild.members.cache.get(interaction.member.user.id).voice.channelId;
    var guild_id = interaction.guildId;
    var currChannel = interaction.channel;

    if (!voice_id) {
        return interaction.reply("You need to be in a voice channel to do that!");
    }

    connection = joinVoiceChannel({
        channelId: voice_id,
        guildId: guild_id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    addListener(connection);


});

// Login to Discord with your client's token
client.login(token);