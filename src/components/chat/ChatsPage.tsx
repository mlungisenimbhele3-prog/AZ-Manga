import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  ShieldCheck,
  User,
  Sparkles,
  Phone,
  Video,
  MoreVertical,
  UserPlus,
  Users,
  Plus,
  Heart,
  Smile,
  Mic,
  Play,
  Pause,
  Image as ImageIcon,
  CheckCircle2,
  Check,
  Flame,
  Star,
  Award,
  Zap,
  Radio,
  X,
  Compass,
} from 'lucide-react';
import {
  getCurrentUserProfile,
  isUserFollowed,
  toggleFollowUser,
  UserProfile,
} from '../../services/userProfile';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  isVoice?: boolean;
  voiceDuration?: string;
  reactions?: Record<string, number>;
  userReaction?: string;
}

interface ChatContact {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatar: string;
  bio: string;
  unreadCount: number;
  lastMessage: string;
  online: boolean;
  isCreator?: boolean;
  followersCount: number;
  isGroup?: boolean;
  membersCount?: number;
}

interface ChatsPageProps {
  onOpenUserProfile?: () => void;
}

const INITIAL_CONTACTS: ChatContact[] = [
  {
    id: 'c-1',
    name: 'Mlungiseni Mbhele',
    handle: '@mlungiseni_mbhele',
    role: 'Executive Producer (AZ OVERVERSE)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Executive Producer of AZ OVERVERSE. Creator of The Lost Kingdom & champion of African Manga.',
    unreadCount: 1,
    lastMessage: 'Episode 2 ink and toning are finished! Releasing on Friday.',
    online: true,
    isCreator: true,
    followersCount: 24500,
  },
  {
    id: 'c-2',
    name: 'AZ Editorial & Publisher Support',
    handle: '@az_support',
    role: 'Official Platform Desk',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: '24/7 Creator royalties, Google Play Store billing & chapter submission assistance.',
    unreadCount: 0,
    lastMessage: 'Your creator account is connected for 70% direct royalty payouts.',
    online: true,
    isCreator: false,
    followersCount: 89000,
  },
  {
    id: 'c-3',
    name: 'Thabo Khumalo',
    handle: '@thabo_animex',
    role: 'Manga Artist (Durban)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Shonen action penciller. Working on Cape Town Shadow Warriors 🗡️',
    unreadCount: 0,
    lastMessage: 'Loved the plot twist in Chapter 1!',
    online: false,
    isCreator: true,
    followersCount: 12300,
  },
  {
    id: 'c-4',
    name: 'Ayanda Sithole',
    handle: '@ayanda_draws',
    role: 'Webtoon Colorist (Johannesburg)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Digital webtoon colorist and background artist. Fan of fantasy & folklore.',
    unreadCount: 0,
    lastMessage: 'The lighting in the ceremonial hall panel turned out amazing!',
    online: true,
    isCreator: true,
    followersCount: 18400,
  },
  {
    id: 'c-5',
    name: 'Kofi Mensah',
    handle: '@kofi_manga',
    role: 'Community Moderator',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Ghanaian manga collector & host of the weekly Manga of the Year live circle.',
    unreadCount: 0,
    lastMessage: 'Check out the discussion thread in the Shonen Circle!',
    online: false,
    isCreator: false,
    followersCount: 9200,
  },
];

const INITIAL_GROUPS: ChatContact[] = [
  {
    id: 'grp-1',
    name: 'AZ Oververse Creators Hub',
    handle: '#az_creators',
    role: 'Manga Guild',
    avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
    bio: 'Official African mangaka guild: storyboards, ink critiques, and Google Play earnings.',
    unreadCount: 3,
    lastMessage: 'Mlungiseni: Voting for Manga of the Year closes midnight Sunday!',
    online: true,
    isGroup: true,
    membersCount: 1420,
    followersCount: 4200,
  },
  {
    id: 'grp-2',
    name: 'Shonen Pulse Readers Circle',
    handle: '#shonen_pulse',
    role: 'Fan Community',
    avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
    bio: 'Daily theorycrafting, power scaling, and chapter reaction drops.',
    unreadCount: 0,
    lastMessage: 'Who else noticed the hidden symbol on the Rhino sceptre?',
    online: true,
    isGroup: true,
    membersCount: 3890,
    followersCount: 11200,
  },
];

