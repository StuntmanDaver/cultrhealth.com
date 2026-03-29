import { redirect } from 'next/navigation'

export default function ClubOrdersPage() {
  redirect('/admin/orders?tab=pending')
}
