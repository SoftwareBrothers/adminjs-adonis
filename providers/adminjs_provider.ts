import { ApplicationService } from '@adonisjs/core/types'
import AdminJS, { AdminJSOptions } from 'adminjs'
import SchemaInspector from 'knex-schema-inspector'
import db from '@adonisjs/lucid/services/db'
import { RuntimeException } from '@adonisjs/core/exceptions'

import AdminJSRouter from '../src/plugin/router.js'
import Resource from '../src/adapter/resource.js'
import Database from '../src/adapter/database.js'
import { AdminJSProviderConfig } from '../src/types.js'
import LucidResource from '../src/adapter/lucid_resource.js'

export default class AdminJSProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    /* Create AdminJS instance */
    this.app.container.singleton(AdminJS, async (resolver) => {
      const configService = await resolver.make('config')
      const adminConfig = configService.get<AdminJSProviderConfig>('adminjs')

      const options: Omit<AdminJSOptions, 'resources' | 'databases'> & {
        resources?: LucidResource[]
      } = adminConfig.adminjs ?? {}

      if (adminConfig.adapter.enabled) {
        for (const resource of adminConfig.adminjs.resources ?? []) {
          const knexInstance = db.connection(resource.connectionName).getReadClient()
          if (!knexInstance) {
            throw new RuntimeException('Could not load Knex instance to fetch database schema.')
          }

          const inspector = SchemaInspector.default(knexInstance)
          const actualResource = resource.resource ?? resource

          await actualResource.assignMetadata(inspector)
        }

        AdminJS.registerAdapter({ Resource, Database })
      }

      const admin = new AdminJS(options)

      return admin
    })
    /* Create AdminJS Router instance */
    this.app.container.singleton(AdminJSRouter, async (resolver) => {
      const admin = await resolver.make(AdminJS)

      return new AdminJSRouter(admin)
    })
  }

  async boot() {}

  async start() {
    const configService = await this.app.container.make('config')
    const config = configService.get<AdminJSProviderConfig>('adminjs')
    const router = await this.app.container.make(AdminJSRouter)

    /* Build authenticated or public routes based on configuration */
    if (config.auth.enabled) {
      router.buildAuthenticatedRouter(config)
    } else {
      router.buildRouter(config)
    }

    const admin = await this.app.container.make(AdminJS)

    /* Runtime bundling can be disabled completely */
    if (process.env.ADMIN_JS_SKIP_BUNDLE === 'true') return

    /* In production environment, the bundler should run only once on server's start
    while in development it should rebundle when files are changed */
    if (process.env.NODE_ENV === 'production') {
      await admin.initialize()
    } else {
      admin.watch()
    }
  }

  async ready() {}

  async shutdown() {}
}
