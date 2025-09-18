import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import apiClient from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  Star,
  Trophy,
  Target,
  Zap,
  Crown,
  Medal,
  Edit,
  Save,
  X,
  Eye,
  UserCheck,
  FileCheck,
  Users,
  Calendar,
  Activity
} from 'lucide-react';

// Define the User type to match backend
interface User {
  _id: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organization?: string;
  location?: string;
  role: 'citizen' | 'official' | 'admin';
}

// User statistics interface for citizens
interface UserStats {
  totalReports: number;
  verifiedReports: number;
  rejectedReports: number;
  unverifiedReports: number;
  emergencyReports: number;
  recentReports: number;
  hazardTypesBreakdown: {
    [key: string]: number;
  };
  severityBreakdown: {
    [key: string]: number;
  };
}

// Official statistics interface
interface OfficialStats {
  reportsReviewed: number;
  reportsVerified: number;
  reportsRejected: number;
  averageResponseTime: number; // in hours
  currentPendingReports: number;
  monthlyReviewCount: number;
  verificationAccuracy: number; // percentage
  specializations: string[];
  yearsOfExperience?: number;
}

// Gamification types (for citizens only)
interface UserLevel {
  level: number;
  title: string;
  icon: any;
  color: string;
  minReports: number;
  maxReports: number;
  description: string;
  perks: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
  requirement: number;
  category: 'reports' | 'quality' | 'consistency' | 'emergency';
}

// Validation schema for the form
const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  phone: z.string().optional(),
  organization: z.string().optional(),
  location: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Gamification logic (for citizens only)
const getUserLevel = (verifiedReports: number): UserLevel => {
  const levels: UserLevel[] = [
    {
      level: 1,
      title: "Observer",
      icon: User,
      color: "text-gray-500",
      minReports: 0,
      maxReports: 4,
      description: "New to hazard reporting",
      perks: ["Basic reporting access"]
    },
    {
      level: 2,
      title: "Reporter",
      icon: AlertTriangle,
      color: "text-blue-500",
      minReports: 5,
      maxReports: 14,
      description: "Building reporting skills",
      perks: ["Priority support", "Basic analytics"]
    },
    {
      level: 3,
      title: "Vigilant",
      icon: CheckCircle,
      color: "text-green-500",
      minReports: 15,
      maxReports: 29,
      description: "Consistent quality reporter",
      perks: ["Advanced features", "Report templates", "Community recognition"]
    },
    {
      level: 4,
      title: "Guardian",
      icon: Shield,
      color: "text-purple-500",
      minReports: 30,
      maxReports: 49,
      description: "Trusted community protector",
      perks: ["Mentorship opportunities", "Beta features", "Expert badge"]
    },
    {
      level: 5,
      title: "Sentinel",
      icon: Crown,
      color: "text-yellow-500",
      minReports: 50,
      maxReports: 99,
      description: "Elite hazard sentinel",
      perks: ["Leadership panel", "Feature requests", "VIP support"]
    },
    {
      level: 6,
      title: "Champion",
      icon: Trophy,
      color: "text-orange-500",
      minReports: 100,
      maxReports: Infinity,
      description: "Legendary protector",
      perks: ["Hall of fame", "Platform influence", "Special recognition"]
    }
  ];

  return levels.find(level => 
    verifiedReports >= level.minReports && verifiedReports <= level.maxReports
  ) || levels[0];
};

const getNextLevel = (currentLevel: UserLevel): UserLevel | null => {
  const levels = [
    { level: 1, title: "Observer", icon: User, color: "text-gray-500", minReports: 0, maxReports: 4, description: "New to hazard reporting", perks: ["Basic reporting access"] },
    { level: 2, title: "Reporter", icon: AlertTriangle, color: "text-blue-500", minReports: 5, maxReports: 14, description: "Building reporting skills", perks: ["Priority support", "Basic analytics"] },
    { level: 3, title: "Vigilant", icon: CheckCircle, color: "text-green-500", minReports: 15, maxReports: 29, description: "Consistent quality reporter", perks: ["Advanced features", "Report templates", "Community recognition"] },
    { level: 4, title: "Guardian", icon: Shield, color: "text-purple-500", minReports: 30, maxReports: 49, description: "Trusted community protector", perks: ["Mentorship opportunities", "Beta features", "Expert badge"] },
    { level: 5, title: "Sentinel", icon: Crown, color: "text-yellow-500", minReports: 50, maxReports: 99, description: "Elite hazard sentinel", perks: ["Leadership panel", "Feature requests", "VIP support"] },
    { level: 6, title: "Champion", icon: Trophy, color: "text-orange-500", minReports: 100, maxReports: Infinity, description: "Legendary protector", perks: ["Hall of fame", "Platform influence", "Special recognition"] }
  ];
  
  const nextLevelIndex = levels.findIndex(level => level.level === currentLevel.level + 1);
  return nextLevelIndex !== -1 ? levels[nextLevelIndex] : null;
};

