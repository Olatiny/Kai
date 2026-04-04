const WebSocket = require('ws');
const ws = new WebSocket('wss://c-iad08-68bb343d.discord.media:2083', {
    headers: { 'User-Agent': 'DiscordBot' }
});
ws.on('open', () => console.log('WS connected!'));
ws.on('message', msg => console.log('Got:', msg.toString()));
ws.on('error', err => console.error('WS error:', err));
ws.on('close', (code, reason) => console.log('WS closed:', code, reason.toString()));