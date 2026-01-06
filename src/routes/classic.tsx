import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { lazy } from 'react'

const ClassicSnake = lazy(() => import('../games/ClassicSnake'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/classic',
  component: ClassicSnake,
})
