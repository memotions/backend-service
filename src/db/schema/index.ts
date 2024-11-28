import {
  achivements,
  userAchievements,
  userAchievementsRelations,
} from './achievements.schema';
import {
  emotionAnalysis,
  emotionAnalysisRelations,
  emotions,
  emotionsRelations,
} from './emotions.schema';
import {
  journals,
  journalFeedbacks,
  journalFeedbacksRelations,
  journalsRelations,
} from './journals.schema';
import {
  levels,
  userLevels,
  levelsRelations,
  userLevelsRelations,
} from './levels.schema';
import { pointTransactions, pointTransactionsRelations } from './points.schema';
import { streaks, streaksRelations } from './streaks.schema';
import {
  tags,
  journalTags,
  journalTagsRelations,
  tagsRelations,
} from './tags.schema';
import { users, usersRelations } from './users.schema';

export const schemas = {
  users,
  usersRelations,
  emotions,
  emotionAnalysis,
  userLevels,
  journalTags,
  tags,
  journals,
  journalFeedbacks,
  pointTransactions,
  streaks,
  levels,
  achivements,
};

export const relations = {
  userAchievementsRelations,
  userAchievements,
  emotionAnalysisRelations,
  emotionsRelations,
  journalsRelations,
  journalFeedbacksRelations,
  levelsRelations,
  userLevelsRelations,
  pointTransactionsRelations,
  streaksRelations,
  journalTagsRelations,
  tagsRelations,
  usersRelations,
};
