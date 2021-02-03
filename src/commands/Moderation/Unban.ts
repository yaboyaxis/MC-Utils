import { getModelForClass } from "@typegoose/typegoose";
import { Command } from "discord-akairo";
import { User, Message, MessageEmbed } from "discord.js";
import { utc } from "moment";
import memberModel, { CaseInfo } from "../../models/MemberModel";
import Logger from "../../structures/Logger";
import uniqid from "uniqid";
import { findChannel, modLog } from "../../structures/Utils";
import config from "../../config";

export default class Unban extends Command {
  public constructor() {
    super("unban", {
      aliases: ["unban", "pardon"],
      category: "Moderation",
      channel: "guild",
      description: {
        content: "Unbans a member from the server.",
        usage: "unban [ID or Mention] <reason>",
        examples: [
          "unban @Axis#0001 Reversal",
          "pardon 224981331078021124 Didn't do it",
        ],
      },
      ratelimit: 3,
      userPermissions: ["BAN_MEMBERS"],
      args: [
        {
          id: "user",
          type: "user",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a user to unban...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid user to unban...`,
          },
        },
        {
          id: "reason",
          type: "string",
          match: "rest",
          default: "",
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { user, reason }: { user: User; reason: string }
  ): Promise<Message> {
    const embed = new MessageEmbed().setColor(0x00ff0c);
    let dateString: string = utc().format("MMMM Do YYYY, h:mm:ss a");
    let userId = user.id;
    let guildID = message.guild.id;

    let caseNum = uniqid();
    const caseInfo: CaseInfo = {
      caseID: caseNum,
      moderator: message.author.tag,
      moderatorId: message.author.id,
      user: `${user.tag} (${user.id})`,
      date: dateString,
      type: "Unban",
      reason,
    };

    const sanctionsModel = getModelForClass(memberModel);
    try {
      await sanctionsModel.findOneAndUpdate(
        {
          guildId: guildID,
          userId: userId,
        },
        {
          guildId: guildID,
          userId: userId,
          $push: {
            sanctions: caseInfo,
          },
        },
        {
          upsert: true,
        }
      );
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(`Error logging unban to DB: **${e.message}**`);
      return message.util.send(embed);
    }
      
    try {
      await message.guild.fetchBan(user);
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription("The ban for the specified user doesn't exist.");
      return message.util.send(embed);
    }
      
    try {
      await message.guild.members.unban(user.id, reason);
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(`Couldn't unban user because of: **${e}**`);
      return message.util.send(embed);
    }
    embed.setDescription(`Unbanned **${user.tag}** | \`${caseNum}\``);
    await message.channel.send(embed);

    const logEmbed = new MessageEmbed()
      .setTitle(`Member Unbanned | Case \`${caseNum}\` | ${user.tag}`)
      .addField(`User:`, `<@${user.id}>`, true)
      .addField(`Moderator:`, `<@${message.author.id}>`, true)
      .addField(`Reason:`, reason, true)
      .setFooter(`ID: ${user.id} | ${dateString}`)
      .setColor("RED");

    let modlogChannel = findChannel(this.client, config.channels.modLogChannel);
    modLog(modlogChannel, logEmbed, message.guild.iconURL());
  }
}
