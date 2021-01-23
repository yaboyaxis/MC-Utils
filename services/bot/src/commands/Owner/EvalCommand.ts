import { Args, Command, PieceContext } from '@sapphire/framework';
import { Message } from 'discord.js';
import {
  DISCORD_TOKEN,
  POSTGRES_PASSWORD,
  POSTGRES_HOST,
  POSTGRES_USERNAME,
  POSTGRES_DATABASE,
} from '../../BotConfig';
import { inspect } from 'util';
import { MessageEmbed } from 'discord.js';

export default class EvalCommand extends Command {
  constructor(context: PieceContext) {
    super(context, {
      name: 'eval',
      aliases: ['e', 'ev'],
      preconditions: ['OwnerOnly'],
    });
  }

  public async run(ctx: Message, args: Args) {
    const code = await args.restResult('string');
    if (!code.success) throw 'Missing required arguments: code';

    const privates = [
      DISCORD_TOKEN,
      POSTGRES_HOST,
      POSTGRES_PASSWORD,
      POSTGRES_USERNAME,
      POSTGRES_DATABASE,
    ];

    const symbolRegex = /(\.|\\|\?)/g;

    const evalRegex = new RegExp(
      `(${privates.reduce(
        (a, p = '') =>
          `${a}${a ? '|' : ''}${p.replace(
            symbolRegex,
            (match, capture) => '\\' + capture
          )}`,
        ''
      )})`,
      'g'
    );

    let result;
    const startTime = Date.now();

    try {
      result = await eval(code.value);
    } catch (err) {
      result = err;
    }
    const stopTime = Date.now();

    let output: string;

    if (result instanceof Error || result instanceof Promise)
      output = String(result);
    else output = inspect(result);

    if (output.length > 1024) {
      const link = await this.context.client.util.bin(output.replace(evalRegex, 'REDACTED'));
      return ctx.channel.send(
        new MessageEmbed()
          .setTitle(`Time Taken: **${stopTime - startTime}** milliseconds`)
          .setDescription(`Output: **${link}**`)
          .setColor(result instanceof Error ? 0xff0000 : 0xff00)
      );
    }

    return ctx.channel.send(
      new MessageEmbed()
        .setAuthor('Evaluation', ctx.author.displayAvatarURL({ dynamic: true }))
        .setTitle(`Time taken: **${stopTime - startTime}** milliseconds`)
        .setColor(result instanceof Error ? 0xff0000 : 0xff00)
        .addField('Input', `\`\`\`js\n${code.value}\`\`\``)
        .addField(
          result instanceof Error ? 'Error' : 'Output',
          `\`\`\`js\n${output.replace(evalRegex, 'REDACTED')}\`\`\``
        )
        .setFooter(
          'Type: ' +
            (result instanceof Array
              ? 'array'
              : result instanceof Error
              ? 'error'
              : typeof result)
        )
    );
  }
}
