import AdminGate from '@/components/auth/AdminGate'
import AdminDashboard from '@/components/auth/AdminDashboard'

export default function AdminPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <AdminDashboard />
      </AdminGate>
    </main>
  )
}
