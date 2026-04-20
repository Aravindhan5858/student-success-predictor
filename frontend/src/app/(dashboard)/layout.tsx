import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleGuard from '@/components/shared/RoleGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'professor', 'student']}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