const getAchievements = (stats: UserStats): Achievement[] => {
  const achievements: Achievement[] = [
    {
      id: 'first_report',
      title: 'First Step',
      description: 'Submit your first verified report',
      icon: Target,
      color: 'text-blue-500',
      isUnlocked: stats.verifiedReports >= 1,
      requirement: 1,
      category: 'reports'
    },
    {
      id: 'five_verified',
      title: 'Getting Started',
      description: 'Get 5 reports verified',
      icon: Star,
      color: 'text-green-500',
      isUnlocked: stats.verifiedReports >= 5,
      requirement: 5,
      category: 'reports'
    },
    {
      id: 'ten_verified',
      title: 'Committed Reporter',
      description: 'Get 10 reports verified',
      icon: Award,
      color: 'text-purple-500',
      isUnlocked: stats.verifiedReports >= 10,
      requirement: 10,
      category: 'reports'
    },
    {
      id: 'twenty_five_verified',
      title: 'Community Guardian',
      description: 'Get 25 reports verified',
      icon: Shield,
      color: 'text-indigo-500',
      isUnlocked: stats.verifiedReports >= 25,
      requirement: 25,
      category: 'reports'
    },
    {
      id: 'fifty_verified',
      title: 'Elite Sentinel',
      description: 'Get 50 reports verified',
      icon: Crown,
      color: 'text-yellow-500',
      isUnlocked: stats.verifiedReports >= 50,
      requirement: 50,
      category: 'reports'
    },
    {
      id: 'hundred_verified',
      title: 'Legend',
      description: 'Get 100 reports verified',
      icon: Trophy,
      color: 'text-orange-500',
      isUnlocked: stats.verifiedReports >= 100,
      requirement: 100,
      category: 'reports'
    },
    {
      id: 'quality_reporter',
      title: 'Quality Over Quantity',
      description: 'Maintain 90%+ verification rate with 10+ reports',
      icon: CheckCircle,
      color: 'text-emerald-500',
      isUnlocked: stats.totalReports >= 10 && (stats.verifiedReports / stats.totalReports) >= 0.9,
      requirement: 90,
      category: 'quality'
    },
    {
      id: 'emergency_responder',
      title: 'Emergency Responder',
      description: 'Report 5 emergency situations',
      icon: Zap,
      color: 'text-red-500',
      isUnlocked: stats.emergencyReports >= 5,
      requirement: 5,
      category: 'emergency'
    },
    {
      id: 'consistent_reporter',
      title: 'Consistent Contributor',
      description: 'Submit reports regularly over multiple months',
      icon: Medal,
      color: 'text-cyan-500',
      isUnlocked: stats.recentReports >= 5 && stats.totalReports >= 20,
      requirement: 20,
      category: 'consistency'
    }
  ];

  return achievements;
};

// API function to fetch user data
const fetchCurrentUser = async (getToken: () => Promise<string | null>): Promise<User> => {
  const token = await getToken();
  if (!token) throw new Error("Authentication token not found.");
  const response = await apiClient.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.user;
};

