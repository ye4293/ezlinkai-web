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
import { Channel } from '@/lib/types';
import {
  Edit,
  MoreHorizontal,
  Trash,
  Ban,
  CircleSlash2,
  Lightbulb,
  ListTree
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ModelsModal } from './models-modal';

interface CellActionProps {
  data: Channel;
  onManageKeys: (channel: Channel) => void;
}

export const CellAction: React.FC<CellActionProps> = ({
  data,
  onManageKeys
}) => {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [modelsModalOpen, setModelsModalOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async (channel: Channel) => {
    manageChannel(channel.id as number, 'delete', '');
  };

  const manageChannel = async (id: number, action: string, value: string) => {
    let _params: {
      id: number;
      status?: number;
      priority?: number;
      weight?: number;
    } = { id };
    let res;
    switch (action) {
      case 'delete':
        res = await fetch(`/api/channel/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        break;
      case 'enable':
        _params.status = 1;
        res = await fetch(`/api/channel/`, {
          method: 'PUT',
          body: JSON.stringify(_params),
          credentials: 'include'
        });
        break;
      case 'disable':
        _params.status = 2;
        res = await fetch(`/api/channel/`, {
          method: 'PUT',
          body: JSON.stringify(_params),
          credentials: 'include'
        });
        break;
      case 'priority':
        if (value === '') {
          return;
        }
        _params.priority = parseInt(value);
        res = await fetch(`/api/channel/`, {
          method: 'PUT',
          body: JSON.stringify(_params),
          credentials: 'include'
        });
        break;
      case 'weight':
        if (value === '') {
          return;
        }
        _params.weight = parseInt(value);
        if (_params.weight < 0) {
          _params.weight = 0;
        }
        res = await fetch(`/api/channel/`, {
          method: 'PUT',
          body: JSON.stringify(_params),
          credentials: 'include'
        });
        break;
    }
    if (res) {
      const { data, success, message } = await res.json();
      console.log('data', data);
      if (success) {
        toast.success('Operation completed successfully!');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(message || 'Operation failed!');
      }
    }
  };

  // 测试单个渠道
  const testChannel = async (id: number, name: string) => {
    try {
      setTestLoading(true);
      const res = await fetch(`/api/channel/test/${id}`, {
        method: 'GET',
        credentials: 'include'
      });
      const { success, message, time } = await res.json();
      router.refresh();
      if (success) {
        router.refresh();
        toast.success(
          `The channel ${name} test succeeds, taking ${time.toFixed(
            2
          )} seconds.`
        );
      } else {
        toast.error(message);
      }
    } finally {
      setTestLoading(false);
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
      <ModelsModal
        channel={data}
        isOpen={modelsModalOpen}
        onClose={() => setModelsModalOpen(false)}
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
            onClick={() => router.push(`/dashboard/channel/${data.id}`)}
          >
            <Edit className="mr-2 h-4 w-4" /> Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
          {data.multi_key_info?.is_multi_key && (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                onManageKeys(data);
              }}
            >
              <ListTree className="mr-2 h-4 w-4" /> 多密钥管理
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() =>
              manageChannel(
                data.id as number,
                data.status === 1 ? 'disable' : 'enable',
                ''
              )
            }
          >
            {data.status === 1 ? (
              <>
                <Ban className="mr-2 h-4 w-4" /> Disable
              </>
            ) : (
              <>
                <CircleSlash2 className="mr-2 h-4 w-4" /> Enable
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => testChannel(data.id as number, data.name as string)}
            disabled={testLoading}
          >
            <Lightbulb className="mr-2 h-4 w-4" />{' '}
            {testLoading ? 'Testing...' : 'Test'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModelsModalOpen(true)}>
            <ListTree className="mr-2 h-4 w-4" /> View Models
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
