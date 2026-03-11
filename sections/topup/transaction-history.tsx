'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { renderQuota } from '@/utils/render';
import { format } from 'date-fns';

export default function TransactionHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Fetch topup logs (type=2 usually represents topup in this system)
        const res = await fetch('/api/log/self?type=2&pagesize=10');
        if (res.ok) {
          const { data } = await res.json();
          if (data && data.list) {
            setLogs(data.list);
          }
        }
      } catch (error) {
        console.error('Failed to fetch transaction history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <Card className="mt-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-center text-muted-foreground">
            Loading...
          </div>
        ) : logs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(
                      new Date(log.created_at * 1000),
                      'yyyy-MM-dd HH:mm:ss'
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-emerald-600">
                    +{renderQuota(log.quota)}
                  </TableCell>
                  <TableCell>{log.content}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No recent transactions found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
