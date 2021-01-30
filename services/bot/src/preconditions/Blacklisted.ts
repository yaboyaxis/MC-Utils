import { Precondition } from "@sapphire/framework";
import { Message } from "discord.js";

export default class Blacklisted extends Precondition {
  public async run(message: Message) {
    return (await this.context.client.db.users.findOne({ id: message.author.id }))?.blacklisted ? this.error(this.name, "Author is blacklisted.") : this.ok();
  }
}
