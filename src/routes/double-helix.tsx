import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import DoubleHelixSnake from '../games/DoubleHelixSnake'

function DoubleHelix() {
  return <DoubleHelixSnake hardcore />
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/double-helix',
  component: DoubleHelix,
})
