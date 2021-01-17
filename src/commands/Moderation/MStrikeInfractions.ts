import { Command } from "discord-akairo";
import { Message, GuildMember, MessageEmbed } from "discord.js";
import { getModelForClass } from "@typegoose/typegoose";
import ModStrikeModel from "../../models/ModStrikeModel";
import config from "../../config";

export default class MStrikeInfractions extends Command {
  public constructor() {
    super("minfractions", {
      aliases: ["minfractions", "m_infractions", "mwarnings"],
      category: "Moderation",
      channel: "guild",
      userPermissions: ["MANAGE_CHANNELS"],
      description: {
        content: "Checks mod infractions (modlogs) of a member.",
        usage: "minfractions [ID or Mention]",
        examples: [
          "minfractions @Axis#0001",
          "m_infractions 379420154955825153",
        ],
      },
      ratelimit: 3,
      args: [
        {
          id: "member",
          type: "member",
          default: (msg: Message) => msg.member,
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { member }: { member: GuildMember }
  ): Promise<Message> {
    if (
      !config.roles.managerRoles.find((t) =>
        message.member.roles.cache.findKey((r) => r.id === t)
      )
    )
      return;
    const embed = new MessageEmbed().setColor(0x00ff0c);
    let userId = member.id;
    const sanctionsModel = getModelForClass(ModStrikeModel);
    try {
      var memberData = await sanctionsModel.findOne({
        userId: userId,
        guildId: message.guild.id,
      });
      if (!memberData) {
        embed.setColor(0xff0000);
        embed.setDescription(`No modlogs found for that user`);
        return message.util.send(embed);
      } else if (
        memberData.sanctions === null ??
        memberData.sanctions.length < 1 ??
        memberData.sanctions === undefined
      ) {
        embed.setColor(0xff0000);
        embed.setDescription(`No modlogs found for that user`);
        return message.util.send(embed);
      }
    } catch (e) {}
    embed.setAuthor(
      `${member.user.tag}'s Strike Modlogs`,
      member.user.displayAvatarURL({ dynamic: true })
    );
    embed.setDescription("All times are in UTC");
    const CASE_SUMMARY_REASON_MAX_LENGTH = 16;
    for (const s of memberData.sanctions) {
      if (s.reason.length > CASE_SUMMARY_REASON_MAX_LENGTH) {
        const match = s.reason
          .slice(CASE_SUMMARY_REASON_MAX_LENGTH, 100)
          .match(/(?:[.,!?\s]|$)/);
        const nextWhitespaceIndex = match
          ? CASE_SUMMARY_REASON_MAX_LENGTH + match.index!
          : CASE_SUMMARY_REASON_MAX_LENGTH;
        if (nextWhitespaceIndex < s.reason.length) {
          s.reason = s.reason.slice(0, nextWhitespaceIndex - 1) + "...";
        }
      }
      embed.addField(
        `${s.type}: \`${s.caseID}\``,
        `Moderator: **<@!${s.moderatorId}>**\nReason: **${s.reason}**\nDate: **${s.date}**`,
        true
      );
    }
    embed.setFooter(`ID: ${userId}`);
    return message.util.send(embed);
  }
}
