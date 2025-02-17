declare module 'std/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response>): void
}

declare module 'smtp/mod.ts' {
  export class SmtpClient {
    constructor()
    connectTLS(config: {
      hostname: string
      port: number
      username: string
      password: string
    }): Promise<void>
    send(options: {
      from: string
      to: string
      subject: string
      content: string
      html: string
    }): Promise<void>
    close(): Promise<void>
  }
}

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined
  }
  export const env: Env

  export interface Kv {
    set(key: unknown[], value: unknown): Promise<void>
    list<T>(options: { prefix: unknown[] }): AsyncIterable<{
      key: unknown[]
      value: T
    }>
  }
  export function openKv(): Promise<Kv>
}