// API function to fetch user statistics (for citizens)
const fetchUserStats = async (getToken: () => Promise<string | null>): Promise<UserStats> => {
  const token = await getToken();
  if (!token) throw new Error("Authentication token not found.");
  const response = await apiClient.get('/auth/me/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.stats;
};

// API function to fetch official statistics
const fetchOfficialStats = async (getToken: () => Promise<string | null>): Promise<OfficialStats> => {
  const token = await getToken();
  if (!token) throw new Error("Authentication token not found.");
  const response = await apiClient.get('/auth/me/official-stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.stats;
};

// API function to update user data
const updateCurrentUser = async ({ data, getToken }: { data: ProfileFormValues, getToken: () => Promise<string | null> }): Promise<User> => {
    const token = await getToken();
    if (!token) throw new Error("Authentication token not found.");
    const response = await apiClient.put('/me', data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.user;
};

const ProfilePage = () => {
    const { getToken } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditMode, setIsEditMode] = useState(false);

    // Query to fetch user data
    const { data: user, isLoading: userLoading, isError: userError } = useQuery<User>({
        queryKey: ['me'],
        queryFn: () => fetchCurrentUser(getToken),
    });

    // Query to fetch user statistics (for citizens only)
    const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
        queryKey: ['userStats'],
        queryFn: () => fetchUserStats(getToken),
        enabled: !!user && user.role === 'citizen',
    });

    // Query to fetch official statistics (for officials and admins)
    const { data: officialStats, isLoading: officialStatsLoading } = useQuery<OfficialStats>({
        queryKey: ['officialStats'],
        queryFn: () => fetchOfficialStats(getToken),
        enabled: !!user && (user.role === 'official' || user.role === 'admin'),
    });

    // Form setup with react-hook-form
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        values: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            phone: user?.phone || '',
            organization: user?.organization || '',
            location: user?.location || ''
        },
    });

    // Mutation for updating user data
    const mutation = useMutation({
        mutationFn: (data: ProfileFormValues) => updateCurrentUser({ data, getToken }),
        onSuccess: (updatedUser) => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            setIsEditMode(false);
            toast({
                title: "Success!",
                description: "Your profile has been updated successfully.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to update profile: ${error.message}`,
                variant: "destructive",
            });
        }
    });

    const onSubmit = (data: ProfileFormValues) => {
        mutation.mutate(data);
    };

    const handleCancelEdit = () => {
        form.reset();
        setIsEditMode(false);
    };

    if (userLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (userError) {
        return <div className="text-center text-red-500 mt-10">Failed to load user data.</div>;
    }

    const isOfficial = user && (user.role === 'official' || user.role === 'admin');
    const isCitizen = user && user.role === 'citizen';
    
    // Gamification features only for citizens
    const currentLevel = stats && isCitizen ? getUserLevel(stats.verifiedReports) : null;
    const nextLevel = currentLevel ? getNextLevel(currentLevel) : null;
    const achievements = stats && isCitizen ? getAchievements(stats) : [];
    const unlockedAchievements = achievements.filter(a => a.isUnlocked);
    const recentAchievements = achievements.filter(a => a.isUnlocked).slice(-3);

    // Calculate progress to next level (only for citizens)
    const progressToNext = nextLevel && stats && isCitizen
        ? ((stats.verifiedReports || 0) - currentLevel!.minReports) / (nextLevel.minReports - currentLevel!.minReports) * 100
        : 100;

    return (
        <div className="container mx-auto py-10 space-y-8">
            {/* Profile Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{user?.firstName} {user?.lastName}</h1>
                        <p className="text-muted-foreground flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span>{user?.email}</span>
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                            {isOfficial && (
                                <Badge variant="secondary">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                </Badge>
                            )}
                            {/* Level Badge - Only for citizens */}
                            {isCitizen && currentLevel && (
                                <Badge className={`${currentLevel.color} bg-opacity-10 border-current`}>
                                    <currentLevel.icon className="w-3 h-3 mr-1" />
                                    Level {currentLevel.level} - {currentLevel.title}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gamification Section - Only for Citizens */}
            {isCitizen && currentLevel && (
                <div className="space-y-6">
                    {/* Current Status and Next Goal */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Level Progress Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <currentLevel.icon className={`w-5 h-5 ${currentLevel.color}`} />
                                    <span>Current Level</span>
                                </CardTitle>
                                <CardDescription>{currentLevel.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <div className={`text-4xl font-bold ${currentLevel.color}`}>
                                        {currentLevel.level}
                                    </div>
                                    <div className="text-lg font-semibold">{currentLevel.title}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {stats?.verifiedReports || 0} verified reports
                                    </div>
                                </div>

                                {nextLevel && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Progress to {nextLevel.title}</span>
                                            <span>{nextLevel.minReports - (stats?.verifiedReports || 0)} more reports</span>
                                        </div>
                                        <Progress value={Math.min(progressToNext, 100)} className="h-2" />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Current Level Perks:</h4>
                                    <div className="space-y-1">
                                        {currentLevel.perks.map((perk, index) => (
                                            <div key={index} className="flex items-center space-x-2 text-sm">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                                <span>{perk}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Achievements Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    <span>Recent Achievements</span>
                                </CardTitle>
                                <CardDescription>
                                    {unlockedAchievements.length} of {achievements.length} unlocked
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {recentAchievements.length > 0 ? (
                                    recentAchievements.map((achievement) => (
                                        <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                                            <achievement.icon className={`w-6 h-6 ${achievement.color}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium">{achievement.title}</div>
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {achievement.description}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                New!
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Start reporting to unlock achievements!</p>
                                    </div>
                                )}
                                
                                {achievements.length > 3 && (
                                    <Button variant="outline" size="sm" className="w-full">
                                        View All Achievements ({unlockedAchievements.length}/{achievements.length})
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Statistics Cards - Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Statistics Card - Different for Citizens vs Officials */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                {isCitizen ? (
                                    <>
                                        <TrendingUp className="w-5 h-5" />
                                        <span>Report Statistics</span>
                                    </>
                                ) : (
                                    <>
                                        <Activity className="w-5 h-5" />
                                        <span>Review Statistics</span>
                                    </>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(statsLoading || officialStatsLoading) ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : isCitizen && stats ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-primary/5 rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                                {stats.totalReports || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Reports</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {stats.verifiedReports || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Verified</div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                                            <div className="text-2xl font-bold text-amber-600">
                                                {stats.unverifiedReports || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Pending</div>
                                        </div>
                                        <div className="text-center p-4 bg-red-50 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">
                                                {stats.emergencyReports || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Emergency</div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Recent (30 days)</span>
                                            <span className="font-medium">{stats.recentReports || 0}</span>
                                        </div>
                                    </div>

                                    {stats.totalReports > 0 && (
                                        <div className="pt-2 border-t">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-muted-foreground">Verification Rate</span>
                                                <span className="font-medium">
                                                    {Math.round((stats.verifiedReports / stats.totalReports) * 100)}%
                                                </span>
                                            </div>
                                            <Progress 
                                                value={(stats.verifiedReports / stats.totalReports) * 100} 
                                                className="h-2"
                                            />
                                        </div>
                                    )}
                                </>
                            ) : isOfficial && officialStats ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {officialStats.reportsReviewed || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Reviewed</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {officialStats.reportsVerified || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Verified</div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-red-50 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">
                                                {officialStats.reportsRejected || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Rejected</div>
                                        </div>
                                        <div className="text-center p-4 bg-amber-50 rounded-lg">
                                            <div className="text-2xl font-bold text-amber-600">
                                                {officialStats.currentPendingReports || 0}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Pending</div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Avg. Response Time</span>
                                            <span className="font-medium">{officialStats.averageResponseTime || 0}h</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Monthly Reviews</span>
                                            <span className="font-medium">{officialStats.monthlyReviewCount || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Accuracy Rate</span>
                                            <span className="font-medium">{officialStats.verificationAccuracy || 0}%</span>
                                        </div>
                                    </div>

                                    {officialStats.specializations && officialStats.specializations.length > 0 && (
                                        <div className="pt-2 border-t">
                                            <h4 className="text-sm font-medium mb-2">Specializations:</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {officialStats.specializations.map((spec, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {spec}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Hazard Types Breakdown - Only for Citizens */}
                    {isCitizen && stats && stats.totalReports > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span>Hazard Types</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(stats.hazardTypesBreakdown).map(([type, count]) => (
                                        <div key={type} className="flex items-center justify-between">
                                            <span className="capitalize text-sm">{type}</span>
                                            <Badge variant="outline">{count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Professional Info Card - Only for Officials */}
                    {isOfficial && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <UserCheck className="w-5 h-5" />
                                    <span>Professional Info</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Role</span>
                                    <Badge variant="secondary">
                                        <Shield className="w-3 h-3 mr-1" />
                                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                    </Badge>
                                </div>
                                {user?.organization && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Organization</span>
                                        <span className="text-sm font-medium">{user.organization}</span>
                                    </div>
                                )}
                                {officialStats?.yearsOfExperience && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Experience</span>
                                        <span className="text-sm font-medium">{officialStats.yearsOfExperience} years</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge className="bg-green-100 text-green-700">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Active
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Profile Form - Right Column */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>
                                    {isEditMode ? "Edit your personal details below." : "View your personal details."}
                                </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                {!isEditMode ? (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setIsEditMode(true)}
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                ) : (
                                    <div className="flex space-x-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleCancelEdit}
                                            disabled={mutation.isPending}
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isEditMode ? (
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="firstName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>First Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="John" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="lastName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Last Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Doe" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center space-x-2">
                                                        <Phone className="w-4 h-4" />
                                                        <span>Phone Number</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+91 12345 67890" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="organization"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center space-x-2">
                                                        <Building className="w-4 h-4" />
                                                        <span>Organization</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ministry of Earth Sciences" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="location"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center space-x-2">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>Location</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="New Delhi, India" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Separator />

                                        <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
                                            {mutation.isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-muted-foreground">First Name</label>
                                            <div className="p-3 bg-muted/50 rounded-md">
                                                {user?.firstName || 'Not provided'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                                            <div className="p-3 bg-muted/50 rounded-md">
                                                {user?.lastName || 'Not provided'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                            <Mail className="w-4 h-4" />
                                            <span>Email</span>
                                        </label>
                                        <div className="p-3 bg-muted/50 rounded-md">
                                            {user?.email}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            <span>Phone Number</span>
                                        </label>
                                        <div className="p-3 bg-muted/50 rounded-md">
                                            {user?.phone || 'Not provided'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                            <Building className="w-4 h-4" />
                                            <span>Organization</span>
                                        </label>
                                        <div className="p-3 bg-muted/50 rounded-md">
                                            {user?.organization || 'Not provided'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                                            <MapPin className="w-4 h-4" />
                                            <span>Location</span>
                                        </label>
                                        <div className="p-3 bg-muted/50 rounded-md">
                                            {user?.location || 'Not provided'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;