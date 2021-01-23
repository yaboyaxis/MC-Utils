import Client from './lib/Client';
import { DISCORD_TOKEN, PREFIX } from './BotConfig';

const client = new Client({
    caseInsensitiveCommands: true,
    defaultPrefix: PREFIX,
    ws: {
        intents: 513
    }
});

client.login(DISCORD_TOKEN);