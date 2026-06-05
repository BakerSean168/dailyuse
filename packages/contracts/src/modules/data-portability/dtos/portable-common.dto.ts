/**
 * Portable Common — shared primitives for portable schemas
 */

import { z } from 'zod';

export const PortableRefSchema = z.string().regex(/^[a-z][a-zA-Z0-9]*:\d+$/);
export const IsoDateString = z.string();
