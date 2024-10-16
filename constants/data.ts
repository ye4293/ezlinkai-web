import { NavItem } from '@/types';

export type User = {
  id: number;
  name: string;
  company: string;
  role: string;
  verified: boolean;
  status: string;
};
export const users: User[] = [
  {
    id: 1,
    name: 'Candice Schiner',
    company: 'Dell',
    role: 'Frontend Developer',
    verified: false,
    status: 'Active'
  },
  {
    id: 2,
    name: 'John Doe',
    company: 'TechCorp',
    role: 'Backend Developer',
    verified: true,
    status: 'Active'
  },
  {
    id: 3,
    name: 'Alice Johnson',
    company: 'WebTech',
    role: 'UI Designer',
    verified: true,
    status: 'Active'
  },
  {
    id: 4,
    name: 'David Smith',
    company: 'Innovate Inc.',
    role: 'Fullstack Developer',
    verified: false,
    status: 'Inactive'
  },
  {
    id: 5,
    name: 'Emma Wilson',
    company: 'TechGuru',
    role: 'Product Manager',
    verified: true,
    status: 'Active'
  },
  {
    id: 6,
    name: 'James Brown',
    company: 'CodeGenius',
    role: 'QA Engineer',
    verified: false,
    status: 'Active'
  },
  {
    id: 7,
    name: 'Laura White',
    company: 'SoftWorks',
    role: 'UX Designer',
    verified: true,
    status: 'Active'
  },
  {
    id: 8,
    name: 'Michael Lee',
    company: 'DevCraft',
    role: 'DevOps Engineer',
    verified: false,
    status: 'Active'
  },
  {
    id: 9,
    name: 'Olivia Green',
    company: 'WebSolutions',
    role: 'Frontend Developer',
    verified: true,
    status: 'Active'
  },
  {
    id: 10,
    name: 'Robert Taylor',
    company: 'DataTech',
    role: 'Data Analyst',
    verified: false,
    status: 'Active'
  }
];

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string; // Consider using a proper date type if possible
  street: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  longitude?: number; // Optional field
  latitude?: number; // Optional field
  job: string;
  profile_picture?: string | null; // Profile picture can be a string (URL) or null (if no picture)
};

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'dashboard',
    label: 'Dashboard'
  },
  {
    title: 'Channel',
    href: '/dashboard/employee',
    icon: 'channel',
    label: 'employee'
  },
  {
    title: 'User',
    href: '/dashboard/employee',
    icon: 'user',
    label: 'employee'
  },
  {
    title: 'Billing',
    href: '/dashboard/product',
    icon: 'billing',
    label: 'product'
  },
  {
    title: 'Keys',
    href: '/dashboard/product',
    icon: 'key',
    label: 'product'
  },
  {
    title: 'Usage',
    href: '/dashboard/product',
    icon: 'usage',
    label: 'product'
  },
  {
    title: 'Midjourney',
    href: '/dashboard/product',
    icon: 'images',
    label: 'product'
  },
  {
    title: 'Videos',
    href: '/dashboard/product',
    icon: 'video',
    label: 'product'
  },
  // {
  //   title: 'Logs',
  //   icon: 'user',
  //   label: 'account',
  //   children: [
  //     {
  //       title: 'Midjourney',
  //       href: '/dashboard/profile',
  //       icon: 'userPen',
  //       label: 'profile'
  //     },
  //     {
  //       title: 'Video',
  //       href: '/',
  //       icon: 'login',
  //       label: 'login'
  //     }
  //   ]
  // },
  {
    title: 'Setting',
    href: '/dashboard/kanban',
    icon: 'kanban',
    label: 'kanban'
  },
  {
    title: 'Kanban',
    href: '/dashboard/kanban',
    icon: 'kanban',
    label: 'kanban'
  }
];
