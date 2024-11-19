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
import { UserSelf } from '@/lib/types';
import { Edit, MoreHorizontal, Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

interface CellActionProps {
  data: UserSelf;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async (user: UserSelf) => {
    // deleteUser(user);
    manageUser(user.username, 'delete');
  };

  const manageUser = async (username: string, action: string) => {
    const params = {
      action: action,
      username: username
    };
    // Implement disable logic here
    const res = await fetch(`/api/user/manage`, {
      method: 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { data, success } = await res.json();
    console.log('data', data);
    if (success) {
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
            onClick={() => router.push(`/dashboard/user/${data.id}`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              manageUser(
                data.username,
                data.status === 1 ? 'disable' : 'enable'
              )
            }
          >
            <span className="mr-2 h-4 w-4"></span>{' '}
            {data.status === 1 ? 'Disable' : 'Enable'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => manageUser(data.username, 'promote')}
          >
            <span className="mr-2 h-4 w-4"></span> Increase
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => manageUser(data.username, 'demote')}>
            <span className="mr-2 h-4 w-4"></span> Lower
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
