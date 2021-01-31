import { Args, Piece, PieceContext } from "@sapphire/framework";
import { MessageEmbed } from "discord.js";
import { Message } from "discord.js";
import Command from "../../lib/structures/Command";

export default class HelpCommand extends Command {
  constructor(context: PieceContext) {
    super(context, {
      name: "help",
      aliases: ["commands", "cmds"],
    });
  }

  public async run(message: Message, args: Args) {
    const command = await args.pickResult("command");

    const embed = new MessageEmbed()
      .setColor(0x00ff0c);

    if (!command.success) {
      embed
        .setAuthor(`Help | ${this.context.client.user.username}`, this.context.client.user.displayAvatarURL(), "https://helper.wtf")
        .setFooter("Run >help <command> for more information on a specific command.");

      for (const category of this.store.categories) {
        const pieces = this.store
          .filter((piece: Piece) => piece.category === category)
          .map((piece: Piece) => `**\`${piece.name}\`**`)
          .join(', ');

        embed.addField(this.context.client.util.toTitleCase(category), pieces);
      }

      return message.channel.send({ embed });
    }

    const cmd = command.value;

    embed.setTitle(`**\`${this.context.client.util.toTitleCase(cmd.name)}\`**`);
    if (cmd.description || cmd.detailedDescription) embed.addField('Description', cmd.description || cmd.detailedDescription);
    if (cmd.usage) embed.addField('Usage', cmd.usage);
    if (cmd.aliases.length) embed.addField('Aliases', cmd.aliases.join(', '));

    return message.channel.send({ embed });
  }
}
