export declare class MemoryService {
    static setMemory(userId: string, key: string, value: any, namespace?: string): Promise<void>;
    static getMemory(userId: string, key: string, namespace?: string): Promise<any>;
    static listMemoryForUser(userId: string, namespace?: string): Promise<(import("mongoose").FlattenMaps<import("../../infrastructure/models/memory-model").IUserMemory> & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
export default MemoryService;
