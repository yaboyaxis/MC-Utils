import { Listener } from "discord-akairo";
import { Guild, MessageEmbed, TextChannel, User } from "discord.js";
import config from "../config";
import { utc } from "moment";
import { log } from "../structures/Utils";

export default class guildBanAdd extends Listener {
  public constructor() {
    super("guildBanAdd", {
      emitter: "client",
      event: "guildBanAdd",
      type: "on",
    });
  }

  public async exec(guild: Guild, user: User): Promise<void> {
    let logChannel: TextChannel = guild.channels.cache.get(
      config.channels.logChannel
    ) as TextChannel;
    let dateString: string = utc().format("MMMM Do YYYY, h:mm:ss a");
    const fetchedBan = await guild.fetchBan(user);

    const embed: MessageEmbed = new MessageEmbed()
      .setAuthor("User Banned", user.displayAvatarURL({ dynamic: true }))
      .setColor("RED")
      .addField("User Mention:", `<@!${user.id}>`, true)
      .addField("Reason", fetchedBan.reason || "No Reason", true)
      .addField("Time Banned:", dateString, true)
      .setFooter(`ID: ${user.id} | ${dateString}`);

    return log(logChannel, embed, guild.iconURL());
  }
}
