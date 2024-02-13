import { HttpError, MiddlewareFn, ParsedNamedMiddleware } from '@adonisjs/core/types/http'
import { ModelColumnOptions } from '@adonisjs/lucid/types/model'
import { RelationshipsContract } from '@adonisjs/lucid/types/relations'
import { AllowedSessionValues, SessionConfig, SessionData } from '@adonisjs/session/types'
import { AdminJSOptions, BaseAuthProvider } from 'adminjs'
import { Column } from 'knex-schema-inspector/dist/types/column.js'

export interface BaseAuthOptions {
  enabled: boolean
}

export interface EnabledAuthOptions extends BaseAuthOptions {
  enabled: true
  provider: BaseAuthProvider
  middlewares?: (MiddlewareFn | ParsedNamedMiddleware)[]
}

export interface AdminJSProviderConfig {
  /**
   * Adapter configuration
   */
  adapter: {
    enabled: boolean
  }
  /**
   * AdminJS configuration object
   */
  adminjs: Omit<AdminJSOptions, 'databases'>
  /**
   * Authentication configuration
   */
  auth: EnabledAuthOptions | BaseAuthOptions
  /**
   * Middlewares which will be applied to ALL AdminJS routes
   */
  middlewares?: (MiddlewareFn | ParsedNamedMiddleware)[]
}

// Custom Session interface duplicating keys from @adonisjs/session since Session is not exported
export interface SessionI {
  config: SessionConfig

  get sessionId(): string
  get fresh(): boolean
  get readonly(): boolean
  get initiated(): boolean
  get hasRegeneratedSession(): boolean
  get isEmpty(): boolean
  get hasBeenModified(): boolean
  initiate(readonly: boolean): Promise<void>
  put(key: string, value: AllowedSessionValues): void
  has(key: string): boolean
  get(key: string, defaultValue?: any): any
  all(): any
  forget(key: string): void
  pull(key: string, defaultValue?: any): any
  increment(key: string, steps?: number): void
  decrement(key: string, steps?: number): void
  clear(): void
  flash(key: string, value: AllowedSessionValues): void
  flash(keyValue: SessionData): void
  flashErrors(errorsCollection: Record<string, string | string[]>): void
  flashValidationErrors(error: HttpError): void
  flashAll(): void
  flashExcept(keys: string[]): void
  flashOnly(keys: string[]): void
  reflash(): void
  reflashOnly(keys: string[]): void
  reflashExcept(keys: string[]): void
  regenerate(): void
  commit(): Promise<void>
}

export interface LucidColumnMetadata {
  lucidColumn: ModelColumnOptions
  lucidRelation?: RelationshipsContract
  databaseColumn: Column
}

export interface LucidResourceMetadata {
  columns: Map<string, LucidColumnMetadata>
  relations: Map<string, RelationshipsContract>
}
