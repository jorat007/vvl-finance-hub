import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';
import { FeaturesManagement } from '@/components/admin/FeaturesManagement';

export default function AdminPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Only admins can access this page
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout title="Admin Panel">
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="users" className="flex items-center gap-2 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2 text-xs sm:text-sm">
              <Settings className="w-4 h-4" />
              <span>Features</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="features">
            <FeaturesManagement />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
