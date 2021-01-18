import { getModelForClass } from "@typegoose/typegoose";
import { Command } from "discord-akairo";
import { Message, MessageEmbed, GuildMember } from "discord.js";
import MemberModel from "../../models/MemberModel";

export default class Whitelist extends Command {
  public constructor() {
    super("whitelist", {
      aliases: ["whitelist"],
      channel: "guild",
      category: "Moderation",
      userPermissions: ["MANAGE_CHANNELS"],
      description: {
        content:
          "Whitelists a user to use the bot. [Used only if they're blacklisted]",
        usage: "whitelist <ID or Mention>",
        examples: ["whitelist @Axis#0001", "whitelist 100690330336129024"],
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
    const currentModel = await memberModel.findOne({
      guildId: message.guild.id,
      userId: member.id,
    });
    if (!currentModel.blacklisted) {
      embed.setColor(0xff0000);
      embed.setDescription(`Member is currently not blacklisted.`);
      return message.util.send(embed);
    }
    try {
      await memberModel.findOneAndUpdate(
        {
          guildId: message.guild.id,
          userId: member.id,
        },
        {
          userId: member.id,
          blacklisted: false,
        },
        { upsert: true }
      );
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(`Couldn't whitelist user in DB: **${e.message}**`);
      return message.util.send(embed);
    }
    embed.setDescription(
      `Whitelisted user successfully | **${member.user.tag}**`
    );
    return message.channel.send(embed);
  }
}
