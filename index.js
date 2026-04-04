// Require the necessary discord.js classes
const { Client, Intents, MessageButton, MessageActionRow, MessageEmbed, VoiceChannel, Message } = require('discord.js');
const { joinVoiceChannel, entersState, createAudioPlayer, createAudioResource, VoiceConnectionStatus, VoiceConnectionState, getVoiceConnection, VoiceConnection, PlayerSubscription, NoSubscriberBehavior, DiscordStream, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const { token, YTkey } = require('./config.json');

// Create a new client instance
const client = new Client(
{ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});


const ffmpeg = require('ffmpeg-static');
console.log('ffmpeg path:', ffmpeg);


class Phase{    
    // constructor(intro_path, loop_path, outro_path)
    // {
    //     this.current_path = intro_path;

    //     this.intro_path = intro_path;
    //     this.loop_path = loop_path;
    //     this.outro_path = outro_path;
    // }

    constructor(loop_path)
    {
        this.current_path = loop_path;

        this.intro_path = loop_path;
        this.loop_path = loop_path;
        this.outro_path = loop_path;
    }

    get_current_path = function()
    {
        let temp = this.current_path;
        this.current_path = this.loop_path;
        return temp;
    }
}

const phases = [
    // new Phase("./Audios/JJK3/bull of hell - 1.wav"),
    // new Phase("./Audios/JJK3/bull of hell - 2.wav"),
    new Phase("./Audios/JJK3/urgot.ogg")
]


// STATES

let phase_idx = 0;
let hasListener = false;
let playing = false;
let stopFlag = true;
let connection = null;
let subscription = null;
let transitionFlag = false;

let player = null;


/**
 * When the client is ready, run this code (only once)
 */
client.once('ready', () => {
    console.log('Ready!');
    client.user.setPresence({ activities: [{ name: "you", type: "WATCHING" }] });
});


client.on("interactionCreate", async interaction => {
    const { commandName } = interaction;

    var voice_id = interaction.guild.members.cache.get(interaction.member.user.id).voice.channelId;
    var guild_id = interaction.guildId;
    var currChannel = interaction.channel;

    if (!voice_id) {
        return interaction.editReply("...");
    }

    await interaction.deferReply();

    await new Promise(r => setTimeout(r, 200));

    const existingConnection = getVoiceConnection(guild_id);
    if (existingConnection && existingConnection.state.status !== VoiceConnectionStatus.Destroyed) {
        existingConnection.destroy()
    } else {
        connection = joinVoiceChannel({
            channelId: voice_id,
            guildId: guild_id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            debug: true,
        });

        connection.on('stateChange', (oldState, newState) => {
            console.log(`Connection: ${oldState.status} -> ${newState.status}`);
        });
    }

    if (!interaction.guild?.voiceAdapterCreator) {
        console.log("Adapter missing!");
    }

    try
    {
        await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
    }
    catch
    {
        console.log("whonmp")
    }
    
    addListener();

    if (commandName === 'start')
        command_start(interaction)
    else if (commandName === 'wait')
        command_wait(interaction)
    else if (commandName === 'continue')
        command_continue(interaction)
    else if (commandName === 'stop')
        command_stop(interaction)
    else if (commandName === 'finale')
        command_finale(interaction)
});


let addListener = function () {
    if (!hasListener) {
        hasListener = true;

        player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        })

        player.on('error', err => {
            console.error('Player error:', err.message);
            console.error(err);
        });

        player.on('stateChange', (oldState, newState) => {
            console.log(`Player: ${oldState.status} -> ${newState.status}`);
        });

        /**
         * Defines behavior for when the players reach the end of their audio sources.
         * Depending on if the player was stopped, it ether pauses them immediately after
         * creating them or continues to play.
         */
        player.on(AudioPlayerStatus.Idle, () => {
            if (!playing)
                return;
            
            // checking if the player is stopped or not
            if (stopFlag) {
                reset_player()
                return;
            }
        
            if (phase_idx < phases.length)
            {
                let path = phases[phase_idx].get_current_path()

                source = createAudioResource(path, {
                    metadata: {
                        title: "finale",
                    },
                    inputType: StreamType.OggOpus
                });

                player.play(source);
            }
            else
            {
                reset_player();
            }
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            if (!stopFlag) {
                await currChannel.send("Peace ;)");

                reset_player()

                if (connection.state.status != VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                }

                console.log('exiting');
            }
        });
    }

}


async function command_start(interaction) {
    stopFlag = false;

    if (player.state.status === 'paused') {
        await interaction.editReply('unpaused');
        player.unpause();
    } else {
        await interaction.editReply("...");

        let sub = connection.subscribe(player);

        let path = phases[phase_idx].get_current_path();
        let source = createAudioResource(path, {
            metadata: {
                title: "finale",
            },
            inputType: StreamType.OggOpus
        });
        player.play(source);
        playing = true;

        console.log('playing path: ' + path);
    }
}


async function command_stop(interaction)
{
    if (stopFlag) {
        await interaction.editReply("...");

        console.log("tried to leave when haven't joined.");

        return;
    }

    await interaction.editReply("...");

    stopFlag = true;
    player.stop()

    console.log("stopping");
}


// Ends current phase, progresses to next phase
async function command_finale(interaction)
{
    if (stopFlag) {
        await interaction.editReply("");

        console.log("tried to switch to finale too early");

        return;
    }

    await interaction.editReply("...");

    outro = createAudioResource(phases[phase_idx].outro_path, {
        metadata: {
            title: "outro",
        },
        inputType: StreamType.OggOpus
    });

    // increment after, so idle catches phase transition
    phase_idx++;

    player.play(outro);
}


async function command_continue(interaction)
{
    if (player.state.status === 'paused') {
        await interaction.editReply("unpaused");

        player.unpause();

        console.log("unpausing");
    } else {
        await interaction.editReply("...");

        console.log("did not unpause");
    }
}


async function command_wait(interaction)
{
    if (stopFlag) {
        await interaction.editReply("...");

        console.log('didn\'t do anything');

        return;
    }

    if (player.state.status === 'paused') {
        await interaction.editReply("...");

        console.log("did not pause");
    } else {
        await interaction.editReply("paused.")

        player.pause();

        console.log("paused");
    }
}


async function reset_player()
{
    player.stop();
    connection.destroy();
    playing = false;
    hasListener = false;
    phase_idx = 0
    transitionFlag = false;
    console.log("stopped");
}


// Login to Discord with your client's token
client.login(token);