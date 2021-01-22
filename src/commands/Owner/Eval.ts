import { Command } from "discord-akairo";
import { Message, MessageEmbed } from "discord.js";
import util from "util";
import config from "../../config";
import { bin } from "../../structures/Utils";

export default class Eval extends Command {
  public constructor() {
    super("eval", {
      aliases: ["eval"],
      ownerOnly: true,
      ratelimit: 3,
      args: [
        {
          id: "code",
          type: "string",
          match: "rest",
          prompt: {
            start: (msg: Message) =>
              `${msg.author}, please provide some code....`,
            retry: (msg: Message) => `${msg.author}, please valid code...`,
          },
        },
      ],
    });
  }

  public async exec(
    message: Message,
    { code }: { code: string }
  ): Promise<Message> {
    const privates = [config.bot.token, config.db.mongoURI];

    const symbolRegex = /(\.|\\|\?)/g;

    const evalRegex = new RegExp(
      `(${privates.reduce(
        (a, p = "") =>
          `${a}${a ? "|" : ""}${p.replace(
            symbolRegex,
            (match, capture) => "\\" + capture
          )}`,
        ""
      )})`,
      "g"
    );

    let result;
    const startTime = Date.now();

    try {
      result = await eval(code);
    } catch (err) {
      result = err;
    }
    const stopTime = Date.now();

    let output: string;

    if (result instanceof Error || result instanceof Promise)
      output = String(result);
    else output = util.inspect(result);

    if (output.length > 1024) {
      const link = await bin(output.replace(evalRegex, "REDACTED"));
      return message.util.send(
        new MessageEmbed()
          .setTitle(`Time Taken: **${stopTime - startTime}** milliseconds`)
          .setDescription(`Output: **${link}**`)
          .setColor(result instanceof Error ? 0xff0000 : 0xff00)
      );
    }

    return message.util.send(
      new MessageEmbed()
        .setAuthor(
          "Evaluation",
          message.author.displayAvatarURL({ dynamic: true })
        )
        .setTitle(`Time taken: **${stopTime - startTime}** milliseconds`)
        .setColor(result instanceof Error ? 0xff0000 : 0xff00)
        .addField("Input", `\`\`\`js\n${code}\`\`\``)
        .addField(
          result instanceof Error ? "Error" : "Output",
          `\`\`\`js\n${output.replace(evalRegex, "REDACTED")}\`\`\``
        )
        .setFooter(
          "Type: " +
            (result instanceof Array
              ? "array"
              : result instanceof Error
              ? "error"
              : typeof result)
        )
    );
  }
}
