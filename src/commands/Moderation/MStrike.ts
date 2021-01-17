import { getModelForClass } from "@typegoose/typegoose";
import { Command } from "discord-akairo";
import { Message, GuildMember, MessageEmbed } from "discord.js";
import { utc } from "moment";
import uniqid from "uniqid";
import { CaseInfo } from "../../models/MemberModel";
import ModStrikeModel from "../../models/ModStrikeModel";
import config from "../../config";

export default class MStrike extends Command {
  public constructor() {
    super("modstrike", {
      aliases: ["modstrike", "mod_strike"],
      channel: "guild",
      category: "Moderation",
      userPermissions: ["MANAGE_CHANNELS"],
      ratelimit: 3,
      description: {
        content: "Strikes a mod.",
        usage: "modstrike [ID/Mention] [Reason]",
        examples: ["modstrike Luca absuing powers."],
      },
      args: [
        {
          id: "member",
          type: "member",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a valid member...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid member...`,
          },
        },
        {
          id: "reason",
          type: "string",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a reason...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid reason...`,
          },
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { member, reason }: { member: GuildMember; reason: string }
  ): Promise<Message | void> {
    if (
      !config.roles.managerRoles.find((r) =>
        member.roles.cache.findKey((t) => t.id === r)
      )
    )
      return;
    const embed = new MessageEmbed().setColor(0x00ff0c);

    let caseNum = uniqid("MS-");
    let dateString = utc().format("MMMM Do YYYY, h:mm:ss a");

    const caseInfo: CaseInfo = {
      caseID: caseNum,
      moderator: message.author.tag,
      moderatorId: message.author.id,
      user: `${member.user.tag} (${member.user.id})`,
      date: dateString,
      type: "Mod Strike",
      reason,
    };

    const memberModel = getModelForClass(ModStrikeModel);
    try {
      await memberModel.findOneAndUpdate(
        {
          userId: member.id,
          guildId: message.guild.id,
        },
        {
          userId: member.id,
          $push: {
            sanctions: caseInfo,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(`An error occurred: **${e.message}**`);
      return message.util.send(embed);
    }

    embed.setDescription(`Mod Striked **${member.user.tag}** | \`${caseNum}\``);
    return message.channel.send(embed);
  }
}
