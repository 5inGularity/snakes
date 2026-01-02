import { Route as rootRoute } from './routes/__root'
import { Route as IndexRoute } from './routes/index'
import { Route as ClassicRoute } from './routes/classic'
import { Route as AdderRoute } from './routes/adder'

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  ClassicRoute,
  AdderRoute,
])
