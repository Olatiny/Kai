// Require the necessary discord.js classes
const { Client, Intents, MessageButton, MessageActionRow, MessageEmbed, VoiceChannel, Message } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, VoiceConnectionState, getVoiceConnection, VoiceConnection, PlayerSubscription, NoSubscriberBehavior, DiscordStream, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const { token, YTkey } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });

const nightmareBeginningPath = "./Audios/JJK2/Sniper.mp3";
const nightmareMiddlePath = "./Audios/JJK2/Sniper.mp3";
const transitionPath = "./Audios/JJK2/world end intro.mp3";
const finaleBeginningPath = "./Audios/JJK2/world end loop.mp3";
const finaleMiddlePath = "./Audios/JJK2/world end loop.mp3";
const finaleLoopPath = "./Audios/JJK2/world end loop.mp3";
const finaleEndPath = "./Audios/JJK2/world end loop.mp3";

/**
 * When the client is ready, run this code (only once)
 */
client.once('ready', () => {
    console.log('Ready!');
    client.user.setPresence({ activities: [{ name: "you", type: "WATCHING" }] });
});

const player = createAudioPlayer({
    behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
    },
});

let hasListener = false;
let playing = false;
let stopFlag = true;
let connection = null;
let finaleFlag = false;
let nextState = "beginning";
let transitionFlag = false;

let addListener = function () {
    if (!hasListener) {
        hasListener = true;

        /**
         * Defines behavior for when the players reach the end of their audio sources.
         * Depending on if the player was stopped, it ether pauses them immediately after
         * creating them or continues to play.
         */
        player.on(AudioPlayerStatus.Idle, () => {
            if (playing) {
                // checking if the player is stopped or not
                if (stopFlag) {
                    player.stop();
                    connection.destroy();
                    playing = false;
                    hasListener = false;
                    finaleFlag = false;
                    nextState = "beginning";
                    transitionFlag = false;
                    console.log("stopped");
                    return;
                }

                if (transitionFlag) {
                    if (finaleFlag) {
                        if (nextState == "beginning") {
                            source = createAudioResource(finaleBeginningPath, {
                                metadata: {
                                    title: "finale",
                                },
                                // inputType: StreamType.OggOpus
                            });

                            player.play(source);

                            nextState = "middle";

                            console.log("beginning of finale");
                        } else if (nextState == "middle") {
                            source = createAudioResource(finaleMiddlePath, {
                                metadata: {
                                    title: "finale",
                                },
                                // inputType: StreamType.OggOpus
                            });

                            player.play(source);

                            nextState = "looping";

                            console.log("middle of finale");
                        }
                    } else {
                        player.stop();

                        if (connection.state.status != VoiceConnectionStatus.Destroyed) {
                            connection.destroy();
                        }

                        playing = false;
                        hasListener = false;
                        finaleFlag = false;
                        nextState = "beginning";
                        transitionFlag = false;

                        console.log("stopping in static");
                    }

                    transitionFlag = false;
                    return;
                }

                if (finaleFlag) {
                    if (nextState == "middle") {
                        transitionFlag = true;

                        static = createAudioResource(transitionPath, {
                            metadata: {
                                title: "static",
                            },
                        });

                        player.play(static);

                        console.log("finale static");
                    } else {
                        source = createAudioResource(finaleLoopPath, {
                            metadata: {
                                title: "finale",
                            },
                        });

                        player.play(source);

                        console.log("looping finale");
                    }
                } else {
                    source = createAudioResource(nightmareMiddlePath, {
                        metadata: {
                            title: "Your Best Nightmare",
                        },
                    });

                    player.play(source);

                    console.log("looping nightmare");
                }
            }
        });

        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            if (!stopFlag) {
                await currChannel.send("Peace ;)");

                stopFlag = true;

                player.stop();
                playing = false;

                finaleFlag = false;
                nextState = "beginning";
                transitionFlag = false;

                if (connection.state.status != VoiceConnectionStatus.Destroyed) {
                    connection.destroy();
                }

                console.log('exiting');
            }
        });
    }

}

client.on("interactionCreate", async interaction => {
    const { commandName } = interaction;

    var voice_id = interaction.guild.members.cache.get(interaction.member.user.id).voice.channelId;
    var guild_id = interaction.guildId;
    var currChannel = interaction.channel;

    if (!voice_id) {
        return interaction.reply("...");
    }

    connection = joinVoiceChannel({
        channelId: voice_id,
        guildId: guild_id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    addListener(connection);

    if (commandName === 'start') {
        stopFlag = false;

        if (player.state.status === 'paused') {
            await interaction.reply('unpaused');

            player.unpause;
        } else {
            await interaction.reply("...");

            if (!connection) {
                console.log(":(");
            }

            connection.subscribe(player);

            let source = createAudioResource(nightmareBeginningPath, {
                metadata: {
                    title: "Your Best nightmare",
                },
                // inputType: StreamType.OggOpus
            });

            player.play(source);
            playing = true;

            console.log('playing');
        }
    } else if (commandName === 'wait') {
        if (stopFlag) {
            await interaction.reply("...");

            console.log('didn\'t do anything');

            return;
        }

        if (player.state.status === 'paused') {
            await interaction.reply("...");

            console.log("did not pause");
        } else {
            await interaction.reply("paused.")

            player.pause();

            console.log("paused");
        }
    } else if (commandName === 'continue') {
        if (player.state.status === 'paused') {
            await interaction.reply("unpaused");

            player.unpause();

            console.log("unpausing");
        } else {
            await interaction.reply("...");
 
            console.log("did not unpause");
        }
    } else if (commandName === 'stop') {
        if (stopFlag) {
            await interaction.reply("...");

            console.log("tried to leave when haven't joined.");

            return;
        }

        await interaction.reply("...");

        stopFlag = true;
        player.stop()

        console.log("stopping");
    } else if (commandName === 'finale') {
        if (stopFlag) {
            await interaction.reply("");

            console.log("tried to switch to finale too early");

            return;
        }

        await interaction.reply("...");

        finaleFlag = true;

        static = createAudioResource(transitionPath, {
            metadata: {
                title: "static",
            },
        });

        player.play(static);
    }
});

// Login to Discord with your client's token
client.login(token);