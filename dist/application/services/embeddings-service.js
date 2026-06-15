"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
/**
 * Simple deterministic embedding generator for offline/local use.
 * Produces fixed-size numeric vectors from text using hashing.
 */
class EmbeddingsService {
    static dim = 128;
    static embedText(text, language = 'en') {
        const seed = this.simpleHash(`${language}::${text}`);
        const vec = new Array(this.dim);
        let v = seed;
        for (let i = 0; i < this.dim; i++) {
            // simple pseudo-random generator based on seed
            v = (v * 1664525 + 1013904223) % 2147483647;
            // scale to [-1,1]
            vec[i] = ((v / 2147483647) * 2) - 1;
        }
        // normalize
        const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
        return vec.map((x) => x / norm);
    }
    static simpleHash(s) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h || 1;
    }
    static cosineSim(a, b) {
        const dim = Math.min(a.length, b.length);
        let dot = 0;
        let na = 0;
        let nb = 0;
        for (let i = 0; i < dim; i++) {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
        return dot / denom;
    }
}
exports.EmbeddingsService = EmbeddingsService;
exports.default = EmbeddingsService;
