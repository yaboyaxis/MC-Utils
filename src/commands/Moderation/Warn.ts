import { Command } from "discord-akairo";
import { Message, GuildMember, MessageEmbed } from "discord.js";
import {
  dmUserOnInfraction,
  findChannel,
  modLog,
  sendLogToChannel,
} from "../../structures/Utils";
import config from "../../config";
import { utc } from "moment";
import Logger from "../../structures/Logger";
import memberModel, { CaseInfo } from "../../models/MemberModel";
import { getModelForClass } from "@typegoose/typegoose";
import uniqid from "uniqid";

export default class Warn extends Command {
  public constructor() {
    super("warn", {
      aliases: ["warn", "w"],
      category: "Moderation",
      channel: "guild",
      description: {
        content: "Warns a member in the server.",
        usage: "warn [ID or Mention] <reason>",
        examples: ["warn @Axis#0001", "warn 534479985855954965 swearing"],
      },
      ratelimit: 3,
      userPermissions: ["MANAGE_MESSAGES"],
      args: [
        {
          id: "member",
          type: "member",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a member to warn...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid member to warn...`,
          },
        },
        {
          id: "reason",
          type: "string",
          match: "rest",
          default: "No reason provided.",
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { member, reason }: { member: GuildMember; reason: string }
  ): Promise<Message> {
    const embed = new MessageEmbed().setColor(0x00ff0c);
    if (member.id === message.author.id) {
      embed.setColor(0xff0000);
      embed.setDescription("You cannot warn yourself!");
      return message.util.send(embed);
    }
    if (member.user.bot) {
      embed.setColor(0xff0000);
      embed.setDescription("You cannot warn a bot!");
      return message.util.send(embed);
    }
    if (
      (message.member.guild.ownerID !== message.author.id &&
        member.roles.highest.position >
          message.member.roles.highest.position) ||
      member.roles.highest.position === message.member.roles.highest.position
    ) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `You cannot warn a member with a role superior (or equal) to yours!`
      );
      await message.util.send(embed);
      return;
    }
    let caseNum = uniqid();
    let dateString: string = utc().format("MMMM Do YYYY, h:mm:ss a");
    let userId = member.id;
    let guildID = message.guild.id;

    const caseInfo: CaseInfo = {
      caseID: caseNum,
      moderator: message.author.tag,
      moderatorId: message.author.id,
      user: `${member.user.tag} (${member.user.id})`,
      date: dateString,
      type: "Warn",
      reason,
    };

    const embedToSend = new MessageEmbed()
      .setColor(0x1abc9c)
      .setDescription(
        `Hello ${member.user.username},\nYou have been warned in **${message.guild.name}** for **${reason}**.`
      );

    try {
      await dmUserOnInfraction(member.user, embedToSend);
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription("Couldn't send them a warn message! Continuing...");
      message.util.send(embed);
    }

    const sanctionsModel = getModelForClass(memberModel);
    try {
      await sanctionsModel
        .findOneAndUpdate(
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
        )
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(`Error logging warn to DB: **${e.message}**`);
      return message.util.send(embed);
    }

    embed.setDescription(`Warned **${member.user.tag}** | \`${caseNum}\``);
    await message.channel.send(embed);

    await sendLogToChannel(this.client, member, message.guild.id);

    const logEmbed = new MessageEmbed()
      .setTitle(`Member Warned | Case \`${caseNum}\` | ${member.user.tag}`)
      .addField(`User:`, `<@${member.id}>`, true)
      .addField(`Moderator:`, `<@${message.author.id}>`, true)
      .addField(`Reason:`, reason, true)
      .setFooter(`ID: ${member.id} | ${dateString}`)
      .setColor("ORANGE");

    let modlogChannel = findChannel(this.client, config.channels.modLogChannel);
    modLog(modlogChannel, logEmbed, message.guild.iconURL());
  }
}
