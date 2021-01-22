import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { makeid } from "../../structures/Utils";

export default class Audit extends Command {
  public constructor() {
    super("audit", {
      aliases: ["audit"],
      channel: "guild",
      category: "Moderation",
      userPermissions: ["MANAGE_MESSAGES"],
      ratelimit: 3,
      description: {
        content: "Gives you back users that match a filter.",
        usage: "audit",
        examples: ["audit"],
      },
      args: [
        {
          id: "all",
          type: "string",
          flag: "-a ",
          default: "false",
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { all }: { all: string }
  ): Promise<Message | void> {
    const nWordRegExp = new RegExp("n[i1]gg?[e3]r[s\\$]?");
    const nWordRegExp2 = new RegExp("nniigg");
    const otherFilters = ["nigg", "cunt", "penis", "dick", "fuck"];

    let counter = 0;
    let errCounter = 0;
    let badArr = [""];
    for (const user of message.guild.members.cache) {
      if (message.content.includes("-a")) {
        if (
          user[1].displayName.match(nWordRegExp || nWordRegExp2) ||
          otherFilters.includes(user[1].displayName)
        ) {
          counter++;
          badArr.push(user[1].id);
        }
      } else {
        if (
          user[1].displayName.match(nWordRegExp || nWordRegExp2) ||
          otherFilters.includes(user[1].displayName)
        ) {
          counter++;
          badArr.push(`${user[1].displayName} :: ${user[1].id}`);
        }
      }
    }
    if (message.content.includes("-a")) {
      for (const member of badArr) {
        try {
          var guildMem = await message.guild.members.cache.get(member);
        } catch (e) {
          return;
        }
        try {
          guildMem.setNickname(`Moderated Nickname ${makeid(6)}`);
          counter++;
        } catch (e) {
          errCounter++;
        }
      }
      if (errCounter > 0) {
        return message.util.send(
          `${errCounter} error(s) while changing nicknames of user. Please don't use \`-a\``
        );
      }
      return message.util.send(
        `${counter} nicknames changed on user(s):\n\`\`\`js\n${badArr.join(
          "\n"
        )}\n\`\`\``
      );
    } else {
      if (counter === 0) return message.util.send("No Matches Found.");
      return message.util.send(
        `${counter} users matched filter:\n\`\`\`js\n${badArr.join(
          "\n"
        )}\n\`\`\``
      );
    }
  }
}
