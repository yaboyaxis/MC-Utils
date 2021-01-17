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

export default class Ban extends Command {
  public constructor() {
    super("ban", {
      aliases: ["ban", "b"],
      category: "Moderation",
      channel: "guild",
      description: {
        content: "Bans a member in the server.",
        usage: "ban [ID or Mention] <reason>",
        examples: ["ban @Axis#0001", "ban 100690330336129024 Bad boy!"],
      },
      ratelimit: 3,
      userPermissions: ["BAN_MEMBERS"],
      args: [
        {
          id: "member",
          type: "member",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a member to ban...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid member to ban...`,
          },
        },
        {
          id: "reason",
          type: "string",
          match: "restContent",
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
        `You cannot ban a member with a role superior (or equal) to yours!`
      );
      return message.util.send(embed);
    }

    if (!member.bannable) {
      embed.setColor(0xff0000);
      embed.setDescription(
        "You cannot ban this user as they are considered not bannable."
      );
      return message.util.send(embed);
    }

    if (
      member.hasPermission("ADMINISTRATOR") ||
      member.hasPermission("MANAGE_GUILD")
    ) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `You cannot ban this user as they have the \`ADMINISTRATOR\` or \`MANAGE_GUILD\` permission.`
      );
      return message.util.send(embed);
    }

    if (member.id === message.guild.ownerID) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `You cannot ban this person as the person is the guild owner.`
      );
      return message.util.send(embed);
    }

    const embedToSend = new MessageEmbed()
      .setColor(0x1abc9c)
      .setDescription(
        `Hello ${member.user.username},\nYou have been banned from **${message.guild.name}** for **${reason}**. If you believe this ban is unjustified, you can appeal [here](https://support.sounddrout.com/)`
      );

    try {
      await dmUserOnInfraction(member.user, embedToSend);
    } catch (e) {
      embed.setDescription("Couldn't send them a ban message! Continuing...");
    }

    try {
      await member.ban({ reason: reason });
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `An error occurred whilst banning: **${e.message}**`
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
      type: "Ban",
      reason,
    };

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
        .catch((e) => {
          embed.setColor(0xff0000);
          embed.setDescription(`Error Logging Kick to DB: ${e}`);
          return message.util.send(embed);
        });
    } catch (e) {
      Logger.error("DB", e);
    }

    embed.setDescription(`Banned **${member.user.tag}** | \`${caseNum}\``);
    message.channel.send(embed);

    const logEmbed = new MessageEmbed()
      .setTitle(`Member Banned | Case \`${caseNum}\` | ${member.user.tag}`)
      .addField(`User:`, `<@${member.id}>`, true)
      .addField(`Moderator:`, `<@${message.author.id}>`, true)
      .addField(`Reason:`, reason, true)
      .setFooter(`ID: ${member.id} | ${dateString}`)
      .setColor("RED");

    let modlogChannel = findChannel(this.client, config.channels.modLogChannel);
    modLog(modlogChannel, logEmbed, message.guild.iconURL());
  }
}
