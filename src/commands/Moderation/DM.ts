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
import memberModel from "../../models/MemberModel";
import { getModelForClass } from "@typegoose/typegoose";
import uniqid from "uniqid";

export default class Warn extends Command {
  public constructor() {
    super("dm", {
      aliases: ["dm"],
      category: "Moderation",
      channel: "guild",
      description: {
        content: "Updates a user DM advertising infractions",
        usage: "dm [1 or 2] [ID or Mention]",
        examples: ["dm 1 @Axis#0001", "dm 2 100690330336129024"],
      },
      ratelimit: 3,
      userPermissions: ["MANAGE_MESSAGES"],
      args: [
        {
          id: "type",
          type: "string",
        },
        {
          id: "member",
          type: "member",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a member to DM warn...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid member to DM warn...`,
          },
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { member, type }: { member: GuildMember; type: string }
  ): Promise<Message> {
    const embed = new MessageEmbed().setColor(0x00ff0c);
    const validRes = ["1", "2"];
    if (!validRes.includes(type)) {
      embed.setColor(0xff0000);
      embed.setDescription("Not a valid type... use `1` or `2` for DM level.");
      return message.util.send(embed);
    }
    if (member.id === message.author.id) {
      embed.setColor(0xff0000);
      embed.setDescription("You cannot DM warn yourself!");
      return message.util.send(embed);
    }
    const memberPosition = member.roles.highest.position;
    const moderationPosition = message.member.roles.highest.position;
    if (
      message.member.guild.ownerID !== message.author.id &&
      !(moderationPosition >= memberPosition)
    ) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `You cannot DM warn a member with a role superior (or equal) to yours!`
      );
      await message.util.send(embed);
      return;
    }

    const sanctionsModel = getModelForClass(memberModel);

    if (type === "1") {
      let caseNum = uniqid();
      let dateString: string = utc().format("MMMM Do YYYY, h:mm:ss a");
      let userId = member.id;
      let guildID = message.guild.id;

      const caseInfo = {
        caseID: caseNum,
        moderator: message.author.tag,
        moderatorId: message.author.id,
        user: `${member.user.tag} (${member.user.id})`,
        date: dateString,
        type: "Warn",
        reason: "DM advertising (1st)",
      };

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
        embed.setDescription(`Error logging DM warn to DB: **${e.message}**`);
        return message.util.send(embed);
      }

      embed.setDescription(
        `Warned **${member.user.tag}** (DM Ad 1) | \`${caseNum}\``
      );

      await sendLogToChannel(this.client, member, message.guild.id);

      const logEmbed = new MessageEmbed()
        .setTitle(`Member Warned | Case \`${caseNum}\` | ${member.user.tag}`)
        .addField(`User:`, `<@${member.id}>`, true)
        .addField(`Moderator:`, `<@${message.author.id}>`, true)
        .addField(`Reason:`, "DM advertising (1st)", true)
        .setFooter(`ID: ${member.id} | ${dateString}`)
        .setColor("ORANGE");

      let modlogChannel = findChannel(
        this.client,
        config.channels.modLogChannel
      );
      await modLog(modlogChannel, logEmbed, message.guild.iconURL());
      return message.util.send(embed);
    } else if (type === "2") {
      if (!member.bannable) {
        embed.setColor(0xff0000);
        embed.setDescription(
          "User has reached DM 2:\n\nYou cannot ban this user as they are considered not bannable."
        );
        return message.util.send(embed);
      }
      if (
        member.hasPermission("ADMINISTRATOR") ||
        member.hasPermission("MANAGE_GUILD")
      ) {
        embed.setColor(0xff0000);
        embed.setDescription(
          `User has reached DM 2:\n\nYou cannot ban this user as they have the \`ADMINISTRATOR\` or \`MANAGE_GUILD\` permission.`
        );
        return message.util.send(embed);
      }
      if (member.id === message.guild.ownerID) {
        embed.setColor(0xff0000);
        embed.setDescription(
          `User has reached DM 2:\n\nYou cannot ban this person as the person is the guild owner.`
        );
        return message.util.send(embed);
      }
      let caseNum = uniqid();
      let dateString: string = utc().format("MMMM Do YYYY, h:mm:ss a");
      let userId = member.id;
      let guildID = message.guild.id;
      const caseInfo = {
        caseID: caseNum,
        moderator: message.author.tag,
        moderatorId: message.author.id,
        user: `${member.user.tag} (${userId})`,
        date: dateString,
        type: "Ban",
        reason: "DM advertising (2nd)",
      };
      const embedToSend = new MessageEmbed()
        .setColor(0x1abc9c)
        .setDescription(
          `Hello ${member.user.username},\nYou have been banned from **${message.guild.name}** for continuation of DM advertising. If you believe this ban is unjustified, you can appeal [here](https://support.sounddrout.com/)`
        );
      try {
        await dmUserOnInfraction(member.user, embedToSend);
      } catch (e) {
        embed.setColor(0xff0000);
        embed.setDescription(
          "User has reached DM 2:\n\nCouldn't send them a ban message! Continuing..."
        );
        message.util.send(embed);
      }
      await member.ban({ reason: "DM advertising (2nd)" });
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
            embed.setDescription(`Error Logging Ban to DB: ${e}`);
            return message.util.send(embed);
          });
      } catch (e) {
        Logger.error("DB", e);
      }
      const logEmbed = new MessageEmbed()
        .setTitle(`Member Banned | Case \`${caseNum}\` | ${member.user.tag}`)
        .addField(`User:`, `<@${member.id}>`, true)
        .addField(`Moderator:`, `<@${message.author.id}>`, true)
        .addField(`Reason:`, "DM advertising (2nd)", true)
        .setFooter(`ID: ${member.id} | ${dateString}`)
        .setColor("RED");
      let modlogChannel = findChannel(
        this.client,
        config.channels.modLogChannel
      );
      modLog(modlogChannel, logEmbed, message.guild.iconURL());
      embed.setDescription(
        `Banned **${member.user.tag}** (DM Ad 2) | \`${caseNum}\``
      );
      return message.channel.send(embed);
    }
  }
}
