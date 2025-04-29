import { Entities, migrations } from '@veramo/data-store';
import { DataSource } from 'typeorm';
import { MyCredential } from './vc/my-credential.entity';

const DATABASE_FILE = 'database.sqlite'

const dbConnection = new DataSource({
    type: 'sqlite',
    database: DATABASE_FILE,
    synchronize: false,
    migrations,
    migrationsRun: true,
    logging: ['error', 'info', 'warn'],
    entities: [...Entities, MyCredential],
  }).initialize()

export default dbConnection;