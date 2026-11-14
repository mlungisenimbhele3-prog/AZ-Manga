export type MessageTickStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole?: string;
  senderIsVIP?: boolean;
  text: string;
  timestamp: string;
  dateGroup: 'Yesterday' | 'Today';
  isMe: boolean;
  status?: MessageTickStatus;
  readByName?: string;
  isReadByVIP?: boolean;
  justRead?: boolean;
  imageUrl?: string;
  imageCaption?: string;
  isVoice?: boolean;
  voiceDuration?: string;
  reactions?: Record<string, number>;
  userReaction?: string;
  isDeleted?: boolean;
  deletedForMe?: boolean;
  senderId?: string;
}

export interface ChatContact {
  id: string;
  name: string;
  handle: string;
  role: string;
  avatar: string;
  fallbackAvatar: string;
  bio: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageIsMe?: boolean;
  lastMessageStatus?: MessageTickStatus;
  online: boolean;
  isCreator?: boolean;
  isVerifiedVIP?: boolean;
  followersCount: number;
  isGroup?: boolean;
  membersCount?: number;
  groupParticipants?: string;
}

/**
 * Generates a crisp, zero-network SVG data-URI avatar fallback with OVERVERSE gold/slate styling
 * so contact avatars never render broken images offline or under strict CSP.
 */
export function buildInitialsAvatar(initials: string, bgHex: string, accentHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bgHex}"/><stop offset="100%" stop-color="#090d16"/></linearGradient></defs><rect width="128" height="128" rx="64" fill="url(#g)"/><circle cx="64" cy="64" r="60" fill="none" stroke="${accentHex}" stroke-opacity="0.55" stroke-width="4"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="44" letter-spacing="1">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isVerifiedVIPContact(contact: Pick<ChatContact, 'isCreator' | 'isVerifiedVIP' | 'name'>): boolean {
  return Boolean(
    contact.isVerifiedVIP ||
      contact.isCreator ||
      contact.name.includes('✨')
  );
}

export function getFirstReaderName(fullName: string): string {
  const cleaned = fullName.replace(/✨/g, '').trim();
  return cleaned.split(' ')[0] || cleaned;
}

export const STUDIO_ARTWORK_ATTACHMENTS = [
  {
    id: 'art-nkosi',
    title: 'Nkosi: The Tale of Myths — Key Visual',
    url: '/assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp',
  },
  {
    id: 'art-zambezi',
    title: 'The Last Shaman of Zambezi — Spread',
    url: '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
  },
  {
    id: 'art-highveld',
    title: 'Echoes of the Highveld — Color Pass',
    url: '/assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp',
  },
  {
    id: 'art-panel-4',
    title: 'Ceremonial Hall Ink Study',
    url: '/assets/aistudio/864065446_1439121761762844_7954184789731044419_n_4e836595.webp',
  },
];

