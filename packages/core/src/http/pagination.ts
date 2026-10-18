import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;
/** Upper bound so a single request cannot ask the database for an unbounded result set. */
export const MAX_PAGE_SIZE = 100;

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PageQuery = z.output<typeof pageQuerySchema>;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
