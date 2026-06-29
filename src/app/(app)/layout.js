import Sidebar from '@/components/layout/Sidebar';

export const metadata = {
  title: 'Dashboard — ProductivityAI',
};

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
