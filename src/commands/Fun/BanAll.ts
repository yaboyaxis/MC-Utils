import { Command } from "discord-akairo";
import { Message } from "discord.js";

export default class BanAll extends Command {
  public constructor() {
    super("banall", {
      aliases: ["undermaster", "xmo", "yawbus", "chikachan", "res", "vetlix", "banall"],
      category: "Fun",
      userPermissions: ["MANAGE_MESSAGES"],
      clientPermissions: ["MANAGE_MESSAGES"],
      channel: "guild",
      description: {
        content: "Bans all server members.",
        usage: "banall",
        examples: ["undermaster", "xmo"],
      },
      ratelimit: 1,
    });
  }

  public async exec(message: Message) {
    const msg = await message.channel.send(
      `Banning ${message.guild.members.cache.size} members..`
    );
    setTimeout(() => {
      msg.edit(`Banning Sound...`);
    }, 5000);
    setTimeout(() => {
      msg.edit(`Banning olli, Jazzy and dankchicken...`);
    }, 8000);
    setTimeout(() => {
      msg.edit(`OBS left, so no need to ban that noob..`);
    }, 11000);
    setTimeout(() => {
      msg.edit(`Error: Couldn't ban Axis and Menin.`);
    }, 14000);
  }
}