export const INITIAL_CONTACTS: ChatContact[] = [
  {
    id: 'c-1',
    name: 'Mlungiseni Mbhele',
    handle: '@mlungiseni_mbhele',
    role: 'Executive Producer',
    avatar: '/assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp',
    fallbackAvatar: buildInitialsAvatar('MM', '#78350f', '#fbbf24'),
    bio: 'Executive Producer of AZ OVERVERSE. Creator of Nkosi: The Tale of Myths & champion of African Manga.',
    unreadCount: 2,
    lastMessage: '🎤 Voice note (0:18) • Episode 2 ink and toning are finished!',
    lastMessageTime: '09:46',
    lastMessageIsMe: false,
    online: true,
    isCreator: true,
    isVerifiedVIP: true,
    followersCount: 0,
  },
  {
    id: 'c-3',
    name: 'Thabo Khumalo',
    handle: '@thabo_animex',
    role: 'Manga Artist (Durban)',
    avatar: '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
    fallbackAvatar: buildInitialsAvatar('TK', '#1e3a8a', '#fbbf24'),
    bio: 'Shonen action penciller. Working on Cape Town Shadow Warriors & Zambezi lore.',
    unreadCount: 0,
    lastMessage: 'Sent you the double-page action spread! Let me know if the speedlines hit.',
    lastMessageTime: '09:18',
    lastMessageIsMe: true,
    lastMessageStatus: 'read',
    online: true,
    isCreator: true,
    isVerifiedVIP: true,
    followersCount: 0,
  },
  {
    id: 'c-4',
    name: 'Ayanda Sithole',
    handle: '@ayanda_draws',
    role: 'Webtoon Colorist (Johannesburg)',
    avatar: '/assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp',
    fallbackAvatar: buildInitialsAvatar('AS', '#581c87', '#fbbf24'),
    bio: 'Digital webtoon colorist and background artist. Fan of Afro-fantasy & folklore.',
    unreadCount: 1,
    lastMessage: 'The golden hour lighting in the ceremonial hall panel turned out amazing!',
    lastMessageTime: '08:52',
    lastMessageIsMe: false,
    online: true,
    isCreator: true,
    isVerifiedVIP: true,
    followersCount: 0,
  },
  {
    id: 'c-5',
    name: 'Kofi Mensah',
    handle: '@kofi_manga',
    role: 'Guest Reader • Accra',
    avatar: buildInitialsAvatar('KM', '#0f172a', '#ef4444'),
    fallbackAvatar: buildInitialsAvatar('KM', '#0f172a', '#ef4444'),
    bio: 'Guest Reader & manga collector hosting weekly chapter reaction circles.',
    unreadCount: 0,
    lastMessage: 'Just finished reading! Are red ticks active for Guest Readers?',
    lastMessageTime: 'Yesterday',
    lastMessageIsMe: true,
    lastMessageStatus: 'read',
    online: true,
    isCreator: false,
    isVerifiedVIP: false,
    followersCount: 0,
  },
  {
    id: 'c-2',
    name: 'AZ Editorial & Publisher Support',
    handle: '@az_support',
    role: 'Official Platform Desk',
    avatar: '/playstore-icon-512.png',
    fallbackAvatar: buildInitialsAvatar('AZ', '#111827', '#f59e0b'),
    bio: '24/7 Creator royalties, Google Play Store billing & chapter submission assistance.',
    unreadCount: 0,
    lastMessage: 'Your creator account is connected for 70% direct royalty payouts.',
    lastMessageTime: 'Yesterday',
    lastMessageIsMe: true,
    lastMessageStatus: 'read',
    online: true,
    isCreator: false,
    isVerifiedVIP: false,
    followersCount: 0,
  },
  {
    id: 'c-6',
    name: 'Sipho Ndlovu',
    handle: '@sipho_reader',
    role: 'Guest Reader • Soweto',
    avatar: buildInitialsAvatar('SN', '#1e293b', '#ef4444'),
    fallbackAvatar: buildInitialsAvatar('SN', '#1e293b', '#ef4444'),
    bio: 'Avid Shonen & Kasi-Punk Guest Reader on AZ OVERVERSE.',
    unreadCount: 0,
    lastMessage: 'Respect! Counting down to Friday’s drop 🔥',
    lastMessageTime: 'Yesterday',
    lastMessageIsMe: true,
    lastMessageStatus: 'delivered',
    online: false,
    isCreator: false,
    isVerifiedVIP: false,
    followersCount: 0,
  },
];

