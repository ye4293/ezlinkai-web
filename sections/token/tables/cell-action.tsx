'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
// import { Channel } from '@/constants/data';
import { Token } from '@/lib/types';
import { Edit, MoreHorizontal, Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

interface CellActionProps {
  data: Token;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async (token: Token) => {
    deleteToken(token);
  };

  const manageToken = async (token: Token) => {
    const params = {
      id: token.id,
      status: token.status === 1 ? 2 : 1,
      status_only: true
    };
    // Implement disable logic here
    const res = await fetch(`/api/token`, {
      method: 'PUT',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { data, success } = await res.json();
    console.log('data', data);
    if (success) {
      window.location.reload(); // Refresh the page on success
    }
  };

  const deleteToken = async (token: Token) => {
    // Implement disable logic here
    const res = await fetch(`/api/token/${token.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const { data, success } = await res.json();
    console.log('data', data);
    if (success) {
      setOpen(false);
      window.location.reload(); // Refresh the page on success
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => onConfirm(data)}
        loading={loading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/token/${data.id}`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => manageToken(data)}>
            <span className="mr-2 h-4 w-4"></span>{' '}
            {data.status === 1 ? 'Disable' : 'Enable'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
