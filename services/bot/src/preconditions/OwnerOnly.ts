import { Precondition } from "@sapphire/framework";
import { Message } from "discord.js";
import { OWNERS } from "../BotConfig";

export default class OwnerOnly extends Precondition {
  public run(message: Message) {
    if (!OWNERS.includes(message.author.id))
      return this.error(this.name, "Author is not registered as bot owner.");
    return this.ok();
  }
}
