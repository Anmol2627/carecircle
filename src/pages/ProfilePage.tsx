import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Settings, 
  ChevronRight, 
  Shield, 
  Bell, 
  Moon, 
  Lock,
  HelpCircle,
  LogOut,
  Trophy,
  Star,
  Zap,
  Target
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { BadgeCard } from '@/components/BadgeCard';
import { LeaderboardCard } from '@/components/LeaderboardCard';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/BottomNav';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/Animations';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'badges' | 'leaderboard' | 'settings'>('badges');
  const { user, signOut, loading } = useAuth();
  const { profile, unlockedBadges, lockedBadges, getNextLevelPoints, getProgressToNextLevel } = useGamification();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load leaderboard
  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, points, level')
        .order('points', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        const ranked = data.map((p, index) => ({
          rank: index + 1,
          user: {
            id: p.user_id,
            name: p.full_name || 'User',
            avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'User')}&background=6366f1&color=fff`,
            level: p.level || 1,
            xp: p.points || 0,
          },
          points: p.points || 0,
        }));

        setLeaderboard(ranked);

        // Find user's rank
        if (user) {
          const userIndex = ranked.findIndex(r => r.user.id === user.id);
          setUserRank(userIndex >= 0 ? userIndex + 1 : null);
        }
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  const xpForNextLevel = getNextLevelPoints();
  const xpProgress = getProgressToNextLevel();
  const currentXP = profile?.points || 0;
  const currentLevel = profile?.level || 1;

  const settingsItems = [
    { icon: Bell, label: 'Notifications', description: 'Manage alert preferences' },
    { icon: Shield, label: 'Privacy & Safety', description: 'Location and data settings' },
    { icon: Lock, label: 'Security', description: 'Password and 2FA' },
    { icon: Moon, label: 'Appearance', description: 'Theme and display' },
    { icon: HelpCircle, label: 'Help & Support', description: 'FAQs and contact' },
  ];

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background pb-24">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent pb-20 pt-8">
        <div className="container px-4">
          <FadeIn className="flex justify-end mb-4">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </FadeIn>
          
          <FadeIn delay={0.1} className="flex flex-col items-center">
            <div className="relative">
              <Avatar
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || user?.email || 'User')}&background=6366f1&color=fff`}
                alt={profile.full_name || user?.email || 'User'}
                size="xl"
                hasBorder
                borderColor="primary"
              />
              <motion.div
                className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                Lv. {currentLevel}
              </motion.div>
            </div>
            
            <h1 className="font-bold text-2xl mt-4">{profile.full_name || user?.email?.split('@')[0] || 'User'}</h1>
            <p className="text-muted-foreground">Campus Guardian</p>
            
            {/* XP Progress */}
            <div className="w-full max-w-xs mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Level {currentLevel}</span>
                <span className="font-medium">{currentXP} / {xpForNextLevel} XP</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-6">
              <div className="text-center">
                <motion.p 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {unlockedBadges.length}
                </motion.p>
                <p className="text-sm text-muted-foreground">Badges</p>
              </div>
              <div className="text-center">
                <motion.p 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {currentXP}
                </motion.p>
                <p className="text-sm text-muted-foreground">Points</p>
              </div>
              <div className="text-center">
                <motion.p 
                  className="text-2xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {userRank ? `#${userRank}` : '—'}
                </motion.p>
                <p className="text-sm text-muted-foreground">Rank</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-background border-b border-border -mt-12">
        <div className="container px-4">
          <div className="flex gap-1 py-2">
            {[
              { id: 'badges', icon: Trophy, label: 'Badges' },
              { id: 'leaderboard', icon: Star, label: 'Leaderboard' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container px-4 py-6">
        {activeTab === 'badges' && (
          <div className="space-y-8">
            {/* Unlocked Badges */}
            <section>
              <FadeIn>
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  Earned Badges ({unlockedBadges.length})
                </h2>
              </FadeIn>
              <StaggerContainer className="grid grid-cols-3 gap-4" staggerDelay={0.05}>
                {unlockedBadges.length > 0 ? (
                  unlockedBadges.map(badge => (
                    <StaggerItem key={badge.id}>
                      <BadgeCard 
                        badge={{
                          id: badge.id,
                          name: badge.name,
                          icon: badge.icon,
                          description: badge.description || '',
                          isUnlocked: true,
                          tier: badge.tier
                        }} 
                        size="md" 
                        showDetails 
                      />
                    </StaggerItem>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground col-span-3 text-center py-8">
                    No badges earned yet. Complete actions to earn badges!
                  </p>
                )}
              </StaggerContainer>
            </section>

            {/* Locked Badges */}
            <section>
              <FadeIn delay={0.2}>
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  Locked ({lockedBadges.length})
                </h2>
              </FadeIn>
              <StaggerContainer className="grid grid-cols-3 gap-4" staggerDelay={0.05}>
                {lockedBadges.map(badge => (
                  <StaggerItem key={badge.id}>
                    <BadgeCard 
                      badge={{
                        id: badge.id,
                        name: badge.name,
                        icon: badge.icon,
                        description: badge.description || '',
                        isUnlocked: false,
                        tier: badge.tier
                      }} 
                      size="md" 
                      showDetails 
                    />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </section>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <FadeIn>
                <div className="flex justify-center items-end gap-4 py-6">
                  {/* 2nd Place */}
                  <motion.div 
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Avatar
                      src={leaderboard[1].user.avatar}
                      alt={leaderboard[1].user.name}
                      size="lg"
                      hasBorder
                      borderColor="primary"
                    />
                    <div className="bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900 px-3 py-1 rounded-full text-sm font-bold mt-2">
                      #2
                    </div>
                    <p className="text-sm font-medium mt-1">{leaderboard[1].user.name.split(' ')[0]}</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[1].points} pts</p>
                  </motion.div>

                  {/* 1st Place */}
                  <motion.div 
                    className="flex flex-col items-center -mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="relative">
                      <Avatar
                        src={leaderboard[0].user.avatar}
                        alt={leaderboard[0].user.name}
                        size="xl"
                        hasBorder
                        borderColor="trust"
                      />
                      <motion.div
                        className="absolute -top-4 left-1/2 -translate-x-1/2"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-2xl">👑</span>
                      </motion.div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-bold mt-2 shadow-glow-gold">
                      #1
                    </div>
                    <p className="text-sm font-semibold mt-1">{leaderboard[0].user.name.split(' ')[0]}</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[0].points} pts</p>
                  </motion.div>

                  {/* 3rd Place */}
                  <motion.div 
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Avatar
                      src={leaderboard[2].user.avatar}
                      alt={leaderboard[2].user.name}
                      size="lg"
                      hasBorder
                      borderColor="primary"
                    />
                    <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white px-3 py-1 rounded-full text-sm font-bold mt-2">
                      #3
                    </div>
                    <p className="text-sm font-medium mt-1">{leaderboard[2].user.name.split(' ')[0]}</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[2].points} pts</p>
                  </motion.div>
                </div>
              </FadeIn>
            )}

            {/* Full Leaderboard */}
            <FadeIn delay={0.4}>
              {leaderboard.length > 0 ? (
                <LeaderboardCard 
                  entries={leaderboard.slice(3)} 
                  currentUserId={user?.id || ''}
                />
              ) : (
                <p className="text-center text-muted-foreground py-8">No leaderboard data yet</p>
              )}
            </FadeIn>
          </div>
        )}

        {activeTab === 'settings' && (
          <StaggerContainer className="space-y-2" staggerDelay={0.05}>
            {settingsItems.map((item, index) => (
              <StaggerItem key={item.label}>
                <motion.button
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all text-left"
                  whileHover={{ x: 4 }}
                  onClick={() => toast.success(`${item.label} settings opened`)}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </StaggerItem>
            ))}

            <StaggerItem>
              <motion.button
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emergency/10 border border-emergency/20 hover:bg-emergency/20 transition-all text-left mt-4"
                whileHover={{ x: 4 }}
                onClick={handleLogout}
              >
                <div className="w-10 h-10 rounded-xl bg-emergency/20 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-emergency" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-emergency">Log Out</p>
                  <p className="text-sm text-muted-foreground">Sign out of your account</p>
                </div>
              </motion.button>
            </StaggerItem>
          </StaggerContainer>
        )}
      </main>

      <BottomNav />
    </PageTransition>
  );
};

export default ProfilePage;
