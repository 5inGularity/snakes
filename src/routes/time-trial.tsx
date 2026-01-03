import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import TimeTrialSnake from '../games/TimeTrialSnake'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/time-trial',
  component: TimeTrialSnake,
})
