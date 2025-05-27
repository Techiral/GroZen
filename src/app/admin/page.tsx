
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, Eye, LogOut } from 'lucide-react';
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
        <Logo size="text-2xl sm:text-3xl" />
        <Loader2 className="mt-4 h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
            <Logo size="text-xl sm:text-2xl md:text-3xl" />
            <span className="text-sm sm:text-md md:text-lg font-semibold text-primary">Admin Panel</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-0">
            <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')} 
                className="neumorphic-button text-2xs sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5"
                aria-label="Back to Dashboard"
            >
                Back to Dashboard
            </Button>
            <Button variant="outline" onClick={logoutUser} className="neumorphic-button text-2xs sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5" aria-label="Logout from admin panel">
                <LogOut className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Logout
            </Button>
        </div>
      </header>

      <Card className="neumorphic">
        <CardHeader className="px-3 py-2.5 sm:px-4 sm:py-3">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-md md:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" /> User Management
          </CardTitle>
          <CardDescription className="text-2xs sm:text-xs">
            List of all registered users. Click &apos;View Details&apos; to see their data.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pt-0 pb-3 sm:px-4 sm:pb-4">
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-8 sm:py-10">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
              <p className="ml-2 text-xs sm:text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 sm:py-10 text-xs sm:text-sm">No users found.</p>
          ) : (
            <div className="overflow-x-auto neumorphic-inset-sm rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-2xs sm:text-xs">User ID (UID)</TableHead>
                    <TableHead className="text-2xs sm:text-xs">Email</TableHead>
                    <TableHead className="text-right text-2xs sm:text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-2xs sm:text-xs truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[150px] md:max-w-xs">{user.id}</TableCell>
                      <TableCell className="text-2xs sm:text-xs truncate max-w-[100px] xs:max-w-[150px] sm:max-w-xs">{user.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/user/${user.id}`)}
                          className="neumorphic-button text-3xs px-1.5 py-0.5 sm:text-2xs sm:px-2 sm:py-1"
                          aria-label={`View details for user ${user.email || user.id}`}
                        >
                          <Eye className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> View
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
