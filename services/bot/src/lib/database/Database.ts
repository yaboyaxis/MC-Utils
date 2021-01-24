import { MikroORM, EntityRepository } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import InfractionEntity from "./entities/InfractionEntity";
import MIKROORM_DATABASE_OPTIONS from "../../BotConfig";

export default class Database {
  public orm!: MikroORM<PostgreSqlDriver>;
  public infractions!: EntityRepository<InfractionEntity>;

  constructor() {
    this.orm = null;
    this.infractions = null;
  }

  public async init() {
    this.orm = await MikroORM.init(MIKROORM_DATABASE_OPTIONS);
    await this.orm.connect();

    this.infractions = this.orm.em.getRepository(InfractionEntity);
  }
}
