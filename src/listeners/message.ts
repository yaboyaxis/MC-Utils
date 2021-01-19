import { getModelForClass } from "@typegoose/typegoose";
import { Listener } from "discord-akairo";
import { Message } from "discord.js";
import AfkModel from "../models/AfkModel";
import { dispatchAfkEmbed, dispatchAfkWelcomeEmbed } from "../structures/Utils";

export default class message extends Listener {
  public constructor() {
    super("message", {
      emitter: "client",
      event: "message",
      type: "on",
    });
  }

  public async exec(message: Message) {
    await message.guild.members.fetch({ time: 20000 });
    if (message.author.bot) return;
    const afkModel = getModelForClass(AfkModel);
    if (message.mentions.members.first()) {
      const current_user_afk = await afkModel.findOne({
        userId: message.mentions.members.first().id,
      });
      if (current_user_afk !== null && current_user_afk.afk.isAfk) {
        return await dispatchAfkEmbed(
          message,
          current_user_afk.afk.status,
          message.mentions.members.first()
        );
      }
    } else {
      const current_user_afk = await afkModel.findOne({
        userId: message.author.id,
      });
      if (
        current_user_afk !== null &&
        !message.content.startsWith(
          `${this.client.commandHandler.prefix}afk`
        ) &&
        current_user_afk.afk.status
      ) {
        await afkModel.findOneAndDelete({ userId: message.author.id });
        return await dispatchAfkWelcomeEmbed(message, message.member);
      }
    }
    await this.client.automod.processMsg(this.client, message);
  }
}
