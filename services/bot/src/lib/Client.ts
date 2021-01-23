import { SapphireClient, SapphireClientOptions } from "@sapphire/framework";
import { ClientOptions } from "discord.js";
import Database from "./database/Database";
import Util from "../util/Util";

export default class Client extends SapphireClient {
  public readonly util: Util = new Util(this);
  public readonly db: Database = new Database();

  constructor(options?: SapphireClientOptions & ClientOptions) {
    super(options);
  }

  public async login(token: string) {
    await this.db.init();
    
    return super.login(token);
  }
}
