import { Listener } from "discord-akairo";
import Logger from "../structures/Logger";
import MemberModel from "../models/MemberModel";
import { getModelForClass } from "@typegoose/typegoose";
import { MessageEmbed } from "discord.js";
import { utc } from "moment";
import Config from "../config";
import uniqid from "uniqid";
import { findChannel, modLog } from "../structures/Utils";
import date from "date.js";

export default class Ready extends Listener {
  constructor() {
    super("ready", {
      emitter: "client",
      event: "ready",
      category: "client",
    });
  }

  public async exec(): Promise<void> {
    setInterval(() => {
      const index = Config.statuses[Math.floor(Math.random() * Config.statuses.length)];
      this.client.user.setActivity(index, { type: "PLAYING" });
    }, 15000);

    Logger.success("READY", "Succesfully set bot activity.");

    const muteModel = getModelForClass(MemberModel);

    setInterval(async () => {
      await muteModel
        .find({ "mute.muted": true, "mute.isPerm": false })
        .then((members) => {
          members.forEach((member) => {
            this.client.databaseCache_mutedUsers.set(
              `${member.userId}-${member.guildId}`,
              member
            );
          });
        });
      this.client.databaseCache_mutedUsers
        .array()
        .filter((m) => m.mute.endDate <= date("now"))
        .forEach(async (memberData) => {
          const guild = this.client.guilds.cache.get(Config.mainGuildId);
          if (!guild) return;
          const caseNum = uniqid();
          memberData.mute = {
            muted: false,
            isPerm: false,
            endDate: null,
            case: caseNum,
          };
          const muteRole = guild.roles.cache.get(Config.roles.muteRole);
          if (!muteRole) return;
          const inRole = muteRole.members.find(
            (r) => r.id === memberData.userId
          );
          if (inRole) {
            try {
              await inRole.roles.remove(muteRole);
            } catch (e) {
              Logger.error("Unmute", e);
              return;
            }
          } else {
            return;
          }
          const caseInfo = {
            caseID: caseNum,
            moderator: this.client.user.tag,
            moderatorId: this.client.user.id,
            user: `${inRole.user.tag} (${memberData.userId})`,
            date: utc().format("MMMM Do YYYY, h:mm:ss a"),
            type: "Unmute",
            reason: "[Auto] Unmuted",
          };
          this.client.databaseCache_mutedUsers.delete(
            `${memberData.userId}-${memberData.guildId}`
          );
          try {
            await muteModel.findOneAndUpdate(
              {
                guildId: guild.id,
                userId: memberData.userId,
              },
              {
                guildId: guild.id,
                userId: memberData.userId,
                $set: {
                  mute: memberData.mute,
                },
                $push: {
                  sanctions: caseInfo,
                },
              },
              {
                upsert: true,
              }
            );
          } catch (e) {
            Logger.error("Auto Unmute", e);
            return;
          }
          const logEmbed = new MessageEmbed()
            .setTitle(
              `Member Unmuted | Case \`${caseNum}\` | ${inRole.user.tag}`
            )
            .addField(`User:`, `<@${inRole.id}>`, true)
            .addField(`Moderator:`, `<@${this.client.user.id}>`, true)
            .addField(`Reason:`, caseInfo.reason, true)
            .setFooter(
              `ID: ${memberData.userId} | ${utc().format(
                "MMMM Do YYYY, h:mm:ss a"
              )}`
            )
            .setColor("RED");

          let modlogChannel = findChannel(
            this.client,
            Config.channels.modLogChannel
          );
          modLog(modlogChannel, logEmbed, guild.iconURL());
          Logger.event(`Auto Unmuted ${memberData.userId}!`);
        });
    }, 60000);
    Logger.success("READY", `${this.client.user.tag} is now online!`);
  }
}
