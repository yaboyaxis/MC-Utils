import hook from "@picklerickdev/discord-webhooks";
import {
  TextChannel,
  Message,
  MessageEmbed,
  Guild,
  GuildMember,
  User,
} from "discord.js";
import memberModel, { CaseInfo } from "../models/MemberModel";
import AutoModModel from "../models/AutoModModel";
import config from "../config";
import { AkairoClient } from "discord-akairo";
import { getModelForClass } from "@typegoose/typegoose";
import { utc } from "moment";
import Logger from "./Logger";
import uniqid from "uniqid";
import req from "@helperdiscord/centra";

export function makeid(length: number) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function strToBool(s: string) {
  let regex = /^\s*(true|1|on)\s*$/i;

  return regex.test(s);
}

export async function dispatchAfkEmbed(
  message: Message,
  afkReason: string,
  userAfk: GuildMember
) {
  const embed = new MessageEmbed()
    .setColor(0xff0000)
    .setTitle("User is AFK")
    .setDescription(`<@!${userAfk.id}> is AFK because:\n**${afkReason}**`)
    .setThumbnail(userAfk.user.displayAvatarURL({ dynamic: true }));
  return (await message.channel.send(embed)).delete({ timeout: 10000 });
}

export async function dispatchAfkWelcomeEmbed(
  message: Message,
  userAfk: GuildMember
) {
  const embed = new MessageEmbed()
    .setColor(0xff0000)
    .setTitle("Welcome Back!")
    .setDescription(`Welcome back, <@!${userAfk.id}>!`)
    .setThumbnail(userAfk.user.displayAvatarURL({ dynamic: true }));
  return (await message.channel.send(embed)).delete({ timeout: 10000 });
}

export async function dispatchAutoModMsg(
  reason: string,
  message: Message,
  type: string
) {
  const embed = new MessageEmbed()
    .setColor(0xfc5507)
    .setDescription(
      `User **${
        message.author.tag
      }** has been **${type.toLowerCase()}** for **${reason}**.`
    );
  const msg = await message.channel.send(embed);
  await msg.delete({ timeout: 10000 });
}

