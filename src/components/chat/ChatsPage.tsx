import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Search,
  UserPlus,
  Users,
  Plus,
  CheckCircle2,
  Check,
  X,
  Compass,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  getCurrentUserProfile,
  isUserFollowed,
  toggleFollowUser,
  UserProfile,
} from '../../services/userProfile';
import { safeStorage } from '../../utils/safeStorage';
import {
  ChatContact,
  ChatMessage,
  INITIAL_CONTACTS,
  INITIAL_GROUPS,
  SUGGESTED_PEOPLE_TO_FOLLOW,
  INITIAL_MESSAGES_BY_CONVERSATION,
  buildInitialsAvatar,
  getFirstReaderName,
  isVerifiedVIPContact,
} from './chatData';
import { FullChatView, MessageTicks } from './FullChatView';

interface ChatsPageProps {
  onOpenUserProfile?: () => void;
}

const CHAT_THREADS_STORAGE_KEY = 'az_oververse_chat_threads_v2';

const CONTEXTUAL_REPLIES_BY_ID: Record<string, string[]> = {
  'c-1': [
    'Appreciate that! Episode 2 ink and toning are locked — Friday release is going to shake the timeline 🔥',
    '100%! We’re keeping AZ OVERVERSE 60fps smooth for every reader from Soweto to Tokyo ✨',
    'Noted for the Executive Producer review! Keep pushing African manga forward 👑',
  ],
  'c-3': [
    'Sharp! Adding extra G-pen motion blur on that final slash panel right now 🗡️',
    'Durban studio is cooking non-stop this week! Wait till you see Page 18 🔥',
  ],
  'c-4': [
    'Thank you!! Warm gold rim-lighting on dark slate backgrounds always hits different ✨🎨',
    'Just exported the 4K webtoon color pass — uploading to Studio shortly!',
  ],
  'c-5': [
    'Facts!! The Accra reader circle is ready for Friday night’s live breakdown 🔥',
    'Seen! Red ticks looking super clean on OVERVERSE 💯',
  ],
  'c-2': [
    'Confirmed by AZ Editorial Desk. Your 70% creator royalty split & Play Console bundle remain active.',
    'Thank you for reaching out to AZ Editorial Support! Ticket updated.',
  ],
  'c-6': [
    'Ayy respect! Sharing the link with my Soweto manga squad right now 🇿🇦🔥',
  ],
  'grp-1': [
    'Let’s gooo! Guild submissions for Manga of the Year are looking world-class 🏆✨',
    'Big salute from the creators hub! Keep those chapters dropping 🔥',
  ],
  'grp-2': [
    'Theory locked in!! Can’t wait to see who called the plot twist on Friday 👀🔥',
    'Shonen Pulse Circle never misses 💯',
  ],
};

