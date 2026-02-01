import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, FileText } from 'lucide-react';
import { AgentManagement } from '@/components/admin/AgentManagement';
import { CustomerAssignment } from '@/components/admin/CustomerAssignment';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';

export default function AdminPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('agents');

  // Only admins can access this page
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout title="Admin Panel">
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="agents" className="flex items-center gap-2 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="assign" className="flex items-center gap-2 text-xs sm:text-sm">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Assign</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents">
            <AgentManagement />
          </TabsContent>

          <TabsContent value="assign">
            <CustomerAssignment />
          </TabsContent>

          <TabsContent value="logs">
            <AuditLogsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
