import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import ClassicSnake from '../games/ClassicSnake'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/classic',
  component: ClassicSnake,
})
