import { redirect } from 'next/navigation';

export default function RootRedirectPage() {
  // Default route should redirect to kiosk
  redirect('/kiosk');
}
