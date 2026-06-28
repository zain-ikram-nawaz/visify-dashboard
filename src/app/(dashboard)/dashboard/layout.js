import Sidebar from './_sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-auto bg-void">
        {children}
      </main>
    </div>
  );
}
