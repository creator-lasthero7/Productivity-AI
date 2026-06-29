import '@/app/globals.css';
import { AppProvider } from '@/context/AppContext';
import ToastContainer from '@/components/layout/ToastContainer';

export const metadata = {
  title: 'ProductivityAI — Smart Productivity Hub',
  description: 'AI-powered productivity app with task management, habit tracking, goal setting, calendar, and analytics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
