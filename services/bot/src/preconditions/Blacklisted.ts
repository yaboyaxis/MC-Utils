import { PieceContext, Precondition } from "@sapphire/framework";
import { Message } from "discord.js";

export default class BlacklistedPrecondition extends Precondition {
  constructor(context: PieceContext) {
    super(context, { 
      name: "Blacklisted"
    });
  }

  public async run(message: Message) {
    return (await this.context.client.db.users.findOne({ id: message.author.id }))?.blacklisted ? this.error(this.name, "Author is blacklisted.") : this.ok();
  }
}
