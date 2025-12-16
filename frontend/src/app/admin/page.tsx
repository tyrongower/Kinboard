import { redirect } from 'next/navigation';

export default function AdminRedirectPage() {
  // Redirect /admin to the default tab path so URL is shareable and refresh-safe
  redirect('/admin/jobs');
}
