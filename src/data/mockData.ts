// Mock data for SafeCircle app

export interface User {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  badges: Badge[];
  isVerified: boolean;
  phone: string;
  joinedDate: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface TrustedContact {
  id: string;
  user: User;
  relationship: string;
  addedAt: string;
  canTrackLocation: boolean;
  isEmergencyContact: boolean;
}

export interface Incident {
  id: string;
  type: 'sos' | 'silent' | 'check-in' | 'escort';
  status: 'active' | 'resolved' | 'cancelled';
  location: { lat: number; lng: number; address: string };
  timestamp: string;
  resolvedAt?: string;
  helpers: User[];
  victim: User;
  description?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'location' | 'image' | 'alert';
}

export interface MapMarker {
  id: string;
  type: 'emergency' | 'helper' | 'safe-zone' | 'alert' | 'user';
  position: { lat: number; lng: number };
  user?: User;
  title: string;
  description?: string;
  isActive: boolean;
}

// Avatar URLs using UI Faces
const avatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face',
];

export const mockBadges: Badge[] = [
  { id: '1', name: 'First Responder', icon: '🦸', description: 'Responded to your first emergency', isUnlocked: true, unlockedAt: '2024-01-15', tier: 'bronze' },
  { id: '2', name: 'Guardian Angel', icon: '👼', description: 'Helped 5 people in emergencies', isUnlocked: true, unlockedAt: '2024-02-20', tier: 'silver' },
  { id: '3', name: 'Campus Hero', icon: '🏆', description: 'Reached Level 10', isUnlocked: true, unlockedAt: '2024-03-10', tier: 'gold' },
  { id: '4', name: 'Night Owl', icon: '🦉', description: 'Responded to 3 nighttime emergencies', isUnlocked: false, tier: 'silver' },
  { id: '5', name: 'Shield Master', icon: '🛡️', description: 'Completed safety training', isUnlocked: true, unlockedAt: '2024-01-20', tier: 'bronze' },
  { id: '6', name: 'Trusted Friend', icon: '🤝', description: 'Added to 10 trusted circles', isUnlocked: false, tier: 'gold' },
  { id: '7', name: 'Safety Legend', icon: '⭐', description: 'Reached Level 25', isUnlocked: false, tier: 'platinum' },
  { id: '8', name: 'Quick Response', icon: '⚡', description: 'Responded in under 1 minute', isUnlocked: true, unlockedAt: '2024-02-05', tier: 'silver' },
];

export const currentUser: User = {
  id: 'current-user',
  name: 'Alex Johnson',
  avatar: avatars[0],
  level: 12,
  xp: 2450,
  badges: mockBadges.filter(b => b.isUnlocked),
  isVerified: true,
  phone: '+1 (555) 123-4567',
  joinedDate: '2024-01-01',
};

export const mockUsers: User[] = [
  { id: '1', name: 'Sarah Chen', avatar: avatars[1], level: 15, xp: 3200, badges: mockBadges.slice(0, 3), isVerified: true, phone: '+1 (555) 234-5678', joinedDate: '2023-09-15' },
  { id: '2', name: 'Mike Rodriguez', avatar: avatars[2], level: 8, xp: 1800, badges: mockBadges.slice(0, 2), isVerified: true, phone: '+1 (555) 345-6789', joinedDate: '2023-11-20' },
  { id: '3', name: 'Emily Park', avatar: avatars[3], level: 22, xp: 5600, badges: mockBadges.slice(0, 5), isVerified: true, phone: '+1 (555) 456-7890', joinedDate: '2023-06-10' },
  { id: '4', name: 'James Wilson', avatar: avatars[4], level: 18, xp: 4200, badges: mockBadges.slice(0, 4), isVerified: true, phone: '+1 (555) 567-8901', joinedDate: '2023-08-25' },
  { id: '5', name: 'Lisa Thompson', avatar: avatars[5], level: 25, xp: 7800, badges: mockBadges, isVerified: true, phone: '+1 (555) 678-9012', joinedDate: '2023-05-01' },
  { id: '6', name: 'David Kim', avatar: avatars[6], level: 11, xp: 2100, badges: mockBadges.slice(0, 2), isVerified: true, phone: '+1 (555) 789-0123', joinedDate: '2023-10-30' },
  { id: '7', name: 'Rachel Green', avatar: avatars[7], level: 19, xp: 4800, badges: mockBadges.slice(0, 4), isVerified: true, phone: '+1 (555) 890-1234', joinedDate: '2023-07-15' },
];

export const mockTrustedContacts: TrustedContact[] = [
  { id: '1', user: mockUsers[0], relationship: 'Best Friend', addedAt: '2024-01-10', canTrackLocation: true, isEmergencyContact: true },
  { id: '2', user: mockUsers[1], relationship: 'Roommate', addedAt: '2024-01-15', canTrackLocation: true, isEmergencyContact: true },
  { id: '3', user: mockUsers[2], relationship: 'Study Partner', addedAt: '2024-02-01', canTrackLocation: false, isEmergencyContact: false },
  { id: '4', user: mockUsers[3], relationship: 'Classmate', addedAt: '2024-02-20', canTrackLocation: true, isEmergencyContact: false },
];

