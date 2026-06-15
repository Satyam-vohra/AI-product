import { z } from 'zod';

export const analyticsEventSchema = z.object({
  name: z.string().trim().min(2).max(120),
  path: z.string().trim().max(300).optional(),
  sessionId: z.string().trim().max(180).optional(),
  properties: z.record(z.unknown()).optional(),
});
