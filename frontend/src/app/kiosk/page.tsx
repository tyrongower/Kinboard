import { redirect } from 'next/navigation';

export default function KioskRedirectPage() {
  // Redirect /kiosk to the default tab path so URL is shareable and refresh-safe
  redirect('/kiosk/jobs');
}
