import { getModelForClass } from "@typegoose/typegoose";
import { Command } from "discord-akairo";
import { MessageEmbed, Message } from "discord.js";
import { strToBool } from "../../structures/Utils";
import AutoModModel, { AutoModSettings } from "../../models/AutoModModel";

export default class Automod extends Command {
  public constructor() {
    super("automod", {
      aliases: ["automod", "automod_settings"],
      channel: "guild",
      category: "Utilities",
      userPermissions: ["MANAGE_GUILD"],
      ratelimit: 3,
      description: {
        content: "Shows information about the bot.",
        usage: "botinfo",
        examples: ["botinfo"],
      },
      args: [
        {
          id: "key",
          type: "string",
        },
        {
          id: "value",
          type: "string",
          match: "rest",
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { key, value }: { key: string; value: string }
  ): Promise<Message> {
    const validOpts = [
      "mentionLimit",
      "messageLengthLimit",
      "nWordFilter",
      "filterURLs",
      "exemptRoles",
      "soundPingFilter",
      "messageSpamCount",
    ];
    const embed = new MessageEmbed().setColor(0x1abc9c);
    const autoModModel = getModelForClass(AutoModModel);
    const settings = (await autoModModel.findOne({ guildId: message.guild.id }))
      .autoModSettings;
    if (!validOpts.includes(key)) {
      embed.setTitle("Current Automod Settings");
      embed.setDescription(
        `\`\`\`json\n${JSON.stringify(settings, null, 2)}\`\`\``
      );
      embed.setColor(0xff0000);
      return message.util.send(embed);
    }
    let defaultAutoModUpdate: AutoModSettings = {
      messageLengthLimit: null,
      mentionLimit: null,
      nWordFilter: null,
      filterURLs: null,
      soundPingFilter: null,
      exemptRoles: [""],
      messageSpamCount: null,
    };
    // Iterate through the key's and see if they match one val
    if (key === "mentionLimit") {
      if (isNaN(parseInt(value))) {
        embed.setDescription(
          `Invalid argument for \`value\`. Available values:\n\`integer\``
        );
        embed.setColor(0xff0000);
        return message.util.send(embed);
      }
      defaultAutoModUpdate = {
        messageLengthLimit: settings.messageLengthLimit,
        mentionLimit: parseInt(value),
        nWordFilter: settings.nWordFilter,
        filterURLs: settings.filterURLs,
        soundPingFilter: settings.soundPingFilter,
        exemptRoles: settings.exemptRoles,
        messageSpamCount: settings.messageSpamCount,
      };
    } else if (key === "messageLengthLimit") {
      if (isNaN(parseInt(value))) {
        embed.setDescription(
          `Invalid argument for \`value\`. Available values:\n\`integer\``
        );
        embed.setColor(0xff0000);
        return message.util.send(embed);
      }
      defaultAutoModUpdate = {
        messageLengthLimit: parseInt(value),
        mentionLimit: settings.mentionLimit,
        nWordFilter: settings.nWordFilter,
        filterURLs: settings.filterURLs,
        soundPingFilter: settings.soundPingFilter,
        exemptRoles: settings.exemptRoles,
        messageSpamCount: settings.messageSpamCount,
      };
    } else if (key === "nWordFilter") {
      if (value !== "true" ?? value !== "false") {
        embed.setDescription(
          `Invalid argument for \`value\`. Available values:\n\`true, false\``
        );
        embed.setColor(0xff0000);
        return message.util.send(embed);
      }
      defaultAutoModUpdate = {
        messageLengthLimit: settings.messageLengthLimit,
        mentionLimit: settings.mentionLimit,
        nWordFilter: strToBool(value) ?? false,
        filterURLs: settings.filterURLs,
        soundPingFilter: settings.soundPingFilter,
        exemptRoles: settings.exemptRoles,
        messageSpamCount: settings.messageSpamCount,
      };
    } else if (key === "filterURLs") {
      if (value !== "true" ?? value !== "false") {
        embed.setDescription(
          `Invalid argument for \`value\`. Available values:\n\`true, false\``
        );
        embed.setColor(0xff0000);
        return message.util.send(embed);
      }
      defaultAutoModUpdate = {
        messageLengthLimit: settings.messageLengthLimit,
        mentionLimit: settings.mentionLimit,
        nWordFilter: settings.nWordFilter,
        filterURLs: strToBool(value) ?? false,
        soundPingFilter: settings.soundPingFilter,
        exemptRoles: settings.exemptRoles,
        messageSpamCount: settings.messageSpamCount,
      };
    } else if (key === "exemptRoles") {
      if (!value.split(" ")) {
        embed.setDescription(
          `Invalid argument for \`value\`. Available values:\n\`string:Snowflake\``
        );
        embed.setColor(0xff0000);
        return message.util.send(embed);
      }
      defaultAutoModUpdate = {
        messageLengthLimit: settings.messageLengthLimit,
        mentionLimit: settings.mentionLimit,
        nWordFilter: settings.nWordFilter,
        filterURLs: settings.filterURLs,
        soundPingFilter: settings.soundPingFilter,
        exemptRoles: value.split(", "),
        messageSpamCount: settings.messageSpamCount,
      };
    } else if (key === "soundPingFilter") {
      if (value !== "true" ?? value !== "false") {
        embed.setDescription(
          `Invalid argument for \`value\`. Available arguments:\n\`true, false\``
        );
        embed.setColor(0xff0000);
        return message.util.send(embed);
      }
      defaultAutoModUpdate = {
        messageLengthLimit: settings.messageLengthLimit,
        mentionLimit: settings.mentionLimit,
        nWordFilter: settings.nWordFilter,
        filterURLs: settings.filterURLs,
        soundPingFilter: strToBool(value) ?? false,
        exemptRoles: settings.exemptRoles,
        messageSpamCount: settings.messageSpamCount,
      };
    } else if (key === "messageSpamCount") {
      if (isNaN(parseInt(value))) {
        embed.setDescription(
          `Invalid argument for \`value\`. Available arguments:\n\`number\``
        );
        embed.setColor(0xff0000);
        return message.util.send(embed);
      }
      defaultAutoModUpdate = {
        messageLengthLimit: settings.messageLengthLimit,
        mentionLimit: settings.mentionLimit,
        nWordFilter: settings.nWordFilter,
        filterURLs: settings.filterURLs,
        soundPingFilter: settings.soundPingFilter,
        exemptRoles: settings.exemptRoles,
        messageSpamCount: parseInt(value),
      };
    } else {
      embed.setDescription(`Invalid Option:\n\`${validOpts.join(", ")}\``);
      embed.setColor(0xff0000);
      return message.util.send(embed);
    }
    try {
      await autoModModel.findOneAndUpdate(
        {
          guildId: message.guild.id,
        },
        {
          guildId: message.guild.id,
          $set: {
            autoModSettings: defaultAutoModUpdate,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      embed.setDescription(`Couldn't set automod settings:\n\`${e}\``);
      embed.setColor(0xff0000);
      return message.util.send(embed);
    }
    embed.setDescription(`Successfully set **${key}** to **${value}**.`);
    return message.channel.send(embed);
  }
}