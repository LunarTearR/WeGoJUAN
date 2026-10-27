import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { RequireUser } from '@/features/auth/components/require-user'
import { UserMenu } from '@/features/auth/components/user-menu'
import { CalendarRoute } from './routes/calendar'
import { EventDetailRoute } from './routes/event-detail'
import { LoginRoute } from './routes/login'
import { NotFoundRoute } from './routes/not-found'
import { RegisterRoute } from './routes/register'

export const router = createBrowserRouter([
  {
    // AppShell อยู่ใน components (shared) จึง import feature เองไม่ได้ — ส่ง UserMenu เข้าไปจากตรงนี้
    element: <AppShell actions={<UserMenu />} />,
    children: [
      {
        element: <RequireUser />,
        children: [{ index: true, element: <CalendarRoute /> }],
      },
      { path: 'login', element: <LoginRoute /> },
      { path: 'register', element: <RegisterRoute /> },
      { path: 'events/:eventId', element: <EventDetailRoute /> },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
])
