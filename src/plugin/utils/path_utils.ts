export const parsePathParams = (routePath: string) =>
  routePath.replace(/\{/g, ':').replace(/\}/g, '')

export const normalizePath = (adminPath: string, rootPath: string) => {
  const strippedRootPath = adminPath.replace(rootPath, '')

  return strippedRootPath
}
