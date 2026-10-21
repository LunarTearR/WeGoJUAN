import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { CalendarRoute } from './routes/calendar'
import { EventDetailRoute } from './routes/event-detail'
import { NotFoundRoute } from './routes/not-found'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <CalendarRoute /> },
      { path: 'events/:eventId', element: <EventDetailRoute /> },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
])
