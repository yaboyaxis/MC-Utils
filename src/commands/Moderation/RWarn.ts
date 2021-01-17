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

export default class RuleWarn extends Command {
  public constructor() {
    super("rulewarn", {
      aliases: ["rulewarn", "r"],
      channel: "guild",
      category: "Moderation",
      userPermissions: ["MANAGE_MESSAGES"],
      ratelimit: 3,
      description: {
        content: "Warns a user for breaking a rule.",
        usage: "r [ID/Mention] [rule number]",
        examples: ["r Menin#4642 2", "r 379420154955825153 5"],
      },
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
          id: "ruleNum",
          type: "string",
          match: "rest",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a rule number or keyword`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a vaild rule number or keyword`,
          },
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { member, ruleNum }: { member: GuildMember; ruleNum: string }
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

    const rules = config.rules;
    let reason = "";
    const ruleN = parseInt(ruleNum);
    if (isNaN(ruleN) || ruleN < 1 || ruleN > rules.length - 1) {
      try {
        reason = rules.find((e) => e.toLowerCase().includes(ruleNum));
      } catch (e) {
        embed.setDescription(
          `An error occurred fetching the rule: **${e.message}**`
        );
        embed.setColor(0xff0000);
        return message.util.send(embed);
      }
    } else {
      reason = rules[ruleN];
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
      reason: `Breaking the following rule: ${reason}`,
    };

    const embedToSend = new MessageEmbed()
      .setColor(0x1abc9c)
      .setDescription(
        `Hello ${member.user.username},\nYou have been warned in **${message.guild.name}** for breaking the following rule: **${reason}**.`
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
        .catch((e) => {
          embed.setColor(0xff0000);
          embed.setDescription(`Error Logging Warn to DB: ${e}`);
        });
    } catch (e) {
      Logger.error("DB", e);
    }

    embed.setDescription(`Warned **${member.user.tag}** | \`${caseNum}\``);
    await message.channel.send(embed);

    await sendLogToChannel(this.client, member, message.guild.id);

    const logEmbed = new MessageEmbed()
      .setTitle(`Member Warned | Case \`${caseNum}\` | ${member.user.tag}`)
      .addField(`User:`, `<@${member.id}>`, true)
      .addField(`Moderator:`, `<@${message.author.id}>`, true)
      .addField(`Reason:`, `Breaking the following rule: ${reason}`, true)
      .setFooter(`ID: ${member.id} | ${dateString}`)
      .setColor("ORANGE");

    let modlogChannel = findChannel(this.client, config.channels.modLogChannel);
    modLog(modlogChannel, logEmbed, message.guild.iconURL());
  }
}
