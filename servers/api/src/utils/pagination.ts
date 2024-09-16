import { FastifyRequest } from "fastify";
import { ostring, z } from "zod";

export type LimitOffsetPaginationQuery = {
  offset: number;
  limit: number;
};

export const limitOffsetPaginationSchema = z.object({
  limit: z.any().optional(),
  offset: z.any().optional(),
});

export class LimitOffsetPagination {
  static LIMIT = 16;
  static OFFSET = 0;

  readonly limit: number;
  private readonly offset: number;

  constructor(private readonly url: string, limit?: number, offset?: number) {
    this.limit = limit ?? LimitOffsetPagination.LIMIT;
    this.offset = offset ?? LimitOffsetPagination.OFFSET;
  }

  nextURL() {
    const q = new URLSearchParams();
    q.append("limit", this.limit.toString());
    q.append("offset", (this.getOffset() + this.limit).toString());

    return new URL(this.url).href + "?" + q;
  }

  previousURL() {
    const q = new URLSearchParams();
    q.append("limit", this.limit.toString());
    q.append("offset", this.getOffset().toString());
    const href = new URL(this.url).href;
    return href + (href.endsWith("?") ? "?" : "") + q;
  }

  getResponse<T>(results: T[]) {
    return {
      next: results.length > this.limit ? this.nextURL() : null,
      previous: this.offset > 0 ? this.previousURL() : null,
      results,
    };
  }

  getOffset() {
    return this.offset % this.limit > 0
      ? this.offset - (this.offset % this.limit)
      : this.offset;
  }
}

export const buildURLFromRequest = (req: FastifyRequest) =>
  req.protocol + "://" + req.hostname + req.originalUrl;
