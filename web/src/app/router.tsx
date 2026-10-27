import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { RequireUser } from '@/features/auth/components/require-user'
import { UserMenu } from '@/features/auth/components/user-menu'
import { CalendarRoute } from './routes/calendar'
import { JoinRoute } from './routes/join'
import { LoginRoute } from './routes/login'
import { NotFoundRoute } from './routes/not-found'
import { RegisterRoute } from './routes/register'
import { TripDetailRoute } from './routes/trip-detail'
import { TripNewRoute } from './routes/trip-new'
import { TripsRoute } from './routes/trips'

export const router = createBrowserRouter([
  {
    // AppShell อยู่ใน components (shared) จึง import feature เองไม่ได้ — ส่ง UserMenu เข้าไปจากตรงนี้
    element: <AppShell actions={<UserMenu />} />,
    children: [
      {
        element: <RequireUser />,
        children: [
          { index: true, element: <CalendarRoute /> },
          { path: 'trips', element: <TripsRoute /> },
          { path: 'trips/new', element: <TripNewRoute /> },
          { path: 'trips/:tripId', element: <TripDetailRoute /> },
        ],
      },
      { path: 'login', element: <LoginRoute /> },
      { path: 'register', element: <RegisterRoute /> },
      { path: 'join/:code', element: <JoinRoute /> },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
])
