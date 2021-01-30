import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity({ tableName: "users" })
export default class UserEntity {
  @PrimaryKey()
  public id!: string;

  @Property()
  public guild_id!: string;

  @Property()
  public blacklisted!: boolean;

  @Property()
  public muted!: boolean;

  constructor(
    id: string,
    guild_id: string,
    blacklisted: boolean = false,
    muted: boolean = false
  ) {
    this.id = id;
    this.guild_id = guild_id;
    this.blacklisted = blacklisted;
    this.muted = muted;
  }
}
