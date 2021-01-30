import { Command as SapphireCommand, CommandOptions, PieceContext, PreconditionEntryResolvable } from "@sapphire/framework";

export default abstract class Command extends SapphireCommand {
  constructor(context: PieceContext, options: CommandOptions) {
    super(context, { 
      ...options, 
      preconditions: ["Blacklisted", ...((options.preconditions || []) as PreconditionEntryResolvable[])]
    });
  }
}