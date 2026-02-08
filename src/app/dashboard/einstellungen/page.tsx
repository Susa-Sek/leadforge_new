// Settings Base Page - Redirect to Profile
// Route: /dashboard/einstellungen

import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/dashboard/einstellungen/profil');
}
