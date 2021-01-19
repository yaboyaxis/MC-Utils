import {
  Message,
  BitFieldResolvable,
  PermissionString,
  GuildMember,
} from "discord.js";
import urlRegexSafe from "url-regex-safe";
import { AkairoClient } from "discord-akairo";
import { autoModWarn, dispatchAutoModMsg } from "./Utils";
import Logger from "./Logger";

interface AutoModOptions {
  muteEnabled: boolean;
  warnEnabled: boolean;
  warnThreshold: number;
  muteThreshold: number;
  maxInt: number;
  maxDupInt: number;
  maxDuplicatesWarn: number;
  maxDuplicatesMute: number;
  ignoredMembers: string[];
  ignoredRoles: string[];
  ignoredChannels: string[];
  ignoredPermissions: string[];
  removeMsgs: boolean;
  messageLengthLimit: number;
  mentionLimit: number;
  nWordFilter: boolean;
  filterURLs: boolean;
  soundPingFilter: boolean;
  ignoreBots: boolean;
  messageSpamCount: number;
}

export class Automod {
  cache: { messages: any[]; warnedUsers: any[]; mutedUsers: any[] };
  options: AutoModOptions;

  constructor(options: AutoModOptions) {
    this.options = {
      warnEnabled: options.warnEnabled ?? true,
      muteEnabled: options.muteEnabled ?? true,
      warnThreshold: options.warnThreshold ?? 3,
      muteThreshold: options.muteThreshold ?? 4,
      maxDuplicatesWarn: options.maxDuplicatesWarn ?? 7,
      maxDuplicatesMute: options.maxDuplicatesMute ?? 9,
      maxInt: options.maxInt ?? 2000,
      maxDupInt: options.maxDupInt ?? 2000,
      ignoredMembers: options.ignoredMembers ?? [],
      ignoredRoles: options.ignoredRoles ?? [],
      ignoredChannels: options.ignoredChannels ?? [],
      ignoredPermissions: options.ignoredPermissions ?? [],
      removeMsgs: options.removeMsgs ?? true,
      messageLengthLimit: options.messageLengthLimit ?? 500,
      mentionLimit: options.mentionLimit ?? 5,
      nWordFilter: options.nWordFilter ?? true,
      filterURLs: options.filterURLs ?? true,
      soundPingFilter: options.soundPingFilter ?? true,
      messageSpamCount: options.messageSpamCount ?? 5,
      ignoreBots: options.ignoreBots ?? true,
    };

    this.cache = {
      messages: [],
      warnedUsers: [],
      mutedUsers: [],
    };
  }

  async clearMsgs(message: Message) {}

  async muteUser(message: Message, member: GuildMember, spamMessages: any[]) {}

  async warnUser(
    client: AkairoClient,
    message: Message,
    member: GuildMember,
    spamMessages: any[]
  ) {
    await autoModWarn(
      member,
      member.guild,
      "Violating Automod",
      message,
      client
    );
  }

  async processMsg(client: AkairoClient, message: Message) {
    if (
      !message.guild ||
      message.author.id === message.client.user.id ||
      message.guild.ownerID === message.author.id ||
      (this.options.ignoreBots && message.author.bot)
    ) {
      return false;
    }

    const isMemberIgnored = this.options.ignoredMembers.includes(
      message.author.id
    );
    if (isMemberIgnored) return false;

    const isChannelIgnored = this.options.ignoredChannels.includes(
      message.channel.id
    );
    if (isChannelIgnored) return false;

    const member =
      message.member || (await message.guild.members.fetch(message.author));

    const memberHasIgnoredRoles = this.options.ignoredRoles.some((r: string) =>
      member.roles.cache.has(r)
    );
    if (memberHasIgnoredRoles) return false;

    if (
      this.options.ignoredPermissions.some((permission) =>
        member.hasPermission(<BitFieldResolvable<PermissionString>>permission)
      )
    )
      return false;

    const currentMessage = {
      messageId: message.id,
      guildId: message.guild.id,
      authorId: message.author.id,
      channelId: message.channel.id,
      content: message.content,
      sentTimestamp: message.createdTimestamp,
    };
    this.cache.messages.push(currentMessage);

    const cachedMessages = this.cache.messages.filter(
      (m) => m.authorID === message.author.id && m.guildID === message.guild.id
    );
    const duplicateMatches = cachedMessages.filter(
      (m) =>
        m.content === message.content &&
        m.sentTimestamp > currentMessage.sentTimestamp - this.options.maxDupInt
    );

    if (message.content.match(urlRegexSafe({ strict: true }))) {
      if (message.deletable)
        await message.delete({ reason: "[AutoMod] Triggered link filter" });
      try {
        await autoModWarn(
          message.member,
          message.guild,
          "Sending Links",
          message,
          client
        );
        await dispatchAutoModMsg("Sending Links", message, "Warn");
      } catch (e) {
        Logger.error("Automod", e.message);
      }
    }
  }

  reset() {
    this.cache = {
      messages: [],
      mutedUsers: [],
      warnedUsers: [],
    };
  }
}
