'use client';

import React, { useState } from 'react';
import { useAllUsersCosts, useUserCostsById } from '@/hooks/react-query/admin/use-costs';
import { AdminGuard } from './AdminGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  ChevronRight,
  Calendar,
  Loader2,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

// Configuration constants
const MAX_COST_RECORDS_DISPLAY = 50;
const USER_ID_DISPLAY_LENGTH = 8;

interface CostTrackingProps {
  className?: string;
  /** Maximum number of cost records to display in the detail view */
  maxRecordsDisplay?: number;
}

/**
 * Format a user identifier for display
 * Shows email if available, otherwise truncated user ID
 */
const formatUserIdentifier = (email?: string, userId?: string): string => {
  if (email) return email;
  if (userId) return `${userId.slice(0, USER_ID_DISPLAY_LENGTH)}...`;
  return 'Unknown User';
};

/**
 * CostTracking component for admin users to view and analyze platform costs.
 * Shows total costs, per-user breakdown, and detailed cost records.
 */
export function CostTracking({ 
  className, 
  maxRecordsDisplay = MAX_COST_RECORDS_DISPLAY 
}: CostTrackingProps) {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        return {
          startDate: format(subDays(now, 7), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
        };
      case 'all':
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const { startDate, endDate } = getDateRange();

  const { 
    data: allUsersCosts, 
    isLoading: isLoadingAllCosts,
    error: allCostsError,
  } = useAllUsersCosts(startDate, endDate, true);

  const {
    data: selectedUserCosts,
    isLoading: isLoadingUserCosts,
  } = useUserCostsById(
    selectedUserId || '',
    startDate,
    endDate,
    !!selectedUserId && isDetailDialogOpen
  );

  const handleViewUserDetails = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <AdminGuard>
      <div className={className}>
        <div className="space-y-6">
          {/* Header with date range selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Cost Tracking</h2>
              <p className="text-muted-foreground">
                Monitor platform usage costs across all users
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('week')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Last 7 Days
              </Button>
              <Button
                variant={dateRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('month')}
              >
                This Month
              </Button>
              <Button
                variant={dateRange === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('all')}
              >
                All Time
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAllCosts ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(allUsersCosts?.total_cost_usd || 0)}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAllCosts ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">
                    {allUsersCosts?.users?.length || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Cost/User</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAllCosts ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      allUsersCosts?.users?.length
                        ? (allUsersCosts.total_cost_usd || 0) / allUsersCosts.users.length
                        : 0
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Users Cost Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Costs</CardTitle>
              <CardDescription>
                Breakdown of costs by user for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allCostsError ? (
                <div className="text-center py-8 text-muted-foreground">
                  Error loading cost data. Please try again.
                </div>
              ) : isLoadingAllCosts ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !allUsersCosts?.users?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cost data available for the selected period
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Agent Runs</TableHead>
                      <TableHead className="text-right">Input Tokens</TableHead>
                      <TableHead className="text-right">Output Tokens</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsersCosts.users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {formatUserIdentifier(user.user_email, user.user_id)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(user.total_agent_runs)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(user.total_input_tokens)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(user.total_output_tokens)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(user.total_cost_usd)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUserDetails(user.user_id)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Cost Details</DialogTitle>
              <DialogDescription>
                Detailed breakdown of costs for this user
              </DialogDescription>
            </DialogHeader>

            {isLoadingUserCosts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedUserCosts ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(selectedUserCosts.summary.total_cost_usd)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Agent Runs</div>
                    <div className="text-2xl font-bold">
                      {formatNumber(selectedUserCosts.summary.total_agent_runs)}
                    </div>
                  </div>
                </div>

                {/* Cost Records Table */}
                {selectedUserCosts.costs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Input</TableHead>
                        <TableHead className="text-right">Output</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUserCosts.costs.slice(0, maxRecordsDisplay).map((cost) => (
                        <TableRow key={cost.id}>
                          <TableCell>
                            {format(new Date(cost.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell>{cost.model_name}</TableCell>
                          <TableCell className="text-right">
                            {formatNumber(cost.input_tokens)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(cost.output_tokens)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(cost.cost_usd)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No detailed cost records available
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No data available
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}
