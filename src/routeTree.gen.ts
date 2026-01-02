import { Route as rootRoute } from './routes/__root'
import { Route as IndexRoute } from './routes/index'
import { Route as ClassicRoute } from './routes/classic'

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  ClassicRoute,
])
