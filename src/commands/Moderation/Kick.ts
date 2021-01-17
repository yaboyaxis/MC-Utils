import { Command } from "discord-akairo";
import { Message, GuildMember, MessageEmbed } from "discord.js";
import config from "../../config";
import {
  modLog,
  findChannel,
  dmUserOnInfraction,
} from "../../structures/Utils";
import utc from "moment";
import Logger from "../../structures/Logger";
import memberModel, { CaseInfo } from "../../models/MemberModel";
import { getModelForClass } from "@typegoose/typegoose";
import uniqid from "uniqid";

export default class Kick extends Command {
  public constructor() {
    super("kick", {
      aliases: ["kick", "k"],
      category: "Moderation",
      channel: "guild",
      description: {
        content: "Kicks a member from the server.",
        usage: "kick [ID or Mention] <reason>",
        examples: ["kick @Axis#0001", "kick 379420154955825153 annoying"],
      },
      ratelimit: 3,
      userPermissions: ["KICK_MEMBERS"],
      args: [
        {
          id: "member",
          type: "member",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a member to kick...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid member to kick...`,
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

    if (
      member.roles.highest.position > message.member.roles.highest.position ||
      (member.roles.highest.position ===
        message.member.roles.highest.position &&
        message.author.id !== message.guild.ownerID)
    ) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `You cannot mute a member with a role superior (or equal) to yours!`
      );
      return message.util.send(embed);
    }

    if (!member.kickable) {
      embed.setColor(0xff0000);
      embed.setDescription(
        "You cannot kick this user as they are considered not kickable."
      );
      return message.util.send(embed);
    }

    if (
      member.hasPermission("ADMINISTRATOR") ||
      member.hasPermission("MANAGE_GUILD")
    ) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `You cannot kick this user as they have the \`ADMINISTRATOR\` or \`MANAGE_GUILD\` permission.`
      );
      return message.util.send(embed);
    }

    if (member.id === message.guild.ownerID) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `You cannot kick this person as the person is the guild owner.`
      );
      return message.util.send(embed);
    }

    const embedToSend = new MessageEmbed()
      .setColor(0x1abc9c)
      .setDescription(
        `Hello ${member.user.username},\nYou have been kicked from **${message.guild.name}** for **${reason}**.`
      );

    try {
      await dmUserOnInfraction(member.user, embedToSend);
    } catch (e) {
      embed.setDescription("Couldn't send them a kick message! Continuing...");
    }

    try {
      await member.kick(reason);
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `An error occurred whilst kicking: **${e.message}**`
      );
      return message.util.send(embed);
    }

    let dateString: string = utc().format("MMMM Do YYYY, h:mm:ss a");
    let userId = member.id;
    let guildID = message.guild.id;

    let caseNum = uniqid();
    const caseInfo: CaseInfo = {
      caseID: caseNum,
      moderator: message.author.tag,
      moderatorId: message.author.id,
      user: `${member.user.tag} (${member.user.id})`,
      date: dateString,
      type: "Kick",
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
      embed.setDescription(
        `An error occurred whilst logging to DB: **${e.message}**`
      );
      return message.util.send(embed);
    }

    embed.setDescription(`Kicked **${member.user.tag}** | \`${caseNum}\``);
    message.channel.send(embed);

    const logEmbed = new MessageEmbed()
      .setTitle(`Member Kicked | Case \`${caseNum}\` | ${member.user.tag}`)
      .addField(`User:`, `<@${member.id}>`, true)
      .addField(`Moderator:`, `<@${message.author.id}>`, true)
      .addField(`Reason:`, reason, true)
      .setFooter(`ID: ${member.id} | ${dateString}`)
      .setColor("RED");

    let modlogChannel = findChannel(this.client, config.channels.modLogChannel);
    await modLog(modlogChannel, logEmbed, message.guild.iconURL());
  }
}
