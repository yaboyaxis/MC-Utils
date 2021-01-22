import { Command } from "discord-akairo";
import {
  modLog,
  findChannel,
  dmUserOnInfraction,
} from "../../structures/Utils";
import { utc } from "moment";
import config from "../../config";
import memberModel, { CaseInfo } from "../../models/MemberModel";
import { Message, GuildMember, MessageEmbed } from "discord.js";
import Logger from "../../structures/Logger";
import { getModelForClass } from "@typegoose/typegoose";
import uniqid from "uniqid";

export default class Unmute extends Command {
  public constructor() {
    super("unmute", {
      aliases: ["unmute"],
      channel: "guild",
      category: "Moderation",
      userPermissions: ["MANAGE_MESSAGES"],
      ratelimit: 3,
      description: {
        content: "Unmutes a member in the server.",
        usage: "unmute [ID or Mention] <reason>",
        examples: ["unmute @Axis#0001 mistake!"],
      },
      args: [
        {
          id: "member",
          type: "member",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a member to unmute...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid member to unmute...`,
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
    const embed = new MessageEmbed().setColor(0x1abc9c);

    if (message.author.id === member.id) {
      embed.setDescription("You cannot unmute yourself!");
      return message.util.send(embed);
    }
    if (member.user.bot) {
      embed.setColor(0xff0000);
      embed.setDescription("You cannot unmute a bot!");
      return message.util.send(embed);
    }

    const user = await message.guild.members.fetch(member.id).catch(() => {});
    const actualUser = this.client.users.cache.get(member.id);

    if (!user) {
      embed.setDescription("This user does not exist. Please try again.");
      message.util.send(embed);
      return;
    }

    let muteRole = message.guild.roles.cache.get("726601422438924309");

    if (!muteRole) {
      embed.setDescription(
        "There is no `Muted` role setup. Contact one of the devs to fix!"
      );
      return message.util.send(embed);
    }

    await user.roles.remove(muteRole);

    let caseNum = uniqid();

    const dmEmbed = new MessageEmbed()
      .setColor(0x1abc9c)
      .setDescription(
        `Hello ${user.user.tag},\nYou have just been unmuted in **${message.guild.name}** immediately for **${reason}**!`
      );

    try {
      await dmUserOnInfraction(actualUser, dmEmbed);
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription("Couldn't send user unmute message... continuing!");
      message.util.send(embed);
    }

    let userId = member.id;
    let guildID = message.guild.id;

    const caseInfo: CaseInfo = {
      caseID: caseNum,
      moderator: message.author.tag,
      moderatorId: message.author.id,
      user: `${member.user.tag} (${member.user.id})`,
      date: utc().format("MMMM Do YYYY, h:mm:ss a"),
      type: "Unmute",
      reason,
    };

    const muteInformation = {
      muted: false,
      isPerm: false,
      endDate: null,
      case: caseNum,
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
          $set: {
            mute: muteInformation,
          },
        },
        {
          upsert: true,
        }
      );
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(`Couldn't log unmute to DB: **${e.message}**`);
      return message.util.send(embed);
    }

    embed.setDescription(`Unmuted **${user.user.tag}** | \`${caseNum}\``);
    await message.channel.send(embed);

    const logEmbed = new MessageEmbed()
      .setTitle(`Member Unmuted | Case \`${caseNum}\` | ${member.user.tag}`)
      .addField(`User:`, `<@${member.id}>`, true)
      .addField(`Moderator:`, `<@${message.author.id}>`, true)
      .addField(`Reason:`, reason, true)
      .setFooter(
        `ID: ${member.id} | ${utc().format("MMMM Do YYYY, h:mm:ss a")}`
      )
      .setColor("RED");

    let modlogChannel = findChannel(this.client, config.channels.modLogChannel);
    modLog(modlogChannel, logEmbed, message.guild.iconURL());
  }
}
