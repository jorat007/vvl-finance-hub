import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { CustomerCard } from '@/components/CustomerCard';
import { useCustomers } from '@/hooks/useData';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyCustomersIllustration } from '@/components/illustrations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: customers, isLoading } = useCustomers();
  const { isAdmin } = useAuth();

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.mobile.includes(search) ||
      customer.area.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || customer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout title="Customers">
      <div className="px-4 py-4 space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input pl-12"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-12 rounded-xl">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="defaulted">Defaulted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : filteredCustomers?.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-primary mb-4">
                <EmptyCustomersIllustration />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">No customers found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {search ? 'Try a different search term' : isAdmin ? 'Start by adding your first customer' : 'No customers assigned to you yet'}
              </p>
              {isAdmin && (
                <Link
                  to="/customers/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Link>
              )}
            </div>
          ) : (
            filteredCustomers?.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button - Only visible to admins */}
      {isAdmin && (
        <Link to="/customers/new" className="fab text-white">
          <Plus className="w-6 h-6" />
        </Link>
      )}
    </MainLayout>
  );
}