export const ChatsPage: React.FC<ChatsPageProps> = ({ onOpenUserProfile }) => {
  const [profile, setProfile] = useState<UserProfile>(() => getCurrentUserProfile());
  const [activeTab, setActiveTab] = useState<'dms' | 'groups' | 'discover'>('dms');
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [groups, setGroups] = useState<ChatContact[]>(INITIAL_GROUPS);
  const [suggestedPeople] = useState<ChatContact[]>(SUGGESTED_PEOPLE_TO_FOLLOW);
  const [searchQuery, setSearchQuery] = useState('');

  // Full-screen WhatsApp conversation state (null = Chats list screen, ChatContact = slide-in FullChatView)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Hydrate per-person message threads
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, ChatMessage[]>
  >(() => {
    const cached = safeStorage.getJSON<Record<string, ChatMessage[]> | null>(
      CHAT_THREADS_STORAGE_KEY,
      null
    );
    if (cached && typeof cached === 'object') {
      return { ...INITIAL_MESSAGES_BY_CONVERSATION, ...cached };
    }
    return INITIAL_MESSAGES_BY_CONVERSATION;
  });

  // Create Group Modal
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Shonen Action Manga');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const pendingTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((id) => window.clearTimeout(id));
      pendingTimersRef.current = [];
    };
  }, []);

  const persistThreads = useCallback((nextMap: Record<string, ChatMessage[]>) => {
    safeStorage.setJSONDeferred(CHAT_THREADS_STORAGE_KEY, nextMap);
  }, []);

  // Resolve full live ChatContact object for selectedConversation
  const selectedConversation = useMemo<ChatContact | null>(() => {
    if (!selectedConversationId) return null;
    return (
      contacts.find((c) => c.id === selectedConversationId) ||
      groups.find((g) => g.id === selectedConversationId) ||
      suggestedPeople.find((p) => p.id === selectedConversationId) ||
      null
    );
  }, [selectedConversationId, contacts, groups, suggestedPeople]);

  const handleOpenConversation = useCallback((target: ChatContact) => {
    // Clear unread badge on open & mark any delivered outgoing messages as read
    if (target.isGroup) {
      setGroups((prev) =>
        prev.map((g) => (g.id === target.id ? { ...g, unreadCount: 0 } : g))
      );
    } else {
      setContacts((prev) =>
        prev.map((c) => (c.id === target.id ? { ...c, unreadCount: 0 } : c))
      );
    }
    setSelectedConversationId(target.id);
  }, []);

  const handleFollowToggle = useCallback(async (targetId: string) => {
    await toggleFollowUser(targetId);
    setProfile(getCurrentUserProfile());
  }, []);

  const filteredList = useMemo(() => {
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

  const totalUnreadDMs = useMemo(
    () => contacts.reduce((sum, c) => sum + c.unreadCount, 0),
    [contacts]
  );

  const totalUnreadGroups = useMemo(
    () => groups.reduce((sum, g) => sum + g.unreadCount, 0),
    [groups]
  );

  const updateConversationPreview = useCallback(
    (
      conversationId: string,
      patch: Partial<
        Pick<
          ChatContact,
          'lastMessage' | 'lastMessageTime' | 'lastMessageIsMe' | 'lastMessageStatus' | 'unreadCount'
        >
      >
    ) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, ...patch } : c))
      );
      setGroups((prev) =>
        prev.map((g) => (g.id === conversationId ? { ...g, ...patch } : g))
      );
    },
    []
  );

  // Send message with live Sent (✓) -> Delivered (✓✓) -> Read (Red ✓✓ or Gold VIP ✨✓✓) progression
  const handleSendMessageInRoom = useCallback(
    (
      conversationId: string,
      payload: {
        text: string;
        imageUrl?: string;
        imageCaption?: string;
        isVoice?: boolean;
        voiceDuration?: string;
      }
    ) => {
      const target =
        contacts.find((c) => c.id === conversationId) ||
        groups.find((g) => g.id === conversationId) ||
        suggestedPeople.find((p) => p.id === conversationId);

      const nowTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const vipReader = target ? isVerifiedVIPContact(target) : false;
      const readerFirst = target ? getFirstReaderName(target.name) : 'Reader';
      const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const outgoingMsg: ChatMessage = {
        id: msgId,
        sender: 'You',
        text: payload.text,
        imageUrl: payload.imageUrl,
        imageCaption: payload.imageCaption,
        isVoice: payload.isVoice,
        voiceDuration: payload.voiceDuration,
        timestamp: nowTime,
        dateGroup: 'Today',
        isMe: true,
        status: 'sent',
        readByName: readerFirst,
        isReadByVIP: vipReader,
        reactions: {},
      };

      const previewSummary = payload.isVoice
        ? `🎤 Voice note (${payload.voiceDuration || '0:12'})`
        : payload.imageUrl
        ? `📷 ${payload.text || 'Photo'}`
        : payload.text;

      setMessagesByConversation((prev) => {
        const currentList = prev[conversationId] || [];
        const updated = { ...prev, [conversationId]: [...currentList, outgoingMsg] };
        persistThreads(updated);
        return updated;
      });

      updateConversationPreview(conversationId, {
        lastMessage: previewSummary,
        lastMessageTime: nowTime,
        lastMessageIsMe: true,
        lastMessageStatus: 'sent',
        unreadCount: 0,
      });

      // Step 1: Sent -> Delivered (grey ✓✓)
      const tDelivered = window.setTimeout(() => {
        setMessagesByConversation((prev) => {
          const list = prev[conversationId] || [];
          const updated: Record<string, ChatMessage[]> = {
            ...prev,
            [conversationId]: list.map((m): ChatMessage =>
              m.id === msgId ? { ...m, status: 'delivered' } : m
            ),
          };
          persistThreads(updated);
          return updated;
        });
        updateConversationPreview(conversationId, {
          lastMessageStatus: 'delivered',
        });
      }, 450);

      // Step 2: Delivered -> Read (Signature RED ✓✓ or GOLD VIP ✨✓✓ with pop glow!)
      const tRead = window.setTimeout(() => {
        setMessagesByConversation((prev) => {
          const list = prev[conversationId] || [];
          const updated: Record<string, ChatMessage[]> = {
            ...prev,
            [conversationId]: list.map((m): ChatMessage =>
              m.id === msgId ? { ...m, status: 'read', justRead: true } : m
            ),
          };
          persistThreads(updated);
          return updated;
        });
        updateConversationPreview(conversationId, {
          lastMessageStatus: 'read',
        });
      }, 1050);

      // Clear transient pop animation flag cleanly
      const tClearPop = window.setTimeout(() => {
        setMessagesByConversation((prev) => {
          const list = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: list.map((m) =>
              m.id === msgId ? { ...m, justRead: false } : m
            ),
          };
        });
      }, 1900);

      // Step 3: Contextual reply from creator / circle member
      const tReply = window.setTimeout(() => {
        const pool = CONTEXTUAL_REPLIES_BY_ID[conversationId] || [
          'Respect! Appreciate you tapping in on AZ OVERVERSE 🔥',
          'Loud and clear! New manga panels dropping this week ⚡',
        ];
        const replyText = pool[Math.floor(Math.random() * pool.length)];
        const replyTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        const replySender = target?.isGroup
          ? vipReader
            ? 'Mlungiseni Mbhele'
            : 'Kofi Mensah'
          : target?.name || 'Creator';

        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          sender: replySender,
          senderRole: target?.role,
          senderIsVIP: vipReader,
          text: replyText,
          timestamp: replyTime,
          dateGroup: 'Today',
          isMe: false,
          reactions: {},
        };

        setMessagesByConversation((prev) => {
          const list = prev[conversationId] || [];
          const updated = { ...prev, [conversationId]: [...list, replyMsg] };
          persistThreads(updated);
          return updated;
        });

        updateConversationPreview(conversationId, {
          lastMessage: target?.isGroup ? `${getFirstReaderName(replySender)}: ${replyText}` : replyText,
          lastMessageTime: replyTime,
          lastMessageIsMe: false,
        });
      }, 2700);

      pendingTimersRef.current.push(tDelivered, tRead, tClearPop, tReply);
    },
    [contacts, groups, suggestedPeople, persistThreads, updateConversationPreview]
  );

  const handleToggleReaction = useCallback(
    (conversationId: string, messageId: string, emoji: string) => {
      setMessagesByConversation((prev) => {
        const list = prev[conversationId] || [];
        const updatedList = list.map((m) => {
          if (m.id !== messageId) return m;
          const existingReactions = { ...(m.reactions || {}) };
          if (m.userReaction === emoji) {
            existingReactions[emoji] = Math.max(0, (existingReactions[emoji] || 1) - 1);
            if (existingReactions[emoji] === 0) {
              delete existingReactions[emoji];
            }
            return { ...m, reactions: existingReactions, userReaction: undefined };
          }
          if (m.userReaction && existingReactions[m.userReaction]) {
            existingReactions[m.userReaction] = Math.max(
              0,
              existingReactions[m.userReaction] - 1
            );
            if (existingReactions[m.userReaction] === 0) {
              delete existingReactions[m.userReaction];
            }
          }
          existingReactions[emoji] = (existingReactions[emoji] || 0) + 1;
          return { ...m, reactions: existingReactions, userReaction: emoji };
        });
        const updated = { ...prev, [conversationId]: updatedList };
        persistThreads(updated);
        return updated;
      });
    },
    [persistThreads]
  );

  const handleClearConversation = useCallback(
    (conversationId: string) => {
      setMessagesByConversation((prev) => {
        const updated = { ...prev, [conversationId]: [] };
        persistThreads(updated);
        return updated;
      });
      updateConversationPreview(conversationId, {
        lastMessage: 'Chat cleared',
        lastMessageIsMe: false,
      });
    },
    [persistThreads, updateConversationPreview]
  );

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return;

    const initials = trimmedName
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'GC';

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const newGroup: ChatContact = {
      id: `grp-${Date.now()}`,
      name: trimmedName,
      handle: `#${trimmedName.toLowerCase().replace(/\s+/g, '_')}`,
      role: newGroupCategory,
      avatar: buildInitialsAvatar(initials, '#78350f', '#fbbf24'),
      fallbackAvatar: buildInitialsAvatar(initials, '#78350f', '#fbbf24'),
      bio: newGroupDescription || 'Reader & creator circle launched on AZ OVERVERSE.',
      unreadCount: 0,
      lastMessage: `Circle created by ${profile.displayName || 'Producer'}. Tap to chat!`,
      lastMessageTime: nowTime,
      online: true,
      isCreator: newGroupCategory.includes('Creators'),
      isVerifiedVIP: newGroupCategory.includes('Creators'),
      isGroup: true,
      membersCount: 1,
      groupParticipants: 'You (Founder)',
      followersCount: 1,
    };

    const welcomeMsg: ChatMessage = {
      id: `grp-init-${Date.now()}`,
      sender: 'AZ OVERVERSE',
      senderRole: 'Circle Host',
      senderIsVIP: true,
      text: `🎉 Circle "${newGroup.name}" is live! Share manga panels, voice notes, and chapter theories.`,
      timestamp: nowTime,
      dateGroup: 'Today',
      isMe: false,
    };

    setGroups((prev) => [newGroup, ...prev]);
    setMessagesByConversation((prev) => {
      const updated = { ...prev, [newGroup.id]: [welcomeMsg] };
      persistThreads(updated);
      return updated;
    });
    setActiveTab('groups');
    setIsCreateGroupOpen(false);
    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedConversationId(newGroup.id);
  };

  const isCurrentUserVIP =
    profile.email === 'mlungisenimbhele3@gmail.com' ||
    profile.email === 'azoververse@gmail.com';

  return (
    <div className="mx-auto max-w-6xl pb-24">
      {/* Top Header with Social CTAs */}
      <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-['Bebas_Neue',sans-serif] text-3xl sm:text-4xl tracking-wide text-white">
              CHATS & <span className="text-amber-400">DIRECT CHANNELS</span>
            </h1>
            <span className="rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tap any DM or Manga Circle to open full-screen chat with signature Gold VIP ✨ & Red read receipts.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="chat-create-account-btn"
            type="button"
            onClick={onOpenUserProfile}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/50 hover:border-amber-400 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isCurrentUserVIP
                ? 'Account: Producer ✨'
                : profile.displayName
                ? `Account: ${profile.displayName}`
                : 'Create Account / Sign In'}
            </span>
          </button>

          <button
            id="chat-create-group-btn"
            type="button"
            onClick={() => setIsCreateGroupOpen(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FF8C00] hover:brightness-105 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Layout: WhatsApp Conversation List + OVERVERSE VIP Status Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Saved Chats List Screen (Primary Column) */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
          {/* Top Tabs Bar (DMs / Groups / Follow) */}
          <div className="p-3 sm:p-4 border-b border-slate-800/90 bg-slate-950/90 space-y-3">
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('dms')}
                className={`min-h-[42px] flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'dms'
                    ? 'bg-gradient-to-r from-[#FFD700] to-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chats</span>
                {totalUnreadDMs > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none ${
                      activeTab === 'dms'
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {totalUnreadDMs}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                className={`min-h-[42px] flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'groups'
                    ? 'bg-gradient-to-r from-[#FFD700] to-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Groups ({groups.length})</span>
                {totalUnreadGroups > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none ${
                      activeTab === 'groups'
                        ? 'bg-slate-950 text-amber-400'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {totalUnreadGroups}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('discover')}
                className={`min-h-[42px] flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'discover'
                    ? 'bg-gradient-to-r from-[#FFD700] to-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Discover</span>
              </button>
            </div>

            {/* Search Input */}
            {activeTab !== 'discover' && (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'groups'
                      ? 'Search manga circles...'
                      : 'Search creators or guest readers...'
                  }
                  className="w-full rounded-2xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Conversation Rows / Discover List */}
          <div className="divide-y divide-slate-800/70">
            {activeTab === 'discover' ? (
              <div className="p-4 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                  Verified Creators to Follow & Message
                </span>
                {suggestedPeople.map((person) => {
                  const following = isUserFollowed(person.id);
                  const isVIP = isVerifiedVIPContact(person);
                  return (
                    <div
                      key={`discover-${person.id}`}
                      className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-amber-500/40 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={person.avatar}
                              alt={person.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = person.fallbackAvatar;
                              }}
                              className="w-12 h-12 rounded-full object-cover border border-amber-400/70"
                            />
                            {person.online && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <h4 className="text-sm font-bold text-white truncate">
                                {person.name}
                              </h4>
                              {isVIP && <span>✨</span>}
                            </div>
                            <span className="text-[11px] text-amber-400/90 block truncate">
                              {person.role} • {person.handle}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleFollowToggle(person.id)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                            following
                              ? 'bg-slate-800 border border-slate-700 text-slate-300'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow'
                          }`}
                        >
                          {following ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{person.bio}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <span>{person.followersCount.toLocaleString()} followers</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!contacts.some((c) => c.id === person.id)) {
                              setContacts((prev) => [person, ...prev]);
                            }
                            setActiveTab('dms');
                            handleOpenConversation(person);
                          }}
                          className="min-h-[36px] px-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold transition inline-flex items-center gap-1"
                        >
                          <span>Open Full Chat</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-14 px-4 text-center space-y-1.5">
                <p className="text-sm font-semibold text-slate-300">No conversations match "{searchQuery}"</p>
                <p className="text-xs text-slate-500">Try searching another creator name or circle.</p>
              </div>
            ) : (
              filteredList.map((c) => {
                const isVIP = isVerifiedVIPContact(c);
                return (
                  <button
                    key={`conv-row-${c.id}`}
                    type="button"
                    onClick={() => handleOpenConversation(c)}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-slate-900/80 active:bg-slate-900 transition group"
                  >
                    {/* Avatar + Green Online Dot */}
                    <div className="relative shrink-0">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.src !== c.fallbackAvatar) {
                            img.src = c.fallbackAvatar;
                          }
                        }}
                        className={`h-13 w-13 rounded-full object-cover border ${
                          isVIP ? 'border-amber-400/75' : 'border-slate-700'
                        }`}
                      />
                      {c.online && (
                        <span
                          className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950"
                          title="Online"
                        />
                      )}
                    </div>

                    {/* Middle Name + Role + Last Message with Live Read Ticks */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm sm:text-[15px] text-white truncate flex items-center gap-1.5">
                          <span className="truncate">{c.name}</span>
                          {isVIP && (
                            <span
                              className="text-xs shrink-0"
                              title="Verified VIP Creator — Gold Read Ticks"
                            >
                              ✨
                            </span>
                          )}
                        </h3>
                        <span
                          className={`text-[11px] tabular-nums shrink-0 ${
                            c.unreadCount > 0
                              ? 'text-amber-400 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {c.lastMessageTime}
                        </span>
                      </div>

                      <p className="text-[11px] text-amber-400/80 truncate mt-0.5">
                        {c.isGroup
                          ? `${(c.membersCount || 1).toLocaleString()} members • ${c.role}`
                          : c.role}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {c.lastMessageIsMe && (
                            <MessageTicks
                              status={c.lastMessageStatus || 'read'}
                              isVIPSender={isCurrentUserVIP}
                              isReadByVIP={isVIP}
                              readerName={c.name}
                            />
                          )}
                          <p className="text-xs sm:text-[13px] text-slate-300 truncate">
                            {c.lastMessage}
                          </p>
                        </div>

                        {c.unreadCount > 0 ? (
                          <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FF8C00] text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0 shadow">
                            {c.unreadCount}
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column on Desktop: Signature OVERVERSE Read Receipt Guide & Quick Launch */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <h2 className="font-['Bebas_Neue',sans-serif] text-xl tracking-wide text-white">
                SIGNATURE <span className="text-amber-400">OVERVERSE TICKS</span>
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Every full-screen chat uses AZ OVERVERSE’s multi-tier read receipt system. Long-press or hover ticks inside any chat bubble to inspect who saw your message.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-2xl bg-slate-950/90 border border-amber-500/35 px-3.5 py-2.5">
                <div>
                  <p className="font-bold text-amber-300">Gold VIP Read ✨</p>
                  <p className="text-[11px] text-slate-400">
                    Verified Creators (Mlungiseni ✨, Thabo ✨, Ayanda ✨)
                  </p>
                </div>
                <MessageTicks status="read" isReadByVIP={true} readerName="Mlungiseni" />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-950/90 border border-red-500/35 px-3.5 py-2.5">
                <div>
                  <p className="font-bold text-red-400">Red Read</p>
                  <p className="text-[11px] text-slate-400">
                    Seen by Guest Readers & Community
                  </p>
                </div>
                <MessageTicks status="read" isReadByVIP={false} readerName="Kofi" />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-950/90 border border-slate-800 px-3.5 py-2.5">
                <div>
                  <p className="font-semibold text-slate-300">Delivered / Sent</p>
                  <p className="text-[11px] text-slate-500">
                    Awaiting recipient view
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MessageTicks status="sent" />
                  <span className="text-slate-700">/</span>
                  <MessageTicks status="delivered" />
                </div>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                60fps Full-Screen Native View
              </span>
              <button
                type="button"
                onClick={() => handleOpenConversation(contacts[0])}
                className="text-amber-400 hover:text-amber-300 font-bold transition"
              >
                Open Producer Chat →
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* FULL-SCREEN WHATSAPP CHAT VIEW (Slides in from right on conversation click) */}
      <AnimatePresence mode="wait">
        {selectedConversation && (
          <FullChatView
            key={selectedConversation.id}
            conversation={selectedConversation}
            messages={messagesByConversation[selectedConversation.id] || []}
            isCurrentUserVIP={isCurrentUserVIP}
            isFollowed={isUserFollowed(selectedConversation.id)}
            onToggleFollow={handleFollowToggle}
            onBack={() => setSelectedConversationId(null)}
            onSendMessage={handleSendMessageInRoom}
            onToggleReaction={handleToggleReaction}
            onClearConversation={handleClearConversation}
          />
        )}
      </AnimatePresence>

      {/* CREATE GROUP MODAL */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setIsCreateGroupOpen(false)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create Manga Circle</h3>
                <p className="text-xs text-slate-400">
                  Launch a reader fan club or verified creator group.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Circle / Group Name
                </label>
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
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Category / Focus
                </label>
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
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Circle Description
                </label>
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
                className="min-h-[44px] w-full py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FF8C00] text-slate-950 font-black text-xs hover:brightness-105 transition shadow flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Launch & Open Full Chat</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatsPage;
