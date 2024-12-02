import { desc, eq } from 'drizzle-orm';
import { EmotionsCount } from '../types/emotions.types';
import db from '../db';
import { journals } from '../db/schema/journals.schema';
import { emotionAnalysis } from '../db/schema/emotions.schema';

export default class EmotionsService {
  public static async getEmotionsCount(userId: number): Promise<EmotionsCount> {
    const emotionAnalyzed = await db.query.emotionAnalysis.findMany({
      where: eq(journals.userId, userId),
      with: {
        emotion: true,
        journal: true,
      },
    });

    const emotionsCount: EmotionsCount = {
      happy: 0,
      sad: 0,
      neutral: 0,
      angry: 0,
      scared: 0,
    };

    emotionAnalyzed.forEach(e => {
      emotionsCount[e.emotion] += 1;
    });

    return emotionsCount;
  }

  public static async getEmotionAnalysis(userId: number) {
    const emotionAnalyzed = await db.query.emotionAnalysis.findMany({
      where: eq(journals.userId, userId),
      orderBy: desc(emotionAnalysis.analyzedAt),
      with: {
        emotion: true,
        journal: true,
      },
    });

    return emotionAnalyzed;
  }
}
