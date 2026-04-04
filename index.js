// Require the necessary discord.js classes
const { Client, GatewayIntentBits, MessageButton, MessageActionRow, MessageEmbed, VoiceChannel, Message } = require('discord.js');
const { joinVoiceChannel, entersState, createAudioPlayer, createAudioResource, VoiceConnectionStatus, VoiceConnectionState, getVoiceConnection, VoiceConnection, PlayerSubscription, NoSubscriberBehavior, DiscordStream, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const { token, YTkey } = require('./config.json');


// Current bot client intents declaration
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
    ]
});


/**
 * Wrapper class for phase path data
 */
class Phase {
    constructor(loop_path)
    {
        this.intro_path = loop_path;
        this.loop_path = loop_path;

        this.current_path = this.intro_path;

        this.msg_play = "`HOLD ON TO YOUR [[silly strings]]!! EHEHEHE!`";
        this.msg_pause = "`PLAYER(s)! EHAHEHAHEHAHEHUE. YOU THINK YOU CAN [[pause]] ME?`\n-# [[you can]]";
        this.msg_resume = "`...WHERE DID YOU [[go]]... I'VE BEEN WAITING!!!`";
        this.msg_next_phase = "`DID YOU KNOW ? IF YOU [[die]] YOU [[Level Up!]]! [[God]] TOLD ME! 100% [[antiques]] & [[Fact Checked By Real American Patriots]]`";
        this.msg_stop = "## `WISHLIST [[apocalypse]] `[APPROACHES](<https://s.team/a/3581870>)` ON [[steam]] [[only!]] -200 Kromer`";
    
        this.msg_havent_joined = "`PLAYER(s)! THIS [[Festival of Lights]] HASNT EVEN [[Gotten]]`";
        this.msg_cant_do_next_phase = "`[[hyperlink blocked]]!! NO CHEATING, HEHEHE!`";
        this.msg_already_paused = "`YOU ALREADY [[please make it stop, please...]] ME!!`";
        this.msg_already_playing = "`PLAYER(s)! SLOW [[one small step]] THIS [[Non-stop Flight to]] HAS ALREADY [[Breaking]] ALREADY [[Bad]] ENOUGH!`";
    }

    get_current_path()
    {
        let temp = this.current_path;
        this.current_path = this.loop_path;
        return temp;
    }
}


/** List of phases in bot */
const phases = [
    new Phase("./Audios/JJK3/bull of hell - 1.ogg"),
    new Phase("./Audios/JJK3/bull of hell - 2 - loop.ogg"),
    new Phase("./Audios/JJK3/urgot.ogg")
]

phases[1].intro_path = "./Audios/JJK3/bull of hell - 2 - intro.ogg"
phases[1].current_path = phases[1].intro_path

phases[0].msg_next_phase = "`HOLY [[cow]] A NEW [[1]]?`"
phases[2].msg_next_phase = "`...help...`"


// Current Phase index
let phase_idx = 0;

// Whether listeners have been added
let hasListener = false;

// Whether is playing
let playing = false;

// Whether should stop at end of loop
let stopFlag = true;

// Current connection
let connection = null;

// Current audio player
let player = null;

// Current channel
let currChannel = null


/**
 * When the client is ready, run this code (only once)
 */
client.once('clientReady', () => {
    console.log('Ready!');
    client.user.setPresence({ activities: [{ name: "you", type: "WATCHING" }] });
});


/**
 * Event for command submission
 */
client.on("interactionCreate", async interaction => {
    const { commandName } = interaction;

    // initialize command info
    await setup_connection_stuff(interaction);    
    
    // set up listeners if necessary
    addListener();

    // process commands:

    if (commandName === 'start')
        command_start(interaction)
    else if (commandName === 'wait')
        command_wait(interaction)
    else if (commandName === 'continue')
        command_continue(interaction)
    else if (commandName === 'stop')
        command_stop(interaction)
    else if (commandName === 'next-phase')
        command_next_phase(interaction)
});


