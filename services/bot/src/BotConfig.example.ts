import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Options, ReflectMetadataProvider } from '@mikro-orm/core';
import { join } from "path";
import InfractionEntity from './lib/database/entities/InfractionEntity';

export const POSTGRES_USERNAME = '';
export const POSTGRES_PASSWORD = '';
export const POSTGRES_DATABASE = '';
export const POSTGRES_PORT = 5432;
export const POSTGRES_HOST = 'postgres';
export const POSTGRES_URL = `postgres://${POSTGRES_USERNAME}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`;
 
export const REDIS_HOST = 'redis';

const MICROORM_DATABASE_OPTIONS: Options<PostgreSqlDriver> = {
    clientUrl: POSTGRES_URL,
    type: 'postgresql',
    driver: PostgreSqlDriver,
    entitiesTs: [InfractionEntity],
    entities: [join(__dirname, './lib/database/entities/*.js')],
    metadataProvider: ReflectMetadataProvider
}

export default MICROORM_DATABASE_OPTIONS;

export const OWNERS = ['100690330336129024', '253603803662778369'];

export const DISCORD_TOKEN = '';
