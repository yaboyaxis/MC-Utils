import { Argument, PieceContext } from "@sapphire/framework";
import Command from "../lib/structures/Command";

export default class CommandArgument extends Argument<Command> {
  constructor(context: PieceContext) {
    super(context, { 
      name: "command"
    });
  }

  public async run(argument: string) {
    const cmd = this.context.client.commands.get(argument.toLowerCase()) || this.context.client.commands.aliases.get(argument.toLowerCase());
    return cmd ? this.ok(cmd) : this.error(argument, "Invalid command.");
  }
}