import config from "./config";
import BotClient from "./client/BotClient";

const token: string = config.bot.token;
const owners: string[] = config.bot.owners;

const client = new BotClient({ token, owners });

client.start();
// dank is gay
