import { Command as SapphireCommand, CommandOptions as SapphireCommandOptions, PieceContext, PreconditionEntryResolvable } from "@sapphire/framework";

interface CommandOptions extends SapphireCommandOptions {
  usage?: string;
}


export default abstract class Command extends SapphireCommand {
  constructor(context: PieceContext, options: CommandOptions) {
    super(context, { 
      ...options, 
      preconditions: ["Blacklisted", ...((options.preconditions || []) as PreconditionEntryResolvable[])]
    });

    this.usage = options.usage ? `${this.name} ${options.usage}` : this.name;
  }
}