export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = async (
  err: { digest?: string } & Error,
  request: {
    path: string
    method: string
    headers: Record<string, string>
  },
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'middleware'
    revalidateReason: 'on-demand' | 'stale' | undefined
    renderSource: 'react-server-components' | 'react-server-components-payload' | undefined
  },
) => {
  const { captureException } = await import('@sentry/nextjs')
  captureException(err, {
    tags: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    extra: {
      method: request.method,
      path: request.path,
      digest: err.digest,
    },
  })
}
