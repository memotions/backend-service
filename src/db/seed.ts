import fs from 'fs';
import db from '.';
import Logger from '../utils/logger';
import { achievementTypes, achievements } from './schema/achievements.schema';
import { levels } from './schema/levels.schema';

type InsertAchievementType = typeof achievementTypes.$inferInsert;
type InsertAchievement = typeof achievements.$inferInsert;
type InsertLevel = typeof levels.$inferInsert;

const defaultAchievementTypes: InsertAchievementType['type'][] = [
  'REGISTER',
  'JOURNAL_STREAK',
  'JOURNAL_COUNT',
  'POSITIVE_COUNT',
  'RISE_COUNT',
  'LEVEL',
  'POSITIVE_STREAK',
];

const defaultAchievements: InsertAchievement[] = JSON.parse(
  fs.readFileSync(`${__dirname}/achievements.json`, 'utf8'),
) as InsertAchievement[];

const defaultLevels: InsertLevel[] = Array.from({ length: 25 }, (_, index) => ({
  level: index + 1,
  pointsRequired: index * (10 + index * 10),
}));

async function main(): Promise<void> {
  Logger.info('Seeding database...');

  try {
    await db
      .insert(achievementTypes)
      .values(defaultAchievementTypes.map(type => ({ type })))
      .onConflictDoNothing();
    await db
      .insert(achievements)
      .values(defaultAchievements)
      .onConflictDoNothing();
    await db.insert(levels).values(defaultLevels).onConflictDoNothing();

    Logger.info('Seeding database completed.');
  } catch (error) {
    Logger.error(error);
  }
}

main();
