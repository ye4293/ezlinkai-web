'use client';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { Channel } from '@/lib/types';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { renderNumber } from '@/utils/render';
import { useState, useEffect, useContext } from 'react';
import React from 'react';
import { toast } from 'sonner';

type ChannelType = {
  key: number;
  text: string;
  value: number;
};

function useChannelTypes() {
  const [types, setTypes] = useState<ChannelType[]>([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/channel/types', {
          credentials: 'include'
        });
        const { data } = await res.json();
        setTypes(data);
      } catch (error) {
        console.error('Failed to fetch channel types:', error);
      }
    };
    fetchTypes();
  }, []);

  return types;
}

const renderStatus = (status: number) => {
  switch (status) {
    case 1:
      return 'Enabled';
    case 2:
      return 'Disabled';
    case 3:
      return 'Disabled';
    default:
      return 'Unknown status';
  }
};

const renderResponseTime = (test_time: number, response_time: number) => {
  let time: string | number = response_time / 1000;
  time = time.toFixed(2) + ' ' + 's';
  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <span>{response_time === 0 ? 'Not tested' : time}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {test_time
            ? dayjs(test_time * 1000).format('YYYY-MM-DD HH:mm:ss')
            : 'Not tested'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const renderBalance = (type: number, balance: number) => {
  switch (type) {
    case 1: // OpenAI
      return <span>${balance.toFixed(2)}</span>;
    case 4: // CloseAI
      return <span>¥{balance.toFixed(2)}</span>;
    case 8: // 自定义
      return <span>${balance.toFixed(2)}</span>;
    case 5: // OpenAI-SB
      return <span>¥{(balance / 10000).toFixed(2)}</span>;
    case 10: // AI Proxy
      return <span>{renderNumber(balance)}</span>;
    case 12: // API2GPT
      return <span>¥{balance.toFixed(2)}</span>;
    case 13: // AIGC2D
      return <span>{renderNumber(balance)}</span>;
    default:
      return <span>Not supported</span>;
  }
};

// 创建 Context
const ChannelTypesContext = React.createContext<ChannelType[]>([]);

// 创建 Provider 组件
export function ChannelTypesProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const types = useChannelTypes();
  return (
    <ChannelTypesContext.Provider value={types}>
      {children}
    </ChannelTypesContext.Provider>
  );
}

// 创建自定义 hook 来使用 context
const useChannelTypesContext = () => {
  return useContext(ChannelTypesContext);
};

export const columns = (): ColumnDef<Channel>[] => {
  const router = useRouter();

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false
    },
    {
      accessorKey: 'id',
      header: () => <div className="text-center">ID</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue('id')}</div>
    },
    {
      accessorKey: 'name',
      header: () => <div className="text-center">Name</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('name')}</div>
      )
    },
    {
      accessorKey: 'group',
      header: () => <div className="text-center">Group</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('group')}</div>
      )
    },
    {
      accessorKey: 'type',
      header: () => <div className="text-center">Type</div>,
      cell: ({ row }) => {
        const types = useChannelTypesContext();
        const typeText =
          types.find((item) => item.key === row.getValue('type'))?.text || '';
        return <div className="text-center">{typeText}</div>;
      }
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {renderStatus(row.getValue('status'))}
        </div>
      )
    },
    {
      accessorKey: 'response_time',
      header: () => <div className="text-center">Response time</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {renderResponseTime(
            row.original.test_time as number,
            row.getValue('response_time') as number
          )}
        </div>
      )
    },
    {
      accessorKey: 'balance',
      header: () => <div className="text-center">Balance</div>,
      cell: ({ row }) => {
        const updateBalance = async () => {
          const params = {
            id: row.original.id
          };
          const res = await fetch(`/api/channel/update_balance/${params.id}`, {
            method: 'GET',
            credentials: 'include'
          });
          const { success, message } = await res.json();
          if (!success) {
            toast.error(message);
          }

          router.refresh();
        };

        return (
          <TooltipProvider disableHoverableContent>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer text-center"
                  onClick={updateBalance}
                >
                  {renderBalance(row.getValue('type'), row.getValue('balance'))}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Update balance</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      accessorKey: 'priority',
      header: () => <div className="text-center">Priority</div>,
      cell: ({ row }) => {
        const [value, setValue] = useState(row.getValue('priority') as number);

        const handleBlur = async () => {
          try {
            const params = {
              id: row.original.id,
              priority: parseInt(String(value))
            };
            const res = await fetch(`/api/channel`, {
              method: 'PUT',
              body: JSON.stringify(params),
              credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to update priority');

            router.refresh();
          } catch (error) {
            console.error('Error updating priority:', error);
            setValue(row.getValue('priority'));
          }
        };

        return (
          <div className="text-center">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onBlur={handleBlur}
              className="w-16 rounded border text-center"
            />
          </div>
        );
      }
    },
    {
      accessorKey: 'weight',
      header: () => <div className="text-center">Weight</div>,
      cell: ({ row }) => {
        const [value, setValue] = useState(row.getValue('weight') as number);

        const handleBlur = async () => {
          try {
            const params = {
              id: row.original.id,
              weight: parseInt(String(value))
            };
            const res = await fetch(`/api/channel`, {
              method: 'PUT',
              body: JSON.stringify(params),
              credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to update weight');

            router.refresh();
          } catch (error) {
            console.error('Error updating weight:', error);
            setValue(row.getValue('weight'));
          }
        };

        return (
          <div className="text-center">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onBlur={handleBlur}
              className="w-16 rounded border text-center"
            />
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <CellAction data={row.original} />
        </div>
      )
    }
  ];
};