// Sets up necessary stuff for this interaction and future ones to be processed
async function setup_connection_stuff(interaction)
{
    // caching voice and guild id
    var voice_id = interaction.guild.members.cache.get(interaction.member.user.id).voice.channelId;
    var guild_id = interaction.guildId;
    currChannel = interaction.channel;

    // no voice id
    if (!voice_id) {
        return interaction.editReply("...");
    }

    // defer reply for debugging and also for generally allowing slower load times
    await interaction.deferReply();

    // get current connection, if we don't have one yet then make a new one
    current_connection = getVoiceConnection(interaction.guildId);
    if (!current_connection)
    {
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

    // ensure connection succeeds before continuing
    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
    } catch(err) {
        console.log("failed to enter ready state: ", err);
    }
}


/**
 * Adds listeners to the current player and connection
 */
let addListener = function ()
{
    if (hasListener)
        return

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
            play_current_audio()
        else
            reset_player();
    });

    // What to do if the bot is disconnected manually
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        if (!stopFlag) {
            await currChannel.send("Peace ;)");

            reset_player()

            console.log('exiting');
        }
    });
}


/**
 * Command for starting this boss-fight
 * @param {Interaction} interaction 
 */
async function command_start(interaction)
{
    stopFlag = false;

    if (player.state.status === 'paused') {
        await interaction.editReply(phases[phase_idx].msg_resume);
        player.unpause();
    } else {
        await interaction.editReply(phases[phase_idx].msg_play);

        let sub = connection.subscribe(player);

        play_current_audio()
    }
}


/**
 * Command for stopping this boss fight
 * @param {Interaction} interaction 
 * @returns nada
 */
async function command_stop(interaction)
{
    if (stopFlag) {
        await interaction.editReply(phases[phase_idx].msg_havent_joined);

        console.log("tried to leave when haven't joined.");

        return;
    }

    await interaction.editReply(phases[phase_idx].msg_stop);

    stopFlag = true;
    player.stop()

    console.log("stopping");
}


/**
 * Command for ending the current phase and moving on to the next one
 * @param {Interaction} interaction 
 * @returns nada
 */
async function command_next_phase(interaction)
{
    if (stopFlag) {
        await interaction.editReply(phases[phase_idx].msg_cant_do_next_phase);

        console.log("tried to switch to next-phase too early");

        return;
    }

    await interaction.editReply(phases[phase_idx].msg_next_phase);

    if (phase_idx + 1 >= phases.length)
    {
        command_stop(interaction);
        return;
    }

    phase_idx++;
    play_current_audio()
}


/**
 * Command for continuing the paused playback, if paused
 * @param {Interaction} interaction 
 */
async function command_continue(interaction)
{
    if (player.state.status === 'paused') {
        await interaction.editReply(phases[phase_idx].msg_resume);

        player.unpause();

        console.log("unpausing");
    } else {
        await interaction.editReply(phases[phase_idx].msg_already_playing);

        console.log("did not unpause");
    }
}


/**
 * Command for pausing the playback
 * @param {Interaction} interaction 
 * @returns 
 */
async function command_wait(interaction)
{
    if (stopFlag) {
        await interaction.editReply(phases[phase_idx].msg_already_paused);

        console.log('didn\'t do anything');

        return;
    }

    if (player.state.status === 'paused') {
        await interaction.editReply(phases[phase_idx].msg_already_paused);

        console.log("did not pause");
    } else {
        await interaction.editReply(phases[phase_idx].msg_pause)

        player.pause();

        console.log("paused");
    }
}


/**
 * Helper for playing current phase's current audio. (intro and then loop)
 */
async function play_current_audio()
{
    let path = phases[phase_idx].get_current_path()
            
    source = createAudioResource(path, {
        metadata: {
            title: "next-phase",
        },
        inputType: StreamType.OggOpus
    });

    player.play(source);
    playing = true

    console.log('playing path: ' + path);
}


/**
 * Resets necessary states and ends the session
 */
async function reset_player()
{
    player.stop();
    connection.destroy();
    playing = false;
    hasListener = false;
    phases[1].current_path = phases[1].intro_path
    phase_idx = 0
    transitionFlag = false;
    console.log("stopped");
}


// Login to Discord with your client's token
client.login(token);