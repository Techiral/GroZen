
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePlan } from '@/contexts/plan-context';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy, ArrowLeft, Users, UserCircle } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/wellness';
import { CURRENT_CHALLENGE } from '@/config/challenge';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const router = useRouter();
  const { currentUser, isLoadingAuth, fetchLeaderboardData } = usePlan();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  useEffect(() => {
    if (!isLoadingAuth && !currentUser) {
      router.replace('/login');
    } else if (currentUser) {
      const loadLeaderboard = async () => {
        setIsLoadingLeaderboard(true);
        const fetchedLeaderboard = await fetchLeaderboardData();
        // Assign ranks
        const rankedLeaderboard = fetchedLeaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1,
        }));
        setLeaderboard(rankedLeaderboard);
        setIsLoadingLeaderboard(false);
      };
      loadLeaderboard();
    }
  }, [currentUser, isLoadingAuth, router, fetchLeaderboardData]);

  if (isLoadingAuth || (!currentUser && !isLoadingAuth)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Logo size="text-2xl sm:text-3xl" />
        <Loader2 className="mt-4 h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-3 sm:p-4 md:p-6">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
            <Logo size="text-xl sm:text-2xl" />
            <span className="text-sm sm:text-md font-semibold text-primary">Challenge Leaderboard</span>
        </div>
        <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')} 
            className="neumorphic-button text-2xs sm:text-xs px-2.5 py-1 sm:px-3 sm:py-1.5 mt-2 sm:mt-0"
            aria-label="Back to Dashboard"
        >
            <ArrowLeft className="mr-1 h-3 w-3 sm:h-3.5 sm:w-3.5" /> Back to Dashboard
        </Button>
      </header>

      <Card className="neumorphic">
        <CardHeader className="px-3 py-2.5 sm:px-4 sm:py-3">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-md">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-accent" /> {CURRENT_CHALLENGE.title} - Top Participants
          </CardTitle>
          <CardDescription className="text-2xs sm:text-xs text-muted-foreground">
            See who's leading the charge in the current wellness challenge!
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pt-0 pb-3 sm:px-4 sm:pb-4">
          {isLoadingLeaderboard ? (
            <div className="flex justify-center items-center py-8 sm:py-10">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
              <p className="ml-2 text-xs sm:text-sm text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 sm:py-10">
                <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-xs sm:text-sm">No participants yet, or no one has logged progress for this challenge.</p>
                <p className="text-muted-foreground text-2xs sm:text-xs mt-1">Be the first to join and log your progress from the dashboard!</p>
            </div>
          ) : (
            <div className="overflow-x-auto neumorphic-inset-sm rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-2xs sm:text-xs w-[50px] text-center">Rank</TableHead>
                    <TableHead className="text-2xs sm:text-xs">Participant</TableHead>
                    <TableHead className="text-right text-2xs sm:text-xs">Days Logged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, index) => (
                    <TableRow key={entry.id} className={cn(currentUser?.uid === entry.id && "bg-primary/10")}>
                      <TableCell className="font-medium text-2xs sm:text-xs text-center">{entry.rank}</TableCell>
                      <TableCell className="text-2xs sm:text-xs truncate max-w-[150px] sm:max-w-xs md:max-w-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {entry.avatarUrl ? (
                            <Image 
                              src={entry.avatarUrl} 
                              alt={entry.displayName || 'User avatar'} 
                              width={24} 
                              height={24} 
                              className="rounded-full neumorphic-sm object-cover h-5 w-5 sm:h-6 sm:w-6"
                              data-ai-hint="user avatar"
                            />
                          ) : (
                            <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                          )}
                          <span className="truncate">{entry.displayName || 'GroZen User'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-2xs sm:text-xs font-semibold">{entry.daysCompleted}</TableCell>
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
