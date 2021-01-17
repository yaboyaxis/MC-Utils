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
import date from "date.js";

export default class Mute extends Command {
  public constructor() {
    super("mute", {
      aliases: ["mute", "m"],
      channel: "guild",
      category: "Moderation",
      userPermissions: ["MANAGE_MESSAGES"],
      ratelimit: 3,
      description: {
        content: "Mute a member in the server.",
        usage: "mute [ID or Mention] <time h/m/d> <reason>",
        examples: [
          "mute @Axis#0001 rule breaking!",
          "mute 100690330336129024 10m dummy!",
        ],
      },
      args: [
        {
          id: "member",
          type: "member",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a member to mute...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid member to mute...`,
          },
        },
        {
          id: "time",
          default: "",
          type: "string",
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
    {
      member,
      time,
      reason,
    }: { member: GuildMember; time: string; reason: string }
  ): Promise<Message> {
    const embed = new MessageEmbed().setColor(0x1abc9c);

    if (message.author.id === member.id) {
      embed.setColor(0xff0000);
      embed.setDescription("You cannot mute yourself!");
      return message.util.send(embed);
    }
    if (member.user.bot) {
      embed.setColor(0xff0000);
      embed.setDescription("You cannot mute a bot!");
      return message.util.send(embed);
    }

    if (time !== null && time !== undefined && isNaN(date(time))) {
      embed.setColor(0xff0000);
      embed.setDescription("Please format time in `h`, `m`, or `d`.");
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
        `You cannot mute a member with a role superior (or equal) to yours!`
      );
      return message.util.send(embed);
    }

    const user = await message.guild.members.fetch(member.id).catch(() => {});

    if (!user) {
      embed.setColor(0xff0000);
      embed.setDescription("This user does not exist. Please try again.");
      message.util.send(embed);
      return;
    }

    if (
      user.hasPermission("ADMINISTRATOR") ||
      user.hasPermission("MANAGE_GUILD")
    ) {
      embed.setColor(0xff0000);
      embed.setDescription(
        "I cannot mute this user as they have the permission `ADMINISTRATOR` or `MANAGE_GUILD`"
      );
      return message.util.send(embed);
    }

    let muteRole = message.guild.roles.cache.get("726601422438924309");

    if (!muteRole) {
      embed.setColor(0xff0000);
      embed.setDescription(
        "There is no `Muted` role setup. Contact one of the devs to fix!"
      );
      return message.util.send(embed);
    }

    await user.roles.add(muteRole);

    let caseNum = uniqid();

    let userId = member.id;
    let guildID = message.guild.id;

    const caseInfo: CaseInfo = {
      caseID: caseNum,
      moderator: message.author.tag,
      moderatorId: message.author.id,
      user: `${member.user.tag} (${member.user.id})`,
      date: utc().format("MMMM Do YYYY, h:mm:ss a"),
      type: "Mute",
      reason,
      time,
    };

    let muteInformation = {
      muted: null,
      isPerm: null,
      endDate: null,
      case: caseNum,
    };

    if (time === null || time === "") {
      muteInformation = {
        muted: true,
        isPerm: true,
        endDate: null,
        case: caseNum,
      };
    } else {
      muteInformation = {
        muted: true,
        isPerm: false,
        endDate: date(time),
        case: caseNum,
      };
    }

    const sanctionsModel = getModelForClass(memberModel);
    try {
      const isMuted = await sanctionsModel.findOne({
        guildId: guildID,
        userId: userId,
        "mute.muted": true,
      });
      if (isMuted.mute.muted) {
        embed.setColor(0xff0000);
        embed.setDescription("User is currently muted!");
        return message.util.send(embed);
      } else {
      }
    } catch (e) {}

    const embedToSend = new MessageEmbed()
      .setColor(0x1abc9c)
      .setDescription(
        `Hello ${member.user.username},\nYou have been muted in **${message.guild.name}** for **${time}** for **${reason}**.`
      );

    try {
      await dmUserOnInfraction(member.user, embedToSend);
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription("Couldn't send them a mute message! Continuing...");
      message.util.send(embed);
    }

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
            $set: {
              mute: muteInformation,
            },
          },
          {
            upsert: true,
          }
        )
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(`Error logging mute to DB: ${e}`);
      return message.util.send(embed);
    }

    await message.delete();

    embed.setDescription(`Muted **${user.user.tag}** | \`${caseNum}\``);
    await message.channel.send(embed);

    const logEmbed = new MessageEmbed()
      .setTitle(`Member Muted | Case \`${caseNum}\` | ${member.user.tag}`)
      .addField(`User:`, `<@${member.id}>`, true)
      .addField(`Moderator:`, `<@${message.author.id}>`, true)
      .addField(`Time:`, time, true)
      .addField(`Reason:`, reason, true)
      .setFooter(
        `ID: ${member.id} | ${utc().format("MMMM Do YYYY, h:mm:ss a")}`
      )
      .setColor("RED");

    let modlogChannel = findChannel(this.client, config.channels.modLogChannel);
    modLog(modlogChannel, logEmbed, message.guild.iconURL());
  }
}
