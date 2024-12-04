import { desc, eq } from 'drizzle-orm';
import {
  AddEmotionAnalysis,
  EmotionAnalysis,
  EmotionsCount,
} from '../types/emotions.types';
import db from '../db';
import { journals } from '../db/schema/journals.schema';
import { emotionAnalysis } from '../db/schema/emotions.schema';

export default class EmotionsService {
  public static async addEmotionAnalysis(
    journalId: number,
    emotionAnalysisEntries: AddEmotionAnalysis[],
  ): Promise<EmotionAnalysis[]> {
    const newEmotionAnalysis = await db
      .insert(emotionAnalysis)
      .values(emotionAnalysisEntries.map(entry => ({ ...entry, journalId })))
      .returning();

    return newEmotionAnalysis;
  }

  public static async getEmotionsCount(userId: number): Promise<EmotionsCount> {
    const emotionAnalyzed = await db
      .select()
      .from(emotionAnalysis)
      .where(eq(emotionAnalysis.journalId, userId));

    const emotionsCount: EmotionsCount = {
      happy: 0,
      sad: 0,
      neutral: 0,
      anger: 0,
      scared: 0,
    };

    emotionAnalyzed.forEach(emotion => {
      if (emotion.emotion === 'HAPPY') {
        emotionsCount.happy += 1;
      } else if (emotion.emotion === 'SAD') {
        emotionsCount.sad += 1;
      } else if (emotion.emotion === 'NEUTRAL') {
        emotionsCount.neutral += 1;
      } else if (emotion.emotion === 'ANGER') {
        emotionsCount.anger += 1;
      } else if (emotion.emotion === 'SCARED') {
        emotionsCount.scared += 1;
      }
    });

    return emotionsCount;
  }

  public static async getEmotionAnalysis(userId: number) {
    const emotionAnalyzed = await db.query.emotionAnalysis.findMany({
      where: eq(journals.userId, userId),
      orderBy: desc(emotionAnalysis.analyzedAt),
      with: {
        journal: true,
      },
    });

    return emotionAnalyzed;
  }

  public static async getPositiveCount(userId: number): Promise<number> {
    const { happy: positiveCount } = await this.getEmotionsCount(userId);

    return positiveCount;
  }

  public static async getRiseCount(userId: number): Promise<number> {
    const emotionAnalyzed = await this.getEmotionAnalysis(userId);

    const negativeEmotions = new Set(['SCARED', 'ANGER', 'SAD']);
    const positiveEmotions = new Set(['HAPPY']);

    return emotionAnalyzed
      .map((item, index, arr) =>
        index < arr.length - 1 &&
        arr[index].journalId !== arr[index + 1].journalId &&
        negativeEmotions.has(item.emotion) &&
        positiveEmotions.has(arr[index + 1].emotion)
          ? 1
          : 0,
      )
      .reduce((sum: number, current: 1 | 0) => sum + current, 0);
  }
}
