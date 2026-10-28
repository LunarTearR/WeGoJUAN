import { createBrowserRouter, Navigate } from 'react-router'
import { RequireUser } from '@/features/auth/components/require-user'
import { AppLayout } from './routes/app-layout'
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
    // AppShell อยู่ใน components (shared) จึง import feature เองไม่ได้ — AppLayout ประกอบให้ที่ฝั่ง app
    element: <AppLayout />,
    children: [
      {
        element: <RequireUser />,
        children: [
          // หน้าแรกหลัง login คือทริปของฉัน — ลิงก์เก่าที่ชี้ / ยังใช้ได้
          { index: true, element: <Navigate to="/trips" replace /> },
          { path: 'calendar', element: <CalendarRoute /> },
          { path: 'trips', element: <TripsRoute /> },
          { path: 'trips/new', element: <TripNewRoute /> },
        ],
      },
      // Guest เปิดหน้าทริปได้โดยไม่ login — server ตอบ 404 ถ้าไม่ได้เป็นสมาชิก
      { path: 'trips/:tripId', element: <TripDetailRoute /> },
      { path: 'login', element: <LoginRoute /> },
      { path: 'register', element: <RegisterRoute /> },
      { path: 'join/:code', element: <JoinRoute /> },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
])
