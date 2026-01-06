import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { lazy } from 'react'

const PicassoSnake = lazy(() => import('../games/PicassoSnake'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/picassonake',
  component: PicassoSnake,
})
