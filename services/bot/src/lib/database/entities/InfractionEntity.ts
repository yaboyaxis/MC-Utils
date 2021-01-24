import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { DiscordSnowflake as Snowflake } from "@sapphire/snowflake";

export enum InfractionType {
  BAN = "ban",
  FORCEBAN = "forceban",
  UNBAN = "unban",
  MUTE = "mute",
  UNMUTE = "unmute",
  WARN = "warn",
}

@Entity({ tableName: "infractions" })
export default class InfractionEntity {
  @PrimaryKey()
  public id!: string;

  @Property()
  public guild_id!: string;

  @Property()
  public user_id!: string;

  @Property()
  public moderator_id!: string;

  @Property()
  public timestamp!: number;

  @Property()
  public expires!: number;

  @Property()
  public reason!: string;

  @Property()
  public type!: InfractionType;

  constructor(
    guild_id: string,
    user_id: string,
    reason: string,
    expires = 86400000
  ) {
    const timestamp = Date.now();

    this.id = Snowflake.generate({ timestamp }).toString();
    this.guild_id = guild_id;
    this.user_id = user_id;
    this.timestamp = timestamp;
    this.expires = timestamp + expires;
    this.reason = reason;
  }
}
