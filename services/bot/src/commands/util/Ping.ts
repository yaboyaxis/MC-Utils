import { PieceContext } from "@sapphire/framework";
import { Message } from "discord.js";
import Command from "../../lib/structures/Command";

export default class PingCommand extends Command {
  constructor(context: PieceContext) {
    super(context, {
      name: "ping"
    });
  }

  public async run(message: Message) {
    const msg = await message.channel.send("Pinging...");

    msg.edit(`Ping! (Roundtrip took: ${(msg.editedTimestamp || msg.createdTimestamp) - (message.editedTimestamp || message.createdTimestamp)}ms. Heartbeat: ${this.context.client.ws.ping}ms.)`);
  }
}
