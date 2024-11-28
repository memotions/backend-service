import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { schemas, relations } from './schema';

const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...schemas,
    ...relations,
  },
});
export default db;
