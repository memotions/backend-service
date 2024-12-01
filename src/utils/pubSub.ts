import 'dotenv/config';
import { z } from 'zod';
import { PubSub, Topic } from '@google-cloud/pubsub';
import Logger from './logger';
import { PubsubEvent, PubsubEventSchema } from '../types/pubsubs.types';

export default class PubSubService {
  private pubSubClient: PubSub;

  private topic: Topic;

  constructor(
    private topicId: string = process.env.TOPIC_ID || ''
  ) {
    // Check if TOPIC_ID is set
    if (!topicId) {
      throw new Error('A topic name must be specified. Please set the TOPIC_ID environment variable.');
    }
    this.pubSubClient = new PubSub();
    this.topic = this.pubSubClient.topic(topicId);
  }

  async publishEventToPubSub(RawJournal: unknown): Promise<string | null> {
    try {
      // Validate Data Entries
      const event = PubSubService.validateEvent(RawJournal);

      // Convert to buffer
      const dataBuffer = Buffer.from(JSON.stringify(event));
      Logger.debug(`Data: ${dataBuffer}`);

      // Publish message
      const messageId = await this.topic.publishMessage({ data: dataBuffer });
      Logger.info(`Message ${messageId} published to topic ${this.topicId}`);
      
      return messageId;

      // exception
    } catch (error) {
      if (error instanceof z.ZodError) {
          Logger.error('Validation failed', {
          errors: error.errors
        });
        throw new Error(
          `Validation Error: ${error.errors
            .map(e => `${e.path.join('.')} - ${e.message}`)
            .join(', ')}`
        );
      }
      Logger.error('Failed to publish event to PubSub', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private static validateEvent(rawEvent: unknown = {}): PubsubEvent {
    return PubsubEventSchema.parse(rawEvent);
  }
}