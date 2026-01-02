import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import AdderSnake from '../games/AdderSnake'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/adder',
  component: AdderSnake,
})
