import { Command } from "discord-akairo";
import { Message, MessageEmbed, version as v } from "discord.js";
import { version } from "../../../package.json";

export default class BotInfo extends Command {
  public constructor() {
    super("botinfo", {
      aliases: ["botinfo"],
      channel: "guild",
      category: "Information",
      ratelimit: 3,
      description: {
        content: "Shows information about the bot.",
        usage: "botinfo",
        examples: ["botinfo"],
      },
    });
  }

  public async exec(message: Message): Promise<Message> {
    return message.util.send(
      new MessageEmbed()
        .setTitle(`${this.client.user.username}'s Info`)
        .setDescription(
          `<@!${this.client.user.id}> is a multipurpose bot written by **Axis#9999** and **Vetlix#0921**.`
        )
        .setThumbnail(this.client.user.displayAvatarURL())
        .addField("Bot Version", `\`${version}\``, true)
        .addField("Ping", `\`${Math.round(this.client.ws.ping)}ms\``, true)
        .addField(
          "RAM Usage",
          `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB\``
        )
        .addField("Library and Version", `\`Discord.JS v${v}\``, false)
    );
  }
}
