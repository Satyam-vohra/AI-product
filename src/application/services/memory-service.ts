import MemoryModel from '../../infrastructure/models/memory-model';

export class MemoryService {
  public static async setMemory(userId: string, key: string, value: any, namespace = 'ai_memory') {
    await MemoryModel.findOneAndUpdate({ userId, key, namespace }, { value }, { upsert: true }).exec();
  }

  public static async getMemory(userId: string, key: string, namespace = 'ai_memory') {
    const doc = await MemoryModel.findOne({ userId, key, namespace }).lean();
    return doc ? doc.value : null;
  }

  public static async listMemoryForUser(userId: string, namespace = 'ai_memory') {
    return MemoryModel.find({ userId, namespace }).lean();
  }
}

export default MemoryService;