// Campus location (mock: UCLA area)
const campusCenter = { lat: 34.0689, lng: -118.4452 };

export const mockIncidents: Incident[] = [
  {
    id: '1',
    type: 'sos',
    status: 'resolved',
    location: { lat: campusCenter.lat + 0.002, lng: campusCenter.lng - 0.001, address: 'Powell Library, UCLA' },
    timestamp: '2024-03-10T22:30:00Z',
    resolvedAt: '2024-03-10T22:45:00Z',
    helpers: [mockUsers[0], mockUsers[1]],
    victim: mockUsers[2],
    description: 'Felt unsafe walking alone at night',
  },
  {
    id: '2',
    type: 'silent',
    status: 'resolved',
    location: { lat: campusCenter.lat - 0.001, lng: campusCenter.lng + 0.002, address: 'Parking Structure 4' },
    timestamp: '2024-03-08T20:15:00Z',
    resolvedAt: '2024-03-08T20:35:00Z',
    helpers: [mockUsers[3]],
    victim: mockUsers[4],
    description: 'Suspicious person following',
  },
  {
    id: '3',
    type: 'escort',
    status: 'resolved',
    location: { lat: campusCenter.lat + 0.003, lng: campusCenter.lng + 0.001, address: 'Royce Hall' },
    timestamp: '2024-03-05T21:00:00Z',
    resolvedAt: '2024-03-05T21:20:00Z',
    helpers: [mockUsers[0]],
    victim: currentUser,
    description: 'Walk escort request',
  },
];

export const mockMapMarkers: MapMarker[] = [
  { id: '1', type: 'safe-zone', position: { lat: campusCenter.lat, lng: campusCenter.lng }, title: 'Campus Security Office', description: '24/7 security available', isActive: true },
  { id: '2', type: 'safe-zone', position: { lat: campusCenter.lat + 0.004, lng: campusCenter.lng - 0.002 }, title: 'Student Health Center', description: 'Emergency medical services', isActive: true },
  { id: '3', type: 'safe-zone', position: { lat: campusCenter.lat - 0.002, lng: campusCenter.lng + 0.003 }, title: 'Library Safe Point', description: 'Blue light emergency phone', isActive: true },
  { id: '4', type: 'helper', position: { lat: campusCenter.lat + 0.001, lng: campusCenter.lng - 0.001 }, user: mockUsers[0], title: 'Sarah Chen', description: 'Available to help', isActive: true },
  { id: '5', type: 'helper', position: { lat: campusCenter.lat - 0.001, lng: campusCenter.lng + 0.001 }, user: mockUsers[1], title: 'Mike Rodriguez', description: 'Available to help', isActive: true },
  { id: '6', type: 'user', position: { lat: campusCenter.lat, lng: campusCenter.lng - 0.0005 }, user: currentUser, title: 'You', description: 'Your location', isActive: true },
];

export const mockChatMessages: ChatMessage[] = [
  { id: '1', senderId: mockUsers[0].id, content: 'Hey! I saw you activated the check-in timer. Everything okay?', timestamp: '2024-03-12T14:30:00Z', isRead: true, type: 'text' },
  { id: '2', senderId: 'current-user', content: 'Yes! Just walking back from the library. Thanks for checking in! 💚', timestamp: '2024-03-12T14:31:00Z', isRead: true, type: 'text' },
  { id: '3', senderId: mockUsers[0].id, content: 'No problem! Let me know if you need a walking buddy.', timestamp: '2024-03-12T14:32:00Z', isRead: true, type: 'text' },
  { id: '4', senderId: 'current-user', content: 'Will do! Almost at the dorm now.', timestamp: '2024-03-12T14:35:00Z', isRead: true, type: 'text' },
  { id: '5', senderId: mockUsers[0].id, content: 'Great! Stay safe! 🛡️', timestamp: '2024-03-12T14:36:00Z', isRead: false, type: 'text' },
];

export const leaderboardData = [
  { rank: 1, user: mockUsers[4], points: 7800, change: 0 },
  { rank: 2, user: mockUsers[2], points: 5600, change: 1 },
  { rank: 3, user: mockUsers[6], points: 4800, change: -1 },
  { rank: 4, user: mockUsers[3], points: 4200, change: 2 },
  { rank: 5, user: mockUsers[0], points: 3200, change: 0 },
  { rank: 6, user: currentUser, points: 2450, change: 3 },
  { rank: 7, user: mockUsers[5], points: 2100, change: -2 },
  { rank: 8, user: mockUsers[1], points: 1800, change: -1 },
];

export const safetyStats = {
  totalHelped: 156,
  avgResponseTime: '2.3 min',
  activeHelpers: 24,
  safeZones: 12,
  incidentsToday: 3,
  incidentsResolved: 3,
};
