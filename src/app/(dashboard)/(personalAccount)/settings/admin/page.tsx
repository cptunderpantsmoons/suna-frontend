'use client';

import { CostTracking } from '@/components/admin';
import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">
            Manage platform settings and view usage analytics
          </p>
        </div>
        
        <CostTracking />
      </div>
    </AdminGuard>
  );
}
