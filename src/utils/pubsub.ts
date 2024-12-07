import 'dotenv/config';
import { z } from 'zod';
import { PubSub, Topic } from '@google-cloud/pubsub';
import Logger from './logger';
import { DataEvent, DataEventSchema } from '../types/pubsubs.types';

export default class PubSubHandler {
  private pubSubClient: PubSub;

  private topic: Topic;

  constructor(private topicId: string = process.env.TOPIC_ID || '') {
    if (!topicId) {
      throw new Error(
        'A topic name must be specified. Please set the TOPIC_ID environment variable.',
      );
    }
    this.pubSubClient = new PubSub();
    this.topic = this.pubSubClient.topic(topicId);
  }

  public async publishEventToPubSub(
    userId: number,
    journalId: number,
    journalContent: string,
  ): Promise<string | null> {
    try {
      const rawEvent = {
        userId,
        journalId,
        journalContent,
      };
      const event: DataEvent = DataEventSchema.parse(rawEvent);

      const dataBuffer = Buffer.from(JSON.stringify(event));
      Logger.debug(`Data to be published: ${dataBuffer}`);

      const messageId = await this.topic.publishMessage({ data: dataBuffer });
      Logger.info(`Message ${messageId} published to topic ${this.topicId}`);

      return messageId;
    } catch (error) {
      if (error instanceof z.ZodError) {
        Logger.error('Validation failed', {
          errors: error.errors,
        });
        throw new Error(
          `Validation Error: ${error.errors
            .map(e => `${e.path.join('.')} - ${e.message}`)
            .join(', ')}`,
        );
      }
      Logger.error('Failed to publish event to PubSub', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