const SUGGESTED_PEOPLE_TO_FOLLOW: ChatContact[] = [
  {
    id: 'p-1',
    name: 'Zola Dlamini',
    handle: '@zola_action',
    role: 'Cyberpunk Mangaka (Soweto)',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    bio: 'Writer & Illustrator of Neo-Soweto 2099. Action scenes and mech design.',
    unreadCount: 0,
    lastMessage: '',
    online: true,
    isCreator: true,
    followersCount: 31200,
  },
  {
    id: 'p-2',
    name: 'Nia Okonjo',
    handle: '@nia_webtoons',
    role: 'Fantasy Illustrator (Lagos)',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Folklore and supernatural manga storytelling. Golden Rhino award nominee.',
    unreadCount: 0,
    lastMessage: '',
    online: true,
    isCreator: true,
    followersCount: 45800,
  },
  {
    id: 'p-3',
    name: 'Tariq Al-Mansoor',
    handle: '@tariq_ink',
    role: 'Scriptwriter & Storyboarder',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    bio: 'Cinematic manga pacing and dialogue. Collaborating on AZ Canvas originals.',
    unreadCount: 0,
    lastMessage: '',
    online: false,
    isCreator: true,
    followersCount: 16700,
  },
];

export const ChatsPage: React.FC<ChatsPageProps> = ({ onOpenUserProfile }) => {
  const [profile, setProfile] = useState<UserProfile>(() => getCurrentUserProfile());
  const [activeTab, setActiveTab] = useState<'dms' | 'groups' | 'discover'>('dms');
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [groups, setGroups] = useState<ChatContact[]>(INITIAL_GROUPS);
  const [suggestedPeople] = useState<ChatContact[]>(SUGGESTED_PEOPLE_TO_FOLLOW);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeContact, setActiveContact] = useState<ChatContact>(INITIAL_CONTACTS[0]);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'Mlungiseni Mbhele',
      text: 'Welcome to AZ OVERVERSE direct channels! How are you enjoying our original manga releases?',
      timestamp: '09:40 AM',
      isMe: false,
      reactions: { '❤️': 4, '🔥': 2 },
    },
    {
      id: 'm-2',
      sender: 'You',
      text: 'The vertical reader scroll is buttery smooth, and the artwork in Chapter 1 is peak!',
      timestamp: '09:42 AM',
      isMe: true,
      reactions: { '🔥': 3 },
    },
    {
      id: 'm-3',
      sender: 'Mlungiseni Mbhele',
      text: 'Episode 2 ink and toning are finished! Releasing on Friday.',
      timestamp: '09:45 AM',
      isMe: false,
      reactions: { '❤️': 6, '👑': 3 },
    },
    {
      id: 'm-4',
      sender: 'Mlungiseni Mbhele',
      text: '🎤 Voice note from creator: Chapter 2 sneak preview audio',
      timestamp: '09:46 AM',
      isMe: false,
      isVoice: true,
      voiceDuration: '0:18',
      reactions: { '🔥': 5 },
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);
  const [likedMessageAnim, setLikedMessageAnim] = useState<string | null>(null);

  // Create Group Modal
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Shonen Action Manga');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Follow state helper
  const handleFollowToggle = async (targetId: string) => {
    await toggleFollowUser(targetId);
    setProfile(getCurrentUserProfile());
  };

  const filteredContacts = useMemo(() => {
    const list = activeTab === 'groups' ? groups : contacts;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [contacts, groups, activeTab, searchQuery]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'You',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      reactions: {},
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulated response
    setTimeout(() => {
      const replyTexts = [
        `Thanks for supporting African manga creators on AZ OVERVERSE! 🚀`,
        `Appreciate your comment! Chapter dropping on schedule this week. 🔥`,
        `That's awesome feedback! Added to the editorial review notes. ✍️`,
        `Love the energy! Don't forget to vote in Manga of the Year! 🏆`,
      ];
      const randomReply = replyTexts[Math.floor(Math.random() * replyTexts.length)];

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          sender: activeContact.name,
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          reactions: { '❤️': 1 },
        },
      ]);
    }, 1200);
  };

  const handleDoubleTapLike = (msgId: string) => {
    setLikedMessageAnim(msgId);
    setTimeout(() => setLikedMessageAnim(null), 1000);

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const currentLikes = m.reactions?.['❤️'] || 0;
          return {
            ...m,
            reactions: {
              ...(m.reactions || {}),
              '❤️': currentLikes + 1,
            },
            userReaction: '❤️',
          };
        }
        return m;
      })
    );
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const count = m.reactions?.[emoji] || 0;
          return {
            ...m,
            reactions: {
              ...(m.reactions || {}),
              [emoji]: count + 1,
            },
            userReaction: emoji,
          };
        }
        return m;
      })
    );
  };

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: ChatContact = {
      id: `grp-${Date.now()}`,
      name: newGroupName,
      handle: `#${newGroupName.toLowerCase().replace(/\s+/g, '_')}`,
      role: newGroupCategory,
      avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
      bio: newGroupDescription || 'Reader circle created on AZ OVERVERSE.',
      unreadCount: 0,
      lastMessage: `Group created by ${profile.displayName}. Start chatting!`,
      online: true,
      isGroup: true,
      membersCount: 1,
      followersCount: 1,
    };

    setGroups((prev) => [newGroup, ...prev]);
    setActiveContact(newGroup);
    setActiveTab('groups');
    setIsCreateGroupOpen(false);
    setNewGroupName('');
    setNewGroupDescription('');

    // Welcome message in group
    setMessages([
      {
        id: `m-grp-init`,
        sender: 'System',
        text: `🎉 Circle "${newGroup.name}" created! Invite your friends and discuss African manga!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      },
    ]);
  };

  return (
    <div className="mx-auto max-w-7xl pb-24">
      {/* Top Header with Social CTAs */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wide text-white">
              CHATS & <span className="text-amber-400">COMMUNITY CIRCLES</span>
            </h1>
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Social</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect directly with African creators, discuss chapters in reader circles, and follow your favorite artists.
          </p>
        </div>

        {/* Header Action Buttons: Create Account / User Badge + Create Group */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="chat-create-account-btn"
            onClick={onOpenUserProfile}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow"
            title="Create account or manage your profile"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>{profile.email === 'mlungisenimbhele3@gmail.com' || profile.email === 'azoververse@gmail.com' ? 'Account: Producer' : profile.displayName ? `Account: ${profile.displayName}` : 'Create Account / Sign In'}</span>
          </button>

          <button
            id="chat-create-group-btn"
            onClick={() => setIsCreateGroupOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-black text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Main Social Chat Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-3xl border border-slate-800 bg-slate-950 p-3 sm:p-5 shadow-2xl min-h-[620px]">
        {/* Left Sidebar: Contacts, Groups & Discover */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-4 flex flex-col">
          {/* Tabs: DMs vs Groups vs Discover People */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-3 gap-1">
            <button
              onClick={() => setActiveTab('dms')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'dms'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>DMs</span>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Groups ({groups.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'discover'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Follow</span>
            </button>
          </div>

          {/* Search bar */}
          {activeTab !== 'discover' && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'groups' ? 'Search manga circles...' : 'Search conversations...'}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* LIST VIEW BASED ON TAB */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[480px] pr-1">
            {activeTab === 'discover' ? (
              // TikTok / Facebook style social follow list
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block px-1">
                  Creators & Readers to Follow
                </span>
                {suggestedPeople.map((person) => {
                  const following = isUserFollowed(person.id);
                  return (
                    <div
                      key={`discover-${person.id}`}
                      className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={person.avatar}
                            alt={person.name}
                            className="w-10 h-10 rounded-full object-cover border border-amber-400/60"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <h4 className="text-xs font-bold text-white truncate">{person.name}</h4>
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            </div>
                            <span className="text-[10px] text-slate-400 block">{person.handle}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleFollowToggle(person.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            following
                              ? 'bg-slate-800 border border-slate-700 text-slate-300'
                              : 'bg-amber-500 hover:bg-amber-400 text-black font-black shadow'
                          }`}
                        >
                          {following ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-tight">
                        {person.bio}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                        <span>{person.followersCount.toLocaleString()} followers</span>
                        <button
                          onClick={() => {
                            // Add to contacts if not already
                            if (!contacts.find((c) => c.id === person.id)) {
                              setContacts((prev) => [person, ...prev]);
                            }
                            setActiveContact(person);
                            setActiveTab('dms');
                          }}
                          className="text-amber-400 hover:text-white font-bold transition"
                        >
                          Send Message →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // DM or Groups List
              filteredContacts.map((c) => (
                <div
                  key={`chat-contact-${c.id}`}
                  onClick={() => setActiveContact(c)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${
                    activeContact.id === c.id
                      ? 'bg-amber-500/15 border border-amber-500/40 text-white shadow'
                      : 'bg-slate-900/60 border border-slate-800 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="h-11 w-11 rounded-2xl object-cover border border-slate-700"
                    />
                    {c.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs truncate text-white flex items-center gap-1">
                        <span>{c.name}</span>
                        {c.isCreator && (
                          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                      </h4>
                      {c.unreadCount > 0 && (
                        <span className="rounded-full bg-amber-500 text-black px-1.5 py-0.2 text-[10px] font-black shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {c.isGroup ? `${c.membersCount} members • ${c.role}` : c.role}
                    </p>
                    <p className="text-xs text-slate-300 truncate mt-1">
                      {c.lastMessage}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Conversation */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={activeContact.avatar}
                  alt={activeContact.name}
                  className="h-10 w-10 rounded-2xl object-cover border border-amber-400/40"
                />
                {activeContact.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>{activeContact.name}</span>
                  {activeContact.isCreator && (
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  {activeContact.isGroup && (
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      Manga Circle
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>{activeContact.handle}</span>
                  <span>•</span>
                  <span className="text-emerald-400">
                    {activeContact.online ? 'Active now' : 'Online earlier today'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <button
                onClick={() => handleFollowToggle(activeContact.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  isUserFollowed(activeContact.id)
                    ? 'bg-slate-900 border border-slate-800 text-slate-300'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black'
                }`}
              >
                {isUserFollowed(activeContact.id) ? 'Following' : '+ Follow'}
              </button>
              <button className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition text-white">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition text-white">
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[400px] min-h-[320px]">
            {messages.map((m) => (
              <div
                key={`msg-${m.id}`}
                className={`flex flex-col relative group ${m.isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Double tap heart animation */}
                {likedMessageAnim === m.id && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-ping">
                    <Heart className="w-12 h-12 fill-rose-500 text-rose-500 drop-shadow-lg" />
                  </div>
                )}

                <div
                  onDoubleClick={() => handleDoubleTapLike(m.id)}
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-4 py-3 text-xs leading-relaxed shadow-md cursor-pointer select-none transition ${
                    m.isMe
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-medium rounded-br-sm'
                      : 'bg-slate-900 border border-slate-800 text-white rounded-bl-sm'
                  }`}
                  title="Double-tap to like with heart ❤️"
                >
                  {m.isVoice ? (
                    <div className="flex items-center gap-3 py-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPlayingVoice(isPlayingVoice === m.id ? null : m.id);
                        }}
                        className={`p-2 rounded-full ${
                          m.isMe ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'
                        }`}
                      >
                        {isPlayingVoice === m.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {[40, 70, 90, 60, 100, 50, 80, 45, 95, 30].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full ${m.isMe ? 'bg-black/60' : 'bg-amber-400'} ${
                                isPlayingVoice === m.id ? 'animate-pulse' : ''
                              }`}
                              style={{ height: `${h * 0.16}px` }}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] font-mono ${m.isMe ? 'text-black/80' : 'text-slate-400'}`}>
                          {m.voiceDuration || '0:15'} • Voice Note
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p>{m.text}</p>
                  )}
                </div>

                {/* Reaction emojis on message */}
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  <span className="text-[9px] text-slate-500">{m.timestamp}</span>

                  {m.reactions && Object.entries(m.reactions).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddReaction(m.id, emoji)}
                      className="inline-flex items-center gap-0.5 rounded-full bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 hover:border-amber-400 transition"
                    >
                      <span>{emoji}</span>
                      <span className="font-mono text-[9px]">{count}</span>
                    </button>
                  ))}

                  {/* Quick Reaction Bar */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                    {['❤️', '🔥', '😂', '👑'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(m.id, emoji)}
                        className="text-xs hover:scale-125 transition-transform p-0.5"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Reaction Stickers */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80 mt-2">
            {[
              { label: 'HYPED! 🔥', text: 'HYPED! 🔥' },
              { label: 'PEAK FICTION ⚡', text: 'PEAK FICTION! ⚡' },
              { label: 'GOAT 🐐', text: 'Absolute GOAT chapter! 🐐' },
              { label: 'CANVAS ART 🎨', text: 'Loved the art style! 🎨' },
            ].map((sticker) => (
              <button
                key={sticker.label}
                onClick={() => setInputText(sticker.text)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-[11px] font-bold text-slate-300 hover:text-white shrink-0 transition"
              >
                {sticker.label}
              </button>
            ))}
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSend} className="mt-2 flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeContact.name}... (Double tap to ❤️)`}
              className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => {
                const simulatedVoiceMsg: Message = {
                  id: `m-${Date.now()}`,
                  sender: 'You',
                  text: '🎤 Voice note sent (0:12)',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isMe: true,
                  isVoice: true,
                  voiceDuration: '0:12',
                  reactions: { '🔥': 1 },
                };
                setMessages((prev) => [...prev, simulatedVoiceMsg]);
              }}
              className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition"
              title="Record simulated voice message"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-black p-3.5 transition font-bold shadow-lg shadow-amber-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* CREATE GROUP MODAL */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
            <button
              onClick={() => setIsCreateGroupOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create Manga Circle</h3>
                <p className="text-xs text-slate-400">Launch a reader fan club or creator discussion group.</p>
              </div>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Circle / Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Mapungubwe Warriors Fan Club"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Category / Focus</label>
                <select
                  value={newGroupCategory}
                  onChange={(e) => setNewGroupCategory(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Shonen Action Manga">Shonen Action Manga</option>
                  <option value="African Lore & Mythology">African Lore & Mythology</option>
                  <option value="Original Creators Hub">Original Creators Hub</option>
                  <option value="Manga of the Year Discussions">Manga of the Year Discussions</option>
                  <option value="Webtoon Colorists & Writers">Webtoon Colorists & Writers</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Circle Description</label>
                <textarea
                  rows={3}
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What is this circle about? Chapter spoilers, art reviews, or theories..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs hover:brightness-110 transition shadow flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Launch Manga Circle</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
