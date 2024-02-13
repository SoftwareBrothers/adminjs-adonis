import path from 'node:path'
import { HttpContext } from '@adonisjs/core/http'
import router from '@adonisjs/core/services/router'
import AdminJS, { Router as AdminRouter, BaseAuthProvider, RouterType } from 'adminjs'
import { SessionData } from '@adonisjs/session/types'

import { AdminJSProviderConfig, EnabledAuthOptions, SessionI } from '../types.js'
import { checkSession } from './middlewares.js'
import { normalizePath, parsePathParams } from './utils/path_utils.js'

type RequestMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    session: SessionI & SessionData
  }
}

export default class AdminJSRouter {
  private groupPrefix: string

  constructor(protected admin: AdminJS) {
    this.groupPrefix = admin.options.rootPath.startsWith('/')
      ? admin.options.rootPath.slice(1)
      : admin.options.rootPath
  }

  buildRouter(config: AdminJSProviderConfig) {
    const { routes, assets } = AdminRouter

    router
      .group(() => {
        assets.forEach((asset) => {
          router.get(asset.path, this.assetHandler(asset))
        })
        routes.forEach((route) => {
          const parsedPath = parsePathParams(route.path)

          router[route.method.toLowerCase() as RequestMethod](parsedPath, this.routeHandler(route))
        })
      })
      .prefix(this.groupPrefix)
      .middleware(config.middlewares ?? [])

    return this
  }

  buildAuthenticatedRouter(config: AdminJSProviderConfig) {
    const { routes, assets } = AdminRouter

    const bundleComponentsRoute = routes.find((r) => r.action === 'bundleComponents')
    const authRoutes = routes.filter((r) => r.action !== 'bundleComponents')

    this.admin.options.env = {
      ...(this.admin.options.env ?? {}),
      ...(config.auth as EnabledAuthOptions).provider.getUiProps(),
    }

    // Public routes
    router
      .group(() => {
        assets.forEach((asset) => {
          router.get(asset.path, this.assetHandler(asset))
        })

        if (bundleComponentsRoute) {
          router.get(
            parsePathParams(bundleComponentsRoute.path),
            this.routeHandler(bundleComponentsRoute)
          )
        }

        router.get(
          normalizePath(this.admin.options.loginPath, this.admin.options.rootPath),
          this.loginViewHandler((config.auth as EnabledAuthOptions).provider)
        )

        router.post(
          normalizePath(this.admin.options.loginPath, this.admin.options.rootPath),
          this.loginFormHandler((config.auth as EnabledAuthOptions).provider)
        )

        router.get(
          normalizePath(this.admin.options.logoutPath, this.admin.options.rootPath),
          this.logoutHandler((config.auth as EnabledAuthOptions).provider)
        )
      })
      .prefix(this.groupPrefix)
      .middleware(config.middlewares ?? [])

    // Authenticated routes
    router
      .group(() => {
        authRoutes.forEach((route) => {
          const parsedPath = parsePathParams(route.path)

          router[route.method.toLowerCase() as RequestMethod](parsedPath, this.routeHandler(route))
        })
      })
      .prefix(this.groupPrefix)
      .middleware([
        checkSession(this.admin.options.loginPath),
        ...((config.auth as EnabledAuthOptions).middlewares ?? []),
      ])

    return this
  }

  protected assetHandler(asset: RouterType['assets'][number]) {
    return ({ response }: HttpContext) => {
      return response.download(path.resolve(asset.src))
    }
  }

  protected routeHandler(route: RouterType['routes'][number]) {
    return async ({ session, request, params, response }: HttpContext) => {
      const controller = new route.Controller({ admin: this.admin }, session?.get('adminUser'))

      const parsedRequest = {
        ...request,
        params: params,
        query: request.qs(),
        payload: {
          ...request.body(),
          ...request.allFiles(),
        },
        method: request.method().toLowerCase() as RequestMethod,
      }

      const handledRoute = await controller[route.action](parsedRequest, response)

      if (route.contentType) {
        response.header('Content-Type', route.contentType)
      }

      return response.send(handledRoute)
    }
  }

  protected loginViewHandler(provider: BaseAuthProvider) {
    const baseProps = {
      action: this.admin.options.loginPath,
      errorMessage: null,
    }

    return async ({ response }: HttpContext) => {
      const login = await this.admin.renderLogin({
        ...baseProps,
        ...(provider.getUiProps() ?? {}),
      })

      return response.send(login)
    }
  }

  protected loginFormHandler(provider: BaseAuthProvider) {
    return async (ctx: HttpContext) => {
      const { request, response, params, session } = ctx

      const adminUser = await provider.handleLogin(
        {
          headers: request.headers(),
          query: request.qs(),
          params: params,
          data: request.body(),
        },
        ctx
      )

      if (adminUser) {
        session?.put('adminUser', adminUser)

        const redirectTo = session?.get('redirectTo')

        await session?.commit()

        if (redirectTo) {
          return response.redirect(redirectTo)
        }

        return response.redirect(this.admin.options.rootPath)
      }

      const login = await this.admin.renderLogin({
        action: this.admin.options.loginPath,
        errorMessage: 'invalidCredentials',
        ...provider.getUiProps(),
      })

      return response.send(login)
    }
  }

  protected logoutHandler(provider: BaseAuthProvider) {
    return async ({ request, response, session }: HttpContext) => {
      await provider.handleLogout({ req: request, res: response })

      session?.forget('adminUser')
      await session?.commit()

      return response.redirect(this.admin.options.loginPath)
    }
  }
}