export async function autoModWarn(
  member: GuildMember,
  guild: Guild,
  reason: string,
  message: Message,
  client: AkairoClient
) {
  if (!member) return;
  let caseNum = uniqid(`A-`);
  let dateString: string = utc().format("MMMM Do YYYY, h:mm:ss a");
  let userId = member.id;
  let guildID = guild.id;
  const embed = new MessageEmbed().setColor(0x00ff0c);

  const caseInfo: CaseInfo = {
    caseID: caseNum,
    moderator: client.user.tag,
    moderatorId: client.user.id,
    user: `${member.user.tag} (${member.user.id})`,
    date: dateString,
    type: "Auto-Warn",
    reason,
  };

  const embedToSend = new MessageEmbed()
    .setColor(0x1abc9c)
    .setDescription(
      `Hello ${member.user.username},\nYou have been auto-warned in **${message.guild.name}** \nReason: **${reason}**.`
    );

  try {
    await dmUserOnInfraction(member.user, embedToSend);
  } catch (e) {
    embed.setColor(0xff0000);
    embed.setDescription("Couldn't send them a warn message! Continuing...");
    message.util.send(embed);
  }

  const autoModModel = getModelForClass(AutoModModel);
  try {
    await autoModModel
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

  await sendLogToChannel(this.client, member, message.guild.id);

  const logEmbed = new MessageEmbed()
    .setTitle(`Member Auto-Warned | Case \`${caseNum}\` | ${member.user.tag}`)
    .addField(`User:`, `<@${member.id}>`, true)
    .addField(`Moderator:`, `AutoMod`, true)
    .addField(`Reason:`, reason, true)
    .setFooter(`ID: ${member.id} | ${dateString}`)
    .setColor("ORANGE");

  let modlogChannel = findChannel(this.client, config.channels.modLogChannel);
  modLog(modlogChannel, logEmbed, message.guild.iconURL());
}

export async function modLog(
  channel: TextChannel,
  message: Message | MessageEmbed,
  iconURL: any
) {
  hook(channel, message, {
    name: "SoundsMC Mod Logger",
    icon: iconURL,
  });
}

export async function log(
  channel: TextChannel,
  message: Message | MessageEmbed,
  iconURL: any
) {
  hook(channel, message, {
    name: "SoundsMC Logger",
    icon: iconURL,
  });
}

export async function request(
  channel: TextChannel,
  message: Message | MessageEmbed,
  iconURL: any
) {
  hook(channel, message, {
    name: "Feature Requests",
    icon: iconURL,
  });
}

export function findChannel(client: any, channel: string): TextChannel {
  let c: TextChannel = client.channels.cache.get(channel);
  return c;
}

export async function resolveMember(search: string, guild: Guild) {
  let member = null;
  if (!search || typeof search !== "string") return;
  // Try ID search
  if (search.match(/^<@!?(\d+)>$/)) {
    const id = search.match(/^<@!?(\d+)>$/)[1];
    member = await guild.members.fetch(id).catch(() => {});
    if (member) return member;
  }
  // Try username search
  if (search.match(/^!?(\w+)#(\d+)$/)) {
    guild = await guild.fetch();
    member = guild.members.cache.find((m) => m.user.tag === search);
    if (member) return member;
  }
  member = await guild.members.fetch(search).catch(() => {});
  return member;
}

export async function resolveUser(search: string, client: AkairoClient) {
  let user = null;
  if (!search || typeof search !== "string") return;
  if (search.match(/^<@!?(\d+)>$/)) {
    const id = search.match(/^<@!?(\d+)>$/)[1];
    user = client.users.cache.get(id);
    if (user) return user;
  }
  // Try username search
  if (search.match(/^!?(\w+)#(\d+)$/)) {
    user = client.users.cache.find((m) => m.tag === search);
    if (user) return user;
  }
  user = client.users.cache.get(search);
  return user;
}

export async function sendLogToChannel(
  client: AkairoClient,
  member: GuildMember,
  guildId: string
): Promise<Message> {
  const embed = new MessageEmbed().setColor(0x00ff0c);
  let userId = member.id;
  const sanctionsModel = getModelForClass(memberModel);
  const memberData = await sanctionsModel.findOne({
    userId: userId,
    guildId: guildId,
  });
  if (!memberData) {
    return;
  } else if (
    memberData.sanctions === null ??
    memberData.sanctions.length < 1 ??
    memberData.sanctions === undefined
  ) {
    return;
  } else {
    embed.setAuthor(
      `${member.user.tag}'s Modlogs`,
      member.user.displayAvatarURL({ dynamic: true })
    );
    embed.setDescription("All times are in UTC");
    embed.setFooter(`ID: ${userId}`);
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
        `Moderator: **${s.moderator}**\nReason: **${s.reason}**\nDate: **${s.date}**`,
        true
      );
    }
    let c = member.guild.channels.cache.get(
      config.channels.botCmdChannel
    ) as TextChannel;
    return c.send(embed);
  }
}

export async function dmUserOnInfraction(
  user: User,
  dmMessage: MessageEmbed
): Promise<void> {
  await user.send(dmMessage).catch((e) => e);
}

// Thank you Zeppelin :D
export function asyncMap<T, R>(
  arr: T[],
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  return Promise.all(arr.map((item) => fn(item)));
}

export async function bin(data: any, ext: string = "js") {
  const res = await req("https://hst.sh/documents", "POST")
    .body(data)
    .timeout(15000)
    .send();

  if (res.statusCode === 200) {
    return `https://hst.sh/${res.json().key}.${ext}`;
  }

  return `Something went wrong while uploading data to hst.sh (status: ${res.statusCode})`;
}
