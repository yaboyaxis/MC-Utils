import { Command } from "discord-akairo";
import { Message, TextChannel, MessageEmbed } from "discord.js";

export default class Say extends Command {
  public constructor() {
    super("say", {
      aliases: ["say", "echo"],
      channel: "guild",
      category: "Utilities",
      userPermissions: ["MANAGE_CHANNELS"],
      ratelimit: 2,
      description: {
        content: "Echos a certain phrase or word!",
        usage: "say [string]",
        examples: ["say Luca sucks!"],
      },
      args: [
        {
          id: "string",
          type: "string",
          match: "rest",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide a string...`,
            retry: (msg: Message) =>
              `${msg.author}, please provide a valid string...`,
          },
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { string }: { string: string }
  ): Promise<Message> {
    await message.delete();
    const embed = new MessageEmbed().setColor(0x1abc9c);
    if (string.length >= 1024) {
      embed.setDescription(
        "Phrase is over **1024** characters. Please try again."
      );
      return message.util.send(embed);
    }
    await message.channel.send(string, { disableMentions: "everyone" });
  }
}
