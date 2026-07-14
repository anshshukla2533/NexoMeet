declare module '@prisma/client' {
  // Temporary shim for editor/TS checks until `npx prisma generate` runs
  export class PrismaClient {
    constructor(...args: any[]);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    // minimal model accessors as any
    [key: string]: any;
  }
  export const Prisma: any;
}
