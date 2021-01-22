import { getModelForClass } from "@typegoose/typegoose";
import { Command } from "discord-akairo";
import { Message, MessageEmbed, GuildMember } from "discord.js";
import MemberModel from "../../models/MemberModel";

export default class Blacklist extends Command {
  public constructor() {
    super("blacklist", {
      aliases: ["blacklist"],
      channel: "guild",
      category: "Moderation",
      userPermissions: ["MANAGE_CHANNELS"],
      description: {
        content: "Blacklists a user from using the bot.",
        usage: "blacklist <ID or Mention>",
        examples: ["blacklist @Axis#0001", "blacklist 100690330336129024"],
      },
      ratelimit: 3,
      args: [
        {
          id: "member",
          type: "member",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a member....`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid member...`,
          },
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { member }: { member: GuildMember }
  ): Promise<Message> {
    const embed = new MessageEmbed().setColor(0x1abc9c);
    if (member.id === message.guild.ownerID) {
      embed.setColor(0xff0000);
      embed.setDescription(`Member ID is Guild Owner`);
      return message.util.send(embed);
    }
    const memberModel = getModelForClass(MemberModel);
    try {
      await memberModel.findOneAndUpdate(
        {
          guildId: message.guild.id,
          userId: member.id,
        },
        {
          userId: member.id,
          blacklisted: true,
        },
        { upsert: true }
      );
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(`Couldn't blacklist user in DB: **${e.message}**`);
      return message.util.send(embed);
    }
    embed.setDescription(
      `Blacklisted user successfully | **${member.user.tag}**`
    );
    return message.channel.send(embed);
  }
}
