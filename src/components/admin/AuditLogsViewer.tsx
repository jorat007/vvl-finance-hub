import { useState } from 'react';
import { useAuditLogs } from '@/hooks/useAdmin';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, User, Clock, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-success/10 text-success',
  UPDATE: 'bg-primary/10 text-primary',
  DELETE: 'bg-destructive/10 text-destructive',
  SOFT_DELETE: 'bg-warning/10 text-warning',
  RESTORE: 'bg-success/10 text-success',
};

export function AuditLogsViewer() {
  const { data: logs, isLoading } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  const tables = [...new Set(logs?.map((l) => l.table_name) || [])];
  const actions = [...new Set(logs?.map((l) => l.action) || [])];

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTable = filterTable === 'all' || log.table_name === filterTable;
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesTable && matchesAction;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="form-section space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select value={filterTable} onValueChange={setFilterTable}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              {tables.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs List */}
      <div className="form-section">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Activity Log</h3>
          <Badge variant="outline">{filteredLogs?.length || 0} entries</Badge>
        </div>

        {filteredLogs?.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No logs found</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredLogs?.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-border bg-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cn('text-xs', ACTION_COLORS[log.action] || 'bg-muted')}>
                      {log.action}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Database className="w-3 h-3 mr-1" />
                      {log.table_name}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {log.user_name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {log.record_id && (
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    ID: {log.record_id}
                  </p>
                )}

                {/* Show data changes for updates */}
                {log.action === 'UPDATE' && log.new_data && (
                  <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                    <p className="text-muted-foreground">Changes:</p>
                    <pre className="text-foreground overflow-x-auto">
                      {JSON.stringify(log.new_data, null, 2).slice(0, 200)}
                      {JSON.stringify(log.new_data).length > 200 && '...'}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
