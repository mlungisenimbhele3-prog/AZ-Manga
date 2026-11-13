declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: {
      datasources?: { db?: { url?: string } };
      log?: Array<'error' | 'warn' | 'info' | 'query'>;
    });
    $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: any[]): Promise<T>;
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    [key: string]: any;
  }
}
