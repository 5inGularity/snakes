import { Route as rootRoute } from './routes/__root'
import { Route as IndexRoute } from './routes/index'
import { Route as ClassicRoute } from './routes/classic'
import { Route as AdderRoute } from './routes/adder'
import { Route as TimeTrialRoute } from './routes/time-trial'
import { Route as DoubleHelixRoute } from './routes/double-helix'
import { Route as PicassonakeRoute } from './routes/picassonake'

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  ClassicRoute,
  AdderRoute,
  TimeTrialRoute,
  DoubleHelixRoute,
  PicassonakeRoute,
])
