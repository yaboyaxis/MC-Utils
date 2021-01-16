import { Command } from "discord-akairo";
import { Message, GuildMember, MessageEmbed } from "discord.js";
import { utc } from "moment";
import { getModelForClass } from "@typegoose/typegoose";
import MemberModel from "../../models/MemberModel";

export default class Whois extends Command {
  public constructor() {
    super("whois", {
      aliases: ["whois", "userinfo", "info"],
      channel: "guild",
      category: "Information",
      args: [
        {
          id: "member",
          type: "member",
          match: "rest",
          default: (msg: Message) => msg.member,
        },
      ],
      ratelimit: 3,
      description: {
        content: "Shows user information.",
        usage: "whois [mention or ID]",
        examples: ["whois @Axis#0001"],
      },
    });
  }

  public async exec(
    message: Message,
    { member }: { member: GuildMember }
  ): Promise<Message> {
    const roles = member.roles.cache.map((r) => r).join(", ") || "None";
    let warns = "";
    const sanctionsModel = getModelForClass(MemberModel);
    const sanctionsData = await sanctionsModel.findOne({
      guildId: message.guild.id,
      userId: member.id,
    });
    if (
      !sanctionsData ??
      !sanctionsData.sanctions ??
      sanctionsData.sanctions.length < 1 ??
      sanctionsData.sanctions === null ??
      sanctionsData.sanctions === undefined
    )
      warns = "No Infractions";
    warns = sanctionsData.sanctions.length.toString();
    return message.util.send(
      new MessageEmbed()
        .setAuthor(
          `User Info | ${member.user.tag}`,
          member.user.displayAvatarURL({ dynamic: true })
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor("BLUE")
        .setDescription(`<@${member.id}>`)
        .addField("Name", member.user.tag, true)
        .addField(
          "Created At",
          utc(member.user.createdAt).format("MMMM Do YYYY, h:mm:ss a") +
            " (UTC)",
          true
        )
        .addField(
          "Joined At",
          utc(member.joinedAt).format("MMMM Do YYYY, h:mm:ss a") + " (UTC)",
          false
        )
        .addField("Infraction Count", warns ?? "No Infractions", false)
        .addField("User ID", member.user.id, true)
        .addField("Roles", roles, false)
    );
  }
}