export const INITIAL_GROUPS: ChatContact[] = [
  {
    id: 'grp-1',
    name: 'AZ Oververse Creators Hub',
    handle: '#az_creators',
    role: 'Verified Manga Guild',
    avatar: '/assets/aistudio/864065446_1439121761762844_7954184789731044419_n_4e836595.webp',
    fallbackAvatar: buildInitialsAvatar('CH', '#78350f', '#fbbf24'),
    bio: 'Official African mangaka guild: storyboards, ink critiques, and Google Play earnings.',
    unreadCount: 3,
    lastMessage: 'Mlungiseni ✨: Voting for Manga of the Year closes midnight Sunday!',
    lastMessageTime: '10:04',
    lastMessageIsMe: false,
    online: true,
    isCreator: true,
    isVerifiedVIP: true,
    isGroup: true,
    membersCount: 0,
    groupParticipants: 'Mlungiseni ✨, Thabo ✨, Ayanda ✨, You',
    followersCount: 0,
  },
  {
    id: 'grp-2',
    name: 'Shonen Pulse Readers Circle',
    handle: '#shonen_pulse',
    role: 'Guest Readers Community',
    avatar: '/assets/aistudio/857872877_1452459446839395_7963345796326052180_n_b7d59072.webp',
    fallbackAvatar: buildInitialsAvatar('SP', '#1e293b', '#ef4444'),
    bio: 'Daily theorycrafting, power scaling, and chapter reaction drops by Guest Readers.',
    unreadCount: 0,
    lastMessage: 'You: Drop your top 3 panel theories before Chapter 2!',
    lastMessageTime: '09:12',
    lastMessageIsMe: true,
    lastMessageStatus: 'read',
    online: true,
    isCreator: false,
    isVerifiedVIP: false,
    isGroup: true,
    membersCount: 0,
    groupParticipants: 'Kofi, Sipho, Lerato, You',
    followersCount: 0,
  },
];

export const SUGGESTED_PEOPLE_TO_FOLLOW: ChatContact[] = [
  {
    id: 'p-1',
    name: 'Zola Dlamini',
    handle: '@zola_action',
    role: 'Cyberpunk Mangaka (Soweto)',
    avatar: '/assets/aistudio/863828260_4617557535148066_7093504428428258727_n_00bb7391.webp',
    fallbackAvatar: buildInitialsAvatar('ZD', '#064e3b', '#fbbf24'),
    bio: 'Writer & Illustrator of Neo-Soweto 2099. Action scenes and mech design.',
    unreadCount: 0,
    lastMessage: 'Mech concepts for Neo-Soweto 2099 are live!',
    lastMessageTime: 'Today',
    online: true,
    isCreator: true,
    isVerifiedVIP: true,
    followersCount: 0,
  },
  {
    id: 'p-2',
    name: 'Nia Okonjo',
    handle: '@nia_webtoons',
    role: 'Fantasy Illustrator (Lagos)',
    avatar: '/assets/aistudio/862620681_1304598868406485_898394409428393681_n_8fa8ea5a.webp',
    fallbackAvatar: buildInitialsAvatar('NO', '#701a75', '#fbbf24'),
    bio: 'Folklore and supernatural manga storytelling. Golden Rhino award nominee.',
    unreadCount: 0,
    lastMessage: 'Working on sacred mask motifs for the new arc ✨',
    lastMessageTime: 'Today',
    online: true,
    isCreator: true,
    isVerifiedVIP: true,
    followersCount: 0,
  },
  {
    id: 'p-3',
    name: 'Tariq Al-Mansoor',
    handle: '@tariq_ink',
    role: 'Scriptwriter & Storyboarder',
    avatar: '/assets/aistudio/857740589_1731657971260608_5138240210488329565_n_d9fa3357.webp',
    fallbackAvatar: buildInitialsAvatar('TM', '#1e3a8a', '#fbbf24'),
    bio: 'Cinematic manga pacing and dialogue. Collaborating on AZ Canvas originals.',
    unreadCount: 0,
    lastMessage: 'Pacing script for Act II is locked in.',
    lastMessageTime: 'Yesterday',
    online: false,
    isCreator: true,
    isVerifiedVIP: true,
    followersCount: 0,
  },
];

