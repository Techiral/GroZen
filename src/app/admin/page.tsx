
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, Eye, LogOut, UserCircle } from 'lucide-react';
import type { UserListItem } from '@/types/wellness';

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, isAdminUser, isLoadingAuth, fetchAllUsers, logoutUser } = usePlan();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (!isLoadingAuth) {
      if (!currentUser || !isAdminUser) {
        router.replace('/login'); 
      } else {
        const loadUsers = async () => {
          setIsLoadingUsers(true);
          const fetchedUsers = await fetchAllUsers();
          setUsers(fetchedUsers);
          setIsLoadingUsers(false);
        };
        loadUsers();
      }
    }
  }, [currentUser, isAdminUser, isLoadingAuth, router, fetchAllUsers]);

  if (isLoadingAuth || (!currentUser && !isLoadingAuth) || (currentUser && !isAdminUser && !isLoadingAuth) ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-xl sm:text-2xl" />
        <Loader2 className="mt-4 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4">
        <div className="flex items-center gap-1 sm:gap-1.5">
            <Logo size="text-lg sm:text-xl" />
            <span className="text-xs sm:text-sm font-semibold text-primary">Admin Panel</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-0">
            <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')} 
                className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8"
                aria-label="Back to Dashboard"
            >
                Dashboard
            </Button>
            <Button variant="outline" onClick={logoutUser} className="neumorphic-button text-3xs px-2 py-1 sm:text-2xs sm:px-2.5 sm:py-1.5 h-7 sm:h-8" aria-label="Logout from admin panel">
                <LogOut className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> Logout
            </Button>
        </div>
      </header>

      <Card className="neumorphic">
        <CardHeader className="px-3 py-2 sm:px-4 sm:py-2.5">
          <CardTitle className="flex items-center gap-1 sm:gap-1.5 text-sm sm:text-base">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> User Management
          </CardTitle>
          <CardDescription className="text-2xs sm:text-xs text-muted-foreground">
            List of all registered users. Click &apos;View&apos; to see their data.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pt-0 pb-2.5 sm:px-4 sm:pb-3">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-6 sm:py-8">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
              <p className="ml-2 text-xs sm:text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 sm:py-8 text-xs sm:text-sm">No users found.</p>
          ) : (
            <div className="overflow-x-auto neumorphic-inset-sm rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-2xs sm:text-xs py-2 px-2 sm:px-3 w-[40px] sm:w-[50px]">Avatar</TableHead>
                    <TableHead className="text-2xs sm:text-xs py-2 px-2 sm:px-3">Display Name</TableHead>
                    <TableHead className="text-2xs sm:text-xs py-2 px-2 sm:px-3">Email</TableHead>
                    <TableHead className="text-2xs sm:text-xs py-2 px-2 sm:px-3">UID</TableHead>
                    <TableHead className="text-right text-2xs sm:text-xs py-2 px-2 sm:px-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="py-1.5 px-2 sm:px-3">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.displayName || user.email || 'User Avatar'}
                            width={24}
                            height={24}
                            className="rounded-full object-cover h-6 w-6 neumorphic-sm"
                            data-ai-hint="user avatar"
                          />
                        ) : (
                          <UserCircle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-2xs sm:text-xs py-1.5 px-2 sm:px-3 truncate max-w-[100px] sm:max-w-[150px]">
                        {user.displayName || 'N/A'}
                      </TableCell>
                      <TableCell className="text-2xs sm:text-xs py-1.5 px-2 sm:px-3 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-xs">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-2xs sm:text-xs py-1.5 px-2 sm:px-3 truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[120px] md:max-w-xs">
                        {user.id}
                      </TableCell>
                      <TableCell className="text-right py-1.5 px-2 sm:px-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/user/${user.id}`)}
                          className="neumorphic-button text-3xs px-1.5 py-0.5 sm:text-2xs sm:px-2 sm:py-1 h-6 sm:h-7"
                          aria-label={`View details for user ${user.email || user.id}`}
                        >
                          <Eye className="mr-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
