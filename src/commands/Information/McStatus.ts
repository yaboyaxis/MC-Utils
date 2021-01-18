import { Command } from "discord-akairo";
import { Message, MessageEmbed } from "discord.js";
import req from "@helperdiscord/centra";

export default class MCStatus extends Command {
  public constructor() {
    super("mcstatus", {
      aliases: ["mcstatus", "mcserver", "mc"],
      category: "Information",
      channel: "guild",
      description: {
        content: "Checks the status of the minecraft server!",
        usage: "mcstatus",
        examples: ["mc"],
      },
      ratelimit: 1,
    });
  }

  public async exec(message: Message): Promise<void> {
    const embed = new MessageEmbed();
    const res = await req(
      "https://mc-api.net/v3/server/ping/play.soundmc.world",
      "GET"
    )
      .header("content_type", "application/json")
      .send();

    if (res.statusCode !== 200) {
      embed
        .setColor("RED")
        .setDescription(`An error occurred while fetching the server data.`)
        .setFooter(`Status: ${res.statusCode}`);

      return void message.channel.send(embed);
    }

    const response = res.json();

    if (response.data?.online) {
      embed.setColor("GREEN").addField("Server Online", "Yes", true);
    } else {
      embed.setColor("RED").addField("Server Online", "No", true);

      return void message.util.send(embed);
    }

    embed
      .addField(
        "Player Count",
        `${response.data.players.online} / ${response.data.players.max}`,
        false
      )
      .addField("Version", response.data.version.name, false)
      .setThumbnail(response.data.favicon);

    return void message.channel.send(embed);
  }
}
