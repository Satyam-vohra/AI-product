"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorDB = void 0;
const embeddings_service_1 = __importDefault(require("./embeddings-service"));
const kb_model_1 = __importDefault(require("../../infrastructure/models/kb-model"));
/**
 * Lightweight in-memory vector index backed by KB entries with embeddings.
 * On startup, it can load existing KB embeddings and provide nearest-neighbour queries.
 */
class VectorDB {
    static index = new Map();
    static async loadIndex() {
        const docs = await kb_model_1.default.find({ embeddings: { $exists: true } }).lean();
        for (const d of docs) {
            if (d.embeddings && d.embeddings.length) {
                this.index.set(String(d._id), {
                    id: String(d._id),
                    kbId: String(d._id),
                    title: d.title,
                    vector: d.embeddings,
                    metadata: { productId: d.productId, fileUrl: d.fileUrl },
                });
            }
        }
    }
    static async upsertRecord(kbId, title, vector, metadata) {
        this.index.set(kbId, { id: kbId, kbId, title, vector, metadata });
        // persist to KB document as well
        await kb_model_1.default.findByIdAndUpdate(kbId, { embeddings: vector }).exec();
    }
    static query(vector, topK = 5) {
        const hits = [];
        for (const rec of this.index.values()) {
            const score = embeddings_service_1.default.cosineSim(vector, rec.vector);
            hits.push({ record: rec, score });
        }
        return hits.sort((a, b) => b.score - a.score).slice(0, topK);
    }
}
exports.VectorDB = VectorDB;
exports.default = VectorDB;
