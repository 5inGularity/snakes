import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { lazy } from 'react'

const AdderSnake = lazy(() => import('../games/AdderSnake'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/adder',
  component: AdderSnake,
})
