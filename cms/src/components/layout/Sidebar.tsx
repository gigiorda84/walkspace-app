'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Ticket, BarChart3, Upload, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Tours', href: '/tours', icon: Map },
  { name: 'Media Library', href: '/media', icon: Upload },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  // { name: 'Vouchers', href: '/vouchers', icon: Ticket },  // Hidden for now
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 h-16">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors border-b-2',
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-900 hover:text-indigo-600 hover:border-gray-300'
                )}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
