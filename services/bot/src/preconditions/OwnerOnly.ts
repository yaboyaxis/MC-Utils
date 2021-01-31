import { PieceContext, Precondition } from "@sapphire/framework";
import { Message } from "discord.js";
import { OWNERS } from "../BotConfig";

export default class OwnerOnlyPrecondition extends Precondition {
  constructor(context: PieceContext) {
    super(context, { 
      name: "OwnerOnly"
    });
  }
  public run(message: Message) {
    return OWNERS.includes(message.author.id) ? this.ok() : this.error(this.name, "Author is not registered as bot owner.");
  }
}
