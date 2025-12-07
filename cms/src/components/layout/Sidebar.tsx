'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, FileText, Ticket, BarChart3, Upload } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Tours', href: '/tours', icon: Map },
  { name: 'Media Library', href: '/media', icon: Upload },
  { name: 'Vouchers', href: '/vouchers', icon: Ticket },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <nav className="px-3 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
