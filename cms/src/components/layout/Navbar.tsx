'use client';

import { LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                BANDITE CMS
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-900">
              <User size={18} />
              <span>{user?.name || 'User'}</span>
              {user?.role && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-900 rounded-full">
                  {user.role}
                </span>
              )}
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
