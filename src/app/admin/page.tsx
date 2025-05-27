
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        router.replace('/login'); // Or to a generic unauthorized page
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

  if (isLoadingAuth || (!currentUser && !isLoadingAuth) || (!isAdminUser && currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-3xl sm:text-4xl" />
        <Loader2 className="mt-4 h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-5 sm:mb-6">
        <div className="flex items-center gap-2">
            <Logo size="text-2xl sm:text-3xl md:text-4xl" />
            <span className="text-md sm:text-lg font-semibold text-primary">Admin Panel</span>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')} 
                className="neumorphic-button text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
            >
                Back to Dashboard
            </Button>
            <Button variant="outline" onClick={logoutUser} className="neumorphic-button text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
                <LogOut className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Logout
            </Button>
        </div>
      </header>

      <Card className="neumorphic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-accent" /> User Management
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            List of all registered users. Click &apos;View Details&apos; to see their data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">User ID (UID)</TableHead>
                    <TableHead className="text-xs sm:text-sm">Email</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[200px] md:max-w-xs">{user.id}</TableCell>
                      <TableCell className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">{user.email}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/user/${user.id}`)}
                          className="neumorphic-button text-2xs sm:text-xs px-2 py-1"
                          title="View User Details"
                        >
                          <Eye className="mr-1 h-3 w-3" /> View Details
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
