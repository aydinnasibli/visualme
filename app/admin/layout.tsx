import type { Metadata } from 'next'
import { checkRole } from '@/lib/utils/roles'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: 'Admin — VisualMe',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkRole('admin')
  if (!isAdmin) redirect('/')

  return (
    <div className="h-screen flex bg-[#101622] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
