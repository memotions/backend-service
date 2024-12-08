import { eq } from 'drizzle-orm';
import {
  AddEmotionAnalysis,
  EmotionAnalysis,
  EmotionsCount,
  GroupedEmotionAnalysis,
} from '../types/emotions.types';
import db from '../db';
import { emotionAnalysis } from '../db/schema/emotions.schema';
import { journals } from '../db/schema/journals.schema';

export default class EmotionAnalysisService {
  public static async addEmotionAnalysis(
    journalId: number,
    emotionAnalysisEntries: AddEmotionAnalysis[],
  ): Promise<EmotionAnalysis[]> {
    const newEmotionAnalysis = await db
      .insert(emotionAnalysis)
      .values(emotionAnalysisEntries.map(entry => ({ ...entry, journalId })))
      .onConflictDoNothing()
      .returning();

    return newEmotionAnalysis;
  }

  public static async getEmotionAnalysis(
    userId: number,
  ): Promise<EmotionAnalysis[]> {
    const emotionAnalyzed = await db
      .select({
        id: emotionAnalysis.id,
        journalId: emotionAnalysis.journalId,
        emotion: emotionAnalysis.emotion,
        confidence: emotionAnalysis.confidence,
        analyzedAt: emotionAnalysis.analyzedAt,
      })
      .from(emotionAnalysis)
      .leftJoin(journals, eq(journals.id, emotionAnalysis.journalId))
      .where(eq(journals.userId, userId));

    return emotionAnalyzed;
  }

  public static async getGroupedEmotionAnalysis(
    userId: number,
  ): Promise<GroupedEmotionAnalysis[]> {
    const groupedEmotionAnalysis = await db.query.journals.findMany({
      where: eq(journals.userId, userId),
      columns: {
        id: true,
        datetime: true,
      },
      with: {
        emotionAnalysis: {
          columns: {
            emotion: true,
            confidence: true,
            analyzedAt: true,
          },
        },
      },
    });

    return groupedEmotionAnalysis
      .filter(journal => journal.emotionAnalysis.length > 0)
      .map(journal => ({
        journalId: journal.id,
        journalDatetime: journal.datetime,
        emotionAnalysis: journal.emotionAnalysis.map(emotion => ({
          emotion: emotion.emotion,
          confidence: emotion.confidence,
        })),
        analyzedAt: journal.emotionAnalysis[0]?.analyzedAt ?? new Date(),
      }));
  }

  public static async getEmotionsCount(userId: number): Promise<EmotionsCount> {
    const emotionAnalyzed = await db
      .select({
        emotion: emotionAnalysis.emotion,
      })
      .from(journals)
      .innerJoin(emotionAnalysis, eq(emotionAnalysis.journalId, journals.id))
      .where(eq(journals.userId, userId));

    const emotionsMap: Record<string, number> = {
      HAPPY: 0,
      SAD: 0,
      NEUTRAL: 0,
      ANGER: 0,
      SCARED: 0,
    };

    const emotionsCount = emotionAnalyzed.reduce(
      (acc, { emotion }) => {
        if (emotion in emotionsMap) {
          acc[emotion.toLowerCase() as keyof EmotionsCount] += 1;
        }
        return acc;
      },
      {
        happy: 0,
        sad: 0,
        neutral: 0,
        anger: 0,
        scared: 0,
      },
    ) as EmotionsCount;

    return emotionsCount;
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
