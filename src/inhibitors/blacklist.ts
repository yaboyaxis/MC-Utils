import { getModelForClass } from "@typegoose/typegoose";
import { Inhibitor } from "discord-akairo";
import { Message, MessageEmbed } from "discord.js";
import MemberModel from "../models/MemberModel";

export default class BlacklistInhibitor extends Inhibitor {
    constructor() {
        super("blacklist", {
            reason: "Blacklisted by Moderator",
        });
    }

    async exec(message: Message) {
        const memberModel = getModelForClass(MemberModel);
        const userModel = await memberModel.findOne({
            guildId: message.guild.id,
            userId: message.author.id,
        });
        const embed = new MessageEmbed().setDescription(`<@!${message.author.id}>, you've been blacklisted from using the bot.`);
        const msg = await message.channel.send(embed);
        msg.delete({ timeout: 10000 });
        // if (
        //     userModel.blacklisted === null ||
        //     userModel.blacklisted === undefined
        // ) {
        //     return false;
        // } else if (
        //     userModel.blacklisted === true) {
        //     return true;
        // } else {
        //     return false;
        // }
        return false;
    }
}