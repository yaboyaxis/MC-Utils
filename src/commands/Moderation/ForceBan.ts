import { Command } from "discord-akairo";
import { Message, User, MessageEmbed } from "discord.js";
import config from "../../config";
import {
  modLog,
  findChannel,
  dmUserOnInfraction,
  resolveUser,
} from "../../structures/Utils";
import utc from "moment";
import Logger from "../../structures/Logger";
import memberModel, { CaseInfo } from "../../models/MemberModel";
import { getModelForClass } from "@typegoose/typegoose";
import uniqid from "uniqid";

export default class ForceBan extends Command {
  public constructor() {
    super("forceban", {
      aliases: ["forceban", "force_ban", "fb"],
      category: "Moderation",
      channel: "guild",
      description: {
        content: "Force bans a user from the server.",
        usage: "forceban [ID or Mention] <reason>",
        examples: [
          "forceban @Axis#0001",
          "force_ban 100690330336129024 Bad boy!",
        ],
      },
      ratelimit: 3,
      userPermissions: ["BAN_MEMBERS"],
      args: [
        {
          id: "user",
          type: "user",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a user to ban...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid user to ban...`,
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
    { user, reason }: { user: User; reason: string }
  ): Promise<Message> {
    const embed = new MessageEmbed().setColor(0x00ff0c);

    if (user.id === message.guild.ownerID) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `You cannot ban this person as the person is the guild owner.`
      );
      return message.util.send(embed);
    }

    if (message.guild.members.cache.has(user.id)) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `This user exists in the guild. Run \`>ban\` instead.`
      );
      return message.util.send(embed);
    }

    const embedToSend = new MessageEmbed()
      .setColor(0x1abc9c)
      .setDescription(
        `Hello ${user.username},\nYou have been banned from **${message.guild.name}** for **${reason}**. If you believe this ban is unjustified, you can appeal [here](https://sounddrout.com/mcbanappeals)`
      );

    try {
      await dmUserOnInfraction(user, embedToSend);
    } catch (e) {
      embed.setDescription("Couldn't send them a ban message! Continuing...");
    }

    try {
      await message.guild.members.ban(user, { reason: reason });
    } catch (e) {
      embed.setColor(0xff0000);
      embed.setDescription(
        `An error occurred whilst banning: **${e.message}**`
      );
      return message.util.send(embed);
    }

    let dateString: string = utc().format("MMMM Do YYYY, h:mm:ss a");
    let userId = user.id;
    let guildID = message.guild.id;

    let caseNum = uniqid();
    const caseInfo: CaseInfo = {
      caseID: caseNum,
      moderator: message.author.tag,
      moderatorId: message.author.id,
      user: `${user.tag} (${user.id})`,
      date: dateString,
      type: "Force Ban",
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
      embed.setDescription(`Error logging force ban to DB: **${e.message}**`);
      return message.util.send(embed);
    }

    embed.setDescription(`Banned **${user.tag}** | \`${caseNum}\``);
    message.channel.send(embed);

    const logEmbed = new MessageEmbed()
      .setTitle(`Member Force Banned | Case \`${caseNum}\` | ${user.tag}`)
      .addField(`User:`, `<@${user.id}>`, true)
      .addField(`Moderator:`, `<@${message.author.id}>`, true)
      .addField(`Reason:`, reason, true)
      .setFooter(`ID: ${user.id} | ${dateString}`)
      .setColor("RED");

    let modlogChannel = findChannel(this.client, config.channels.modLogChannel);
    modLog(modlogChannel, logEmbed, message.guild.iconURL());
  }
}
