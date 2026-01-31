import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { CustomerCard } from '@/components/CustomerCard';
import { useCustomers } from '@/hooks/useData';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
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
              <p className="text-muted-foreground">No customers found</p>
              <Link
                to="/customers/new"
                className="inline-flex items-center gap-2 mt-4 text-primary font-medium"
              >
                <Plus className="w-4 h-4" />
                Add your first customer
              </Link>
            </div>
          ) : (
            filteredCustomers?.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link to="/customers/new" className="fab text-white">
        <Plus className="w-6 h-6" />
      </Link>
    </MainLayout>
  );
}
