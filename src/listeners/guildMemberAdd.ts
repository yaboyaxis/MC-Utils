import { getModelForClass } from "@typegoose/typegoose";
import { Listener } from "discord-akairo";
import { GuildMember } from "discord.js";
import MemberModel from "../models/MemberModel";
import message from "./message";

export default class guildBanAdd extends Listener {
  public constructor() {
    super("guildMemberAdd", {
      emitter: "client",
      event: "guildMemberAdd",
      type: "on",
    });
  }

  public async exec(member: GuildMember): Promise<void> {
    const memberModel = getModelForClass(MemberModel);
    const currentModel = await memberModel.findOne({
      guildId: member.guild.id,
      userId: member.id,
    });
    if (currentModel !== null ?? currentModel !== undefined) return;
    try {
      await memberModel.create({
        guildId: member.guild.id,
        userId: member.id,
        blacklisted: false,
        sanctions: [],
        mute: {
          muted: false,
          endDate: null,
          case: null,
          isPerm: null,
        },
      });
    } catch (e) {
      return void {};
    }
  }
}
