import { Command } from "discord-akairo";
import { Message, MessageEmbed } from "discord.js";
import config from "../../config";

export default class Say extends Command {
  public constructor() {
    super("rule", {
      aliases: ["rule"],
      channel: "guild",
      category: "Utilities",
      userPermissions: ["MANAGE_MESSAGES"],
      ratelimit: 3,
      description: {
        content: "Display provided rule.",
        usage: "rule [number]",
        examples: ["rule 1", "rule 4"],
      },
      args: [
        {
          id: "ruleNum",
          type: "string",
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { ruleNum }: { ruleNum: string }
  ): Promise<Message> {
    const embed = new MessageEmbed().setColor(0x1abc9c);
    const rules = config.rules;
    const ruleN = parseInt(ruleNum);
    if (isNaN(ruleN) || ruleN > rules.length - 1 || ruleN < 1) {
      embed.setColor(0xff0000);
      embed.setDescription("Rule number is invalid.");
      return message.util.send(embed);
    }
    const rule = rules[ruleNum];
    embed.setAuthor(`Sound's MC World's Rules`);
    embed.setDescription(rule);
    embed.setFooter(`Rule #${ruleNum}`);
    return message.channel.send(embed);
  }
}