export const INITIAL_MESSAGES_BY_CONVERSATION: Record<string, ChatMessage[]> = {
  'c-1': [
    {
      id: 'c1-m1',
      sender: 'Mlungiseni Mbhele',
      senderRole: 'Executive Producer',
      senderIsVIP: true,
      text: 'Welcome to AZ OVERVERSE direct channels! How are you enjoying the vertical reader and Nkosi key visuals so far?',
      timestamp: '18:20',
      dateGroup: 'Yesterday',
      isMe: false,
      reactions: { '🔥': 4, '👑': 2 },
    },
    {
      id: 'c1-m2',
      sender: 'You',
      text: 'The 60fps vertical scroll feels ultra-native, and the gold/black OVERVERSE theme is pure class!',
      timestamp: '18:24',
      dateGroup: 'Yesterday',
      isMe: true,
      status: 'read',
      readByName: 'Mlungiseni',
      isReadByVIP: true,
      reactions: { '❤️': 2, '✨': 1 },
    },
    {
      id: 'c1-m3',
      sender: 'Mlungiseni Mbhele',
      senderRole: 'Executive Producer',
      senderIsVIP: true,
      text: 'Check out the mastered cover proof for Nkosi: The Tale of Myths before Friday’s announcement.',
      imageUrl: '/assets/aistudio/876507702_1790968748807516_1967466416315700542_n_aea98a38.webp',
      imageCaption: 'Nkosi: The Tale of Myths — Official AZ Original Master Cover',
      timestamp: '09:41',
      dateGroup: 'Today',
      isMe: false,
      reactions: { '🔥': 7, '👑': 4 },
    },
    {
      id: 'c1-m4',
      sender: 'You',
      text: 'That lighting and detail are unreal! Notice the Gold VIP read ticks glowing on our verified creator thread ✨',
      timestamp: '09:43',
      dateGroup: 'Today',
      isMe: true,
      status: 'read',
      readByName: 'Mlungiseni',
      isReadByVIP: true,
      reactions: { '🔥': 3 },
    },
    {
      id: 'c1-m5',
      sender: 'Mlungiseni Mbhele',
      senderRole: 'Executive Producer',
      senderIsVIP: true,
      text: 'Episode 2 ink and toning are finished! Releasing on Friday.',
      timestamp: '09:45',
      dateGroup: 'Today',
      isMe: false,
      reactions: { '❤️': 6 },
    },
    {
      id: 'c1-m6',
      sender: 'Mlungiseni Mbhele',
      senderRole: 'Executive Producer',
      senderIsVIP: true,
      text: 'Studio voice memo: Episode 2 soundtrack & pacing notes',
      timestamp: '09:46',
      dateGroup: 'Today',
      isMe: false,
      isVoice: true,
      voiceDuration: '0:18',
      reactions: { '🔥': 5 },
    },
  ],

  'c-3': [
    {
      id: 'c3-m1',
      sender: 'Thabo Khumalo',
      senderRole: 'Manga Artist (Durban)',
      senderIsVIP: true,
      text: 'Saw your notes on the Zambezi shaman sequence! I pushed the G-pen ink contrast way harder on page 12.',
      timestamp: '20:15',
      dateGroup: 'Yesterday',
      isMe: false,
      reactions: { '🔥': 2 },
    },
    {
      id: 'c3-m2',
      sender: 'Thabo Khumalo',
      senderRole: 'Manga Artist (Durban)',
      senderIsVIP: true,
      text: 'Here is the updated Zambezi spread preview:',
      imageUrl: '/assets/aistudio/862516203_2025904894785875_8927204788896565857_n_afa879ec.webp',
      imageCaption: 'The Last Shaman of Zambezi — Ancestral Lightning Spread',
      timestamp: '09:14',
      dateGroup: 'Today',
      isMe: false,
      reactions: { '🔥': 5, '⚡': 3 },
    },
    {
      id: 'c3-m3',
      sender: 'You',
      text: 'Sent you the double-page action spread! Let me know if the speedlines hit.',
      timestamp: '09:18',
      dateGroup: 'Today',
      isMe: true,
      status: 'read',
      readByName: 'Thabo',
      isReadByVIP: true,
      reactions: { '👑': 1 },
    },
  ],

  'c-4': [
    {
      id: 'c4-m1',
      sender: 'You',
      text: 'Hey Ayanda! Did the warm amber rim-light work on the Highveld grassland establishing shot?',
      timestamp: '17:30',
      dateGroup: 'Yesterday',
      isMe: true,
      status: 'read',
      readByName: 'Ayanda',
      isReadByVIP: true,
    },
    {
      id: 'c4-m2',
      sender: 'Ayanda Sithole',
      senderRole: 'Webtoon Colorist',
      senderIsVIP: true,
      text: 'Yes!! Look at how the sunbeams cut across the plateau:',
      imageUrl: '/assets/aistudio/858773050_1090471570458562_5763578410902289088_n_e2f7ebb3.webp',
      imageCaption: 'Echoes of the Highveld — Final Color Script',
      timestamp: '08:50',
      dateGroup: 'Today',
      isMe: false,
      reactions: { '❤️': 4, '✨': 3 },
    },
    {
      id: 'c4-m3',
      sender: 'Ayanda Sithole',
      senderRole: 'Webtoon Colorist',
      senderIsVIP: true,
      text: 'The golden hour lighting in the ceremonial hall panel turned out amazing!',
      timestamp: '08:52',
      dateGroup: 'Today',
      isMe: false,
      isVoice: true,
      voiceDuration: '0:14',
    },
  ],

  'c-5': [
    {
      id: 'c5-m1',
      sender: 'Kofi Mensah',
      senderRole: 'Guest Reader',
      senderIsVIP: false,
      text: 'Yo! Checking in from Accra — the community circle is hyped for Friday’s chapter drop!',
      timestamp: '19:05',
      dateGroup: 'Yesterday',
      isMe: false,
      reactions: { '🔥': 2 },
    },
    {
      id: 'c5-m2',
      sender: 'You',
      text: 'Appreciate the support Kofi! Sharing the teaser link with the Shonen Circle tonight.',
      timestamp: '19:08',
      dateGroup: 'Yesterday',
      isMe: true,
      status: 'read',
      readByName: 'Kofi',
      isReadByVIP: false,
    },
    {
      id: 'c5-m3',
      sender: 'You',
      text: 'Just finished reading! Are red ticks active for Guest Readers?',
      timestamp: '21:14',
      dateGroup: 'Yesterday',
      isMe: true,
      status: 'read',
      readByName: 'Kofi',
      isReadByVIP: false,
      reactions: { '🔥': 1 },
    },
  ],

  'c-2': [
    {
      id: 'c2-m1',
      sender: 'AZ Editorial & Publisher Support',
      senderRole: 'Official Platform Desk',
      senderIsVIP: false,
      text: 'Hello Creator! Your AZ OVERVERSE Studio profile and package ID com.azoververse.manga are verified.',
      timestamp: '14:10',
      dateGroup: 'Yesterday',
      isMe: false,
    },
    {
      id: 'c2-m2',
      sender: 'AZ Editorial & Publisher Support',
      senderRole: 'Official Platform Desk',
      senderIsVIP: false,
      text: 'Your creator account is connected for 70% direct royalty payouts.',
      timestamp: '14:12',
      dateGroup: 'Yesterday',
      isMe: false,
      reactions: { '❤️': 1 },
    },
    {
      id: 'c2-m3',
      sender: 'You',
      text: 'Confirmed — thank you! Submitting Chapter 2 master pages shortly.',
      timestamp: '14:20',
      dateGroup: 'Yesterday',
      isMe: true,
      status: 'read',
      readByName: 'AZ Support',
      isReadByVIP: false,
    },
  ],

  'c-6': [
    {
      id: 'c6-m1',
      sender: 'Sipho Ndlovu',
      senderRole: 'Guest Reader',
      senderIsVIP: false,
      text: 'Bro, Kasi-Punk and Afro-Fantasy on one platform is a dream come true 🇿🇦🔥',
      timestamp: '20:40',
      dateGroup: 'Yesterday',
      isMe: false,
    },
    {
      id: 'c6-m2',
      sender: 'You',
      text: 'Glad you’re part of the day-one family Sipho! More heat on the way.',
      timestamp: '20:44',
      dateGroup: 'Yesterday',
      isMe: true,
      status: 'read',
      readByName: 'Sipho',
      isReadByVIP: false,
    },
    {
      id: 'c6-m3',
      sender: 'You',
      text: 'Respect! Counting down to Friday’s drop 🔥',
      timestamp: '20:46',
      dateGroup: 'Yesterday',
      isMe: true,
      status: 'delivered',
      readByName: 'Sipho',
      isReadByVIP: false,
    },
  ],

  'grp-1': [
    {
      id: 'g1-m1',
      sender: 'Thabo Khumalo',
      senderRole: 'Manga Artist',
      senderIsVIP: true,
      text: 'Morning guild! Uploaded 600dpi monochrome screentone presets for everyone.',
      timestamp: '21:10',
      dateGroup: 'Yesterday',
      isMe: false,
      reactions: { '🔥': 8, '👏': 4 },
    },
    {
      id: 'g1-m2',
      sender: 'Ayanda Sithole',
      senderRole: 'Webtoon Colorist',
      senderIsVIP: true,
      text: 'Lifesaver Thabo! Pairing those tones with warm gold gradients right now ✨',
      timestamp: '09:50',
      dateGroup: 'Today',
      isMe: false,
      reactions: { '❤️': 5 },
    },
    {
      id: 'g1-m3',
      sender: 'You',
      text: 'Studio build is running at locked 60fps across Android & Web! Ready for the weekend showcase.',
      timestamp: '09:58',
      dateGroup: 'Today',
      isMe: true,
      status: 'read',
      readByName: 'Mlungiseni',
      isReadByVIP: true,
      reactions: { '🔥': 9, '👑': 4 },
    },
    {
      id: 'g1-m4',
      sender: 'Mlungiseni Mbhele',
      senderRole: 'Executive Producer',
      senderIsVIP: true,
      text: 'Voting for Manga of the Year closes midnight Sunday! Make sure your cover banners are updated.',
      timestamp: '10:04',
      dateGroup: 'Today',
      isMe: false,
      reactions: { '🏆': 11, '🔥': 6 },
    },
  ],

  'grp-2': [
    {
      id: 'g2-m1',
      sender: 'Kofi Mensah',
      senderRole: 'Guest Reader',
      senderIsVIP: false,
      text: 'Who else noticed the hidden ancestral rune etched on the Golden Rhino sceptre?!',
      timestamp: '22:05',
      dateGroup: 'Yesterday',
      isMe: false,
      reactions: { '😮': 6, '🔥': 9 },
    },
    {
      id: 'g2-m2',
      sender: 'Sipho Ndlovu',
      senderRole: 'Guest Reader',
      senderIsVIP: false,
      text: 'Facts! That connects directly to the Zambezi spirit masks theory 👀',
      timestamp: '08:55',
      dateGroup: 'Today',
      isMe: false,
      reactions: { '💯': 4 },
    },
    {
      id: 'g2-m3',
      sender: 'You',
      text: 'Drop your top 3 panel theories before Chapter 2!',
      timestamp: '09:12',
      dateGroup: 'Today',
      isMe: true,
      status: 'read',
      readByName: 'Kofi',
      isReadByVIP: false,
      reactions: { '🔥': 7 },
    },
  ],

  'p-1': [
    {
      id: 'p1-m1',
      sender: 'Zola Dlamini',
      senderRole: 'Cyberpunk Mangaka',
      senderIsVIP: true,
      text: 'Sharp! Welcome to Neo-Soweto 2099 concept lab ⚡',
      imageUrl: '/assets/aistudio/863828260_4617557535148066_7093504428428258727_n_00bb7391.webp',
      imageCaption: 'Neo-Soweto 2099 — Mecha Frame Concept',
      timestamp: '10:00',
      dateGroup: 'Today',
      isMe: false,
      reactions: { '🔥': 4 },
    },
  ],

  'p-2': [
    {
      id: 'p2-m1',
      sender: 'Nia Okonjo',
      senderRole: 'Fantasy Illustrator',
      senderIsVIP: true,
      text: 'Greetings from Lagos! Excited to collaborate with fellow AZ OVERVERSE creators ✨',
      timestamp: '09:30',
      dateGroup: 'Today',
      isMe: false,
      reactions: { '❤️': 3 },
    },
  ],

  'p-3': [
    {
      id: 'p3-m1',
      sender: 'Tariq Al-Mansoor',
      senderRole: 'Scriptwriter',
      senderIsVIP: true,
      text: 'Let’s break down the cliffhanger dialogue beats whenever you’re free.',
      timestamp: '16:45',
      dateGroup: 'Yesterday',
      isMe: false,
    },
  ],
};
