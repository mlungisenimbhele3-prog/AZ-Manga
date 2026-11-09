import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  Play,
  Pause,
  Sparkles,
  Search,
  BellOff,
  Bell,
  Trash2,
  X,
  Image as ImageIcon,
  Info,
  Palette,
  ChevronDown,
  PhoneOff,
  MicOff,
  Volume2,
  CameraOff,
  Check,
  Heart,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Copy,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import {
  ChatContact,
  ChatMessage,
  MessageTickStatus,
  STUDIO_ARTWORK_ATTACHMENTS,
  getFirstReaderName,
  isVerifiedVIPContact,
} from './chatData';
import { ReportModal } from './ReportModal';
import { isUserBlocked, blockUser, unblockUser } from '../../services/safetyService';

export interface MessageTicksProps {
  status?: MessageTickStatus;
  isVIPSender?: boolean;
  isReadByVIP?: boolean;
  readerName?: string;
  justTransitionedToRead?: boolean;
}

/**
 * Signature AZ OVERVERSE Read Receipt System:
 * - 'sent'                  -> Single grey tick ✓ (#9CA3AF)
 * - 'delivered'             -> Double grey tick ✓✓ (#9CA3AF)
 * - 'read' && !isReadByVIP  -> RED double tick ✓✓ (#EF4444 -> #B91C1C gradient + red glow)
 * - 'read' && isReadByVIP   -> GOLD VIP double tick ✓✓ (#FFD700 -> #FF8C00 gradient + golden glow + ✨ particles)
 * Includes long-press (touch) & hover/tap tooltip: "Seen by Mlungiseni • Gold VIP"
 */
export function MessageTicks({
  status = 'sent',
  isVIPSender = false,
  isReadByVIP = false,
  readerName = 'Reader',
  justTransitionedToRead = false,
}: MessageTicksProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const autoHideTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      if (autoHideTimerRef.current !== null) {
        window.clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [clearTimers]);

  const triggerTooltipWithAutoHide = useCallback(() => {
    if (status !== 'read') return;
    setShowTooltip(true);
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
    }
    autoHideTimerRef.current = window.setTimeout(() => {
      setShowTooltip(false);
    }, 2800);
  }, [status]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (status !== 'read') return;
    e.stopPropagation();
    clearTimers();
    longPressTimerRef.current = window.setTimeout(() => {
      triggerTooltipWithAutoHide();
    }, 320);
  };

  const handlePointerUpOrCancel = () => {
    clearTimers();
  };

  const cleanReader = getFirstReaderName(readerName);
  const tooltipLabel = isReadByVIP
    ? `Seen by ${cleanReader} • Gold VIP`
    : `Seen by ${cleanReader} • Red Seen`;

  return (
    <span
      className="relative inline-flex items-center select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrCancel}
      onPointerLeave={() => {
        handlePointerUpOrCancel();
        setShowTooltip(false);
      }}
      onPointerCancel={handlePointerUpOrCancel}
      onMouseEnter={() => {
        if (status === 'read') setShowTooltip(true);
      }}
      onClick={(e) => {
        if (status === 'read') {
          e.stopPropagation();
          triggerTooltipWithAutoHide();
        }
      }}
      data-vip-sender={isVIPSender ? 'true' : 'false'}
      role={status === 'read' ? 'button' : undefined}
      tabIndex={status === 'read' ? 0 : undefined}
      aria-label={
        status === 'sent'
          ? 'Sent'
          : status === 'delivered'
          ? 'Delivered'
          : tooltipLabel
      }
    >
      {/* Long-press / hover tooltip */}
      <AnimatePresence>
        {showTooltip && status === 'read' && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.14 }}
            className={`pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide shadow-xl z-40 border ${
              isReadByVIP
                ? 'bg-slate-950/95 border-amber-400/60 text-amber-300'
                : 'bg-slate-950/95 border-red-500/60 text-red-300'
            }`}
          >
            {isReadByVIP ? `✨ ${tooltipLabel}` : tooltipLabel}
          </motion.span>
        )}
      </AnimatePresence>

      {status === 'sent' && (
        <span className="text-[#9CA3AF] font-semibold text-[11px] leading-none tracking-tighter">
          ✓
        </span>
      )}

      {status === 'delivered' && (
        <span className="text-[#9CA3AF] font-semibold text-[11px] leading-none tracking-[-0.14em] pr-0.5">
          ✓✓
        </span>
      )}

      {status === 'read' && !isReadByVIP && (
        <span
          className={`bg-gradient-to-r from-[#EF4444] via-[#FF0000] to-[#B91C1C] bg-clip-text text-transparent font-extrabold text-[11px] leading-none tracking-[-0.14em] pr-0.5 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)] tick-red-seen ${
            justTransitionedToRead ? 'tick-red-pop' : ''
          }`}
        >
          ✓✓
        </span>
      )}

      {status === 'read' && isReadByVIP && (
        <span
          className={`relative inline-flex items-center gap-0.5 ${
            justTransitionedToRead ? 'tick-gold-pop' : ''
          }`}
        >
          <span className="text-[8px] leading-none text-amber-300 tick-sparkle-particle">
            ✨
          </span>
          <span className="bg-gradient-to-r from-[#FFD700] via-yellow-300 to-[#FF8C00] bg-clip-text text-transparent font-black text-[11px] leading-none tracking-[-0.14em] pr-0.5 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] tick-gold-vip animate-pulse">
            ✓✓
          </span>
          <span className="text-[7px] leading-none text-yellow-200 tick-sparkle-particle -mt-1">
            ✨
          </span>
        </span>
      )}
    </span>
  );
}

const WAVEFORM_BAR_CLASSES = [
  'h-1.5',
  'h-3',
  'h-4',
  'h-2.5',
  'h-5',
  'h-3.5',
  'h-2',
  'h-4',
  'h-5',
  'h-3',
  'h-2',
  'h-4',
  'h-3.5',
  'h-5',
  'h-2.5',
  'h-4',
  'h-3',
  'h-1.5',
  'h-3.5',
  'h-2.5',
  'h-4',
  'h-2',
];

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😮', '👏', '👑', '✨'];

const EMOJI_DRAWER_ITEMS = [
  '🔥',
  '✨',
  '👑',
  '❤️',
  '😂',
  '🙌',
  '⚡',
  '🎨',
  '🗡️',
  '🇿🇦',
  '🏆',
  '💯',
  '😮',
  '👏',
  '🚀',
  '🐐',
  '💎',
  '🎬',
  '📚',
  '🖤',
  '🌟',
  '🎤',
  '🤝',
  '🫡',
];

function parseDurationSeconds(duration?: string): number {
  if (!duration) return 15;
  const parts = duration.split(':').map((n) => parseInt(n, 10));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return Math.max(3, parts[0] * 60 + parts[1]);
  }
  return 15;
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Plays a gentle, pleasant Web Audio studio chime/cadence when playing voice notes
 * without requiring external MP3 assets.
 */
function playSubtleStudioTone() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.17);
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 250);
  } catch {
    // Ignore audio context autoplay restrictions cleanly
  }
}

export interface FullChatViewProps {
  conversation: ChatContact;
  messages: ChatMessage[];
  isCurrentUserVIP?: boolean;
  isFollowed?: boolean;
  onToggleFollow?: (contactId: string) => void;
  onBack: () => void;
  onSendMessage: (
    conversationId: string,
    payload: {
      text: string;
      imageUrl?: string;
      imageCaption?: string;
      isVoice?: boolean;
      voiceDuration?: string;
    }
  ) => void;
  onToggleReaction: (conversationId: string, messageId: string, emoji: string) => void;
  onClearConversation: (conversationId: string) => void;
  onDeleteMessageForEveryone?: (conversationId: string, messageId: string) => void;
  onDeleteMessageForMe?: (conversationId: string, messageId: string) => void;
  onBlockUser?: (contact: ChatContact) => void;
  onUnblockUser?: (contactId: string) => void;
}

export const FullChatView: React.FC<FullChatViewProps> = ({
  conversation,
  messages,
  isCurrentUserVIP = true,
  isFollowed = false,
  onToggleFollow,
  onBack,
  onSendMessage,
  onToggleReaction,
  onClearConversation,
  onDeleteMessageForEveryone,
  onDeleteMessageForMe,
  onBlockUser,
  onUnblockUser,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isRecipientVIP = isVerifiedVIPContact(conversation);

  // Input & attachment state
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [stagedImage, setStagedImage] = useState<{ url: string; title: string } | null>(null);

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Voice playback state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceElapsedSec, setVoiceElapsedSec] = useState<number>(0);

  // Header & menu interactive states
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [inChatQuery, setInChatQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [wallpaperStyle, setWallpaperStyle] = useState<'gold' | 'classic' | 'amoled'>('gold');
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [activeCallMode, setActiveCallMode] = useState<'voice' | 'video' | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isCallMicMuted, setIsCallMicMuted] = useState(false);
  const [isCallSpeakerOn, setIsCallSpeakerOn] = useState(true);
  const [isCallCameraOff, setIsCallCameraOff] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<{ id: string; type: 'everyone' | 'me' } | null>(null);
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const [isReportingUser, setIsReportingUser] = useState(false);
  const [isContactBlocked, setIsContactBlocked] = useState<boolean>(() => isUserBlocked(conversation.id));
  const [heartBurstMsgId, setHeartBurstMsgId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingSimulationTimeoutRef = useRef<number | null>(null);
  const messageLongPressTimerRef = useRef<number | null>(null);

  // Sync blocked state with global events
  useEffect(() => {
    const handleBlocked = (e: any) => {
      if (e.detail?.userId === conversation.id) {
        setIsContactBlocked(true);
      }
    };
    const handleUnblocked = (e: any) => {
      if (e.detail?.userId === conversation.id) {
        setIsContactBlocked(false);
      }
    };
    window.addEventListener('az_user_blocked', handleBlocked);
    window.addEventListener('az_user_unblocked', handleUnblocked);
    return () => {
      window.removeEventListener('az_user_blocked', handleBlocked);
      window.removeEventListener('az_user_unblocked', handleUnblocked);
    };
  }, [conversation.id]);

  // Lock background body scroll while full-screen chat view is mounted
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Close on Escape key (unless a sub-modal is open, in which case close sub-modal first)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (messageToDelete) {
          setMessageToDelete(null);
        } else if (reportingMessage || isReportingUser) {
          setReportingMessage(null);
          setIsReportingUser(false);
        } else if (activeMessageMenuId) {
          setActiveMessageMenuId(null);
        } else if (lightboxImage) {
          setLightboxImage(null);
        } else if (activeCallMode) {
          setActiveCallMode(null);
        } else if (showContactInfo) {
          setShowContactInfo(false);
        } else if (showMoreMenu || showAttachMenu || showEmojiPicker) {
          setShowMoreMenu(false);
          setShowAttachMenu(false);
          setShowEmojiPicker(false);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messageToDelete, reportingMessage, isReportingUser, activeMessageMenuId, lightboxImage, activeCallMode, showContactInfo, showMoreMenu, showAttachMenu, showEmojiPicker, onBack]);

  // Smooth auto-scroll to bottom when opening conversation or appending messages
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : behavior,
        block: 'end',
      });
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    scrollToBottom('auto');
  }, [conversation.id, scrollToBottom]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, isPeerTyping, scrollToBottom]);

  // Track scroll position for floating scroll-to-bottom button
  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottomBtn(distanceFromBottom > 180);
  }, []);

  // Voice note playback timer
  useEffect(() => {
    if (!playingVoiceId) {
      setVoiceElapsedSec(0);
      return;
    }
    const targetMsg = messages.find((m) => m.id === playingVoiceId);
    const totalSec = parseDurationSeconds(targetMsg?.voiceDuration);

    const interval = window.setInterval(() => {
      setVoiceElapsedSec((prev) => {
        if (prev + 0.25 >= totalSec) {
          setPlayingVoiceId(null);
          return 0;
        }
        return prev + 0.25;
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [playingVoiceId, messages]);

  // Voice recording timer
  useEffect(() => {
    if (!isRecordingVoice) {
      setRecordingSeconds(0);
      return;
    }
    const interval = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRecordingVoice]);

  // Active Voice/Video call timer
  useEffect(() => {
    if (!activeCallMode) {
      setCallSeconds(0);
      return;
    }
    const interval = window.setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeCallMode]);

  useEffect(() => {
    return () => {
      if (typingSimulationTimeoutRef.current !== null) {
        window.clearTimeout(typingSimulationTimeoutRef.current);
      }
    };
  }, []);

  const showTransientBanner = useCallback((msg: string) => {
    setStatusBanner(msg);
    window.setTimeout(() => {
      setStatusBanner((current) => (current === msg ? null : current));
    }, 2600);
  }, []);

  const handleToggleBlockContact = useCallback(() => {
    if (isContactBlocked) {
      unblockUser(conversation.id);
      onUnblockUser?.(conversation.id);
      setIsContactBlocked(false);
      showTransientBanner('User unblocked.');
    } else {
      blockUser(conversation);
      onBlockUser?.(conversation);
      setIsContactBlocked(true);
      showTransientBanner("User blocked. You won't see their messages anymore.");
    }
  }, [isContactBlocked, conversation, onBlockUser, onUnblockUser, showTransientBanner]);

  // Calculate dynamic rows (1 to 4 lines) for textarea without inline style height thrashing
  const computedTextareaRows = useMemo(() => {
    if (!inputText) return 1;
    const explicitLines = inputText.split('\n').length;
    const wrappedLines = Math.ceil(inputText.length / 38);
    return Math.min(4, Math.max(1, explicitLines, wrappedLines));
  }, [inputText]);

  const visibleMessages = useMemo(() => {
    let list = messages.filter((m) => !m.deletedForMe);
    if (isContactBlocked) {
      list = list.filter((m) => m.isMe);
    }
    if (!showSearchInChat || !inChatQuery.trim()) return list;
    const q = inChatQuery.toLowerCase();
    return list.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        (m.imageCaption && m.imageCaption.toLowerCase().includes(q)) ||
        m.sender.toLowerCase().includes(q)
    );
  }, [messages, isContactBlocked, showSearchInChat, inChatQuery]);

  // Group consecutive messages under Date Separators ("Yesterday", "Today")
  const groupedMessages = useMemo(() => {
    const groups: Array<{ dateLabel: string; items: ChatMessage[] }> = [];
    for (const msg of visibleMessages) {
      const label = msg.dateGroup || 'Today';
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.dateLabel !== label) {
        groups.push({ dateLabel: label, items: [msg] });
      } else {
        lastGroup.items.push(msg);
      }
    }
    return groups;
  }, [visibleMessages]);

  const triggerPeerTypingIndicator = useCallback(() => {
    if (typingSimulationTimeoutRef.current !== null) {
      window.clearTimeout(typingSimulationTimeoutRef.current);
    }
    const t1 = window.setTimeout(() => {
      setIsPeerTyping(true);
    }, 1150);
    typingSimulationTimeoutRef.current = window.setTimeout(() => {
      window.clearTimeout(t1);
      setIsPeerTyping(false);
    }, 2650);
  }, []);

  const handleDispatchSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed && !stagedImage) return;

    onSendMessage(conversation.id, {
      text: trimmed || (stagedImage ? stagedImage.title : ''),
      imageUrl: stagedImage?.url,
      imageCaption: stagedImage ? trimmed || stagedImage.title : undefined,
    });

    setInputText('');
    setStagedImage(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    triggerPeerTypingIndicator();
  }, [inputText, stagedImage, onSendMessage, conversation.id, triggerPeerTypingIndicator]);

  const handleSendRecordedVoice = useCallback(() => {
    const durationFormatted = formatSeconds(Math.max(1, recordingSeconds));
    setIsRecordingVoice(false);
    onSendMessage(conversation.id, {
      text: `Voice note (${durationFormatted})`,
      isVoice: true,
      voiceDuration: durationFormatted,
    });
    triggerPeerTypingIndicator();
  }, [recordingSeconds, onSendMessage, conversation.id, triggerPeerTypingIndicator]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setStagedImage({
          url: reader.result,
          title: file.name.replace(/\.[^/.]+$/, '') || 'Shared Image',
        });
        setShowAttachMenu(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDoubleTapMessage = (msgId: string) => {
    setHeartBurstMsgId(msgId);
    window.setTimeout(() => {
      setHeartBurstMsgId((curr) => (curr === msgId ? null : curr));
    }, 850);
    onToggleReaction(conversation.id, msgId, '❤️');
  };

  const wallpaperClass =
    wallpaperStyle === 'gold'
      ? 'oververse-chat-wallpaper-gold'
      : wallpaperStyle === 'classic'
      ? 'oververse-chat-wallpaper-classic'
      : 'oververse-chat-wallpaper-amoled';

  const hasTypedContent = inputText.trim().length > 0 || Boolean(stagedImage);

  // Header dynamic subtitle: Online / typing... / Role / Group participants
  const headerSubtitle = useMemo(() => {
    if (isPeerTyping) {
      return conversation.isGroup
        ? `${getFirstReaderName(conversation.name)} member is typing...`
        : 'typing...';
    }
    if (conversation.isGroup) {
      return (
        conversation.groupParticipants ||
        `${(conversation.membersCount || 1).toLocaleString()} members • ${conversation.role}`
      );
    }
    if (conversation.online) {
      return `Online • ${conversation.role}`;
    }
    return `${conversation.role} • Last seen today`;
  }, [isPeerTyping, conversation]);

  const sharedImagesInThread = useMemo(
    () => messages.filter((m) => Boolean(m.imageUrl)),
    [messages]
  );

  const chatContent = (
    <motion.div
      key={`full-chat-${conversation.id}`}
      initial={prefersReducedMotion ? { opacity: 0 } : { x: '100%' }}
      animate={prefersReducedMotion ? { opacity: 1 } : { x: 0 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { x: '100%' }}
      transition={
        prefersReducedMotion
          ? { duration: 0.12 }
          : { type: 'tween', duration: 0.24, ease: [0.22, 1, 0.36, 1] }
      }
      className="fixed inset-0 z-[90] flex flex-col h-screen-dynamic w-full bg-[#080b12] text-white gpu-layer overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Chat with ${conversation.name}`}
    >
      {/* 1. TOP STICKY HEADER (WhatsApp Layout + OVERVERSE Dark Gradient & Blur) */}
      <header className="shrink-0 z-30 safe-top-inset bg-gradient-to-r from-slate-950/95 via-[#111827]/95 to-slate-950/95 backdrop-blur-xl border-b border-amber-500/20 px-2 sm:px-4 py-2 shadow-lg">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-1.5">
          {/* Left: Back arrow < + Avatar (with green dot) + Name + Subtitle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-200 hover:text-amber-400 hover:bg-slate-800/70 active:scale-95 transition shrink-0"
              aria-label="Back to chats list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowContactInfo(true)}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left rounded-xl py-1 pr-2 hover:bg-slate-800/50 transition"
            >
              <div className="relative shrink-0">
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src !== conversation.fallbackAvatar) {
                      img.src = conversation.fallbackAvatar;
                    }
                  }}
                  className={`h-10 w-10 rounded-full object-cover border ${
                    isRecipientVIP ? 'border-amber-400/80' : 'border-slate-700'
                  }`}
                />
                {conversation.online && (
                  <span
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-950"
                    title="Online"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-sm sm:text-base text-white truncate">
                    {conversation.name}
                  </span>
                  {isRecipientVIP && (
                    <span
                      className="inline-flex items-center text-xs shrink-0"
                      title="Verified VIP Creator — Gold Read Ticks Active"
                    >
                      ✨
                    </span>
                  )}
                  {isMuted && <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                </div>

                <p
                  className={`text-[11px] truncate leading-tight ${
                    isPeerTyping
                      ? 'text-emerald-400 font-semibold animate-pulse'
                      : conversation.online
                      ? 'text-emerald-400/90'
                      : 'text-slate-400'
                  }`}
                >
                  {headerSubtitle}
                </p>
              </div>
            </button>
          </div>

          {/* Right: Call icon + Video call icon + Three dots menu */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 relative">
            <button
              type="button"
              onClick={() => {
                setIsCallMicMuted(false);
                setActiveCallMode('voice');
              }}
              className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-200 hover:text-amber-400 hover:bg-slate-800/70 active:scale-95 transition"
              aria-label={`Voice call ${conversation.name}`}
              title="Voice Call"
            >
              <Phone className="w-[19px] h-[19px]" />
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCallMicMuted(false);
                setIsCallCameraOff(false);
                setActiveCallMode('video');
              }}
              className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-200 hover:text-amber-400 hover:bg-slate-800/70 active:scale-95 transition"
              aria-label={`Video call ${conversation.name}`}
              title="Video Call"
            >
              <Video className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowMoreMenu((prev) => !prev);
                setShowAttachMenu(false);
                setShowEmojiPicker(false);
              }}
              className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-200 hover:text-amber-400 hover:bg-slate-800/70 active:scale-95 transition"
              aria-label="Conversation options"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Three-Dots Dropdown Menu */}
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-1 top-12 w-56 rounded-2xl border border-slate-800 bg-slate-900/98 backdrop-blur-xl shadow-2xl py-1.5 z-50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowContactInfo(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <Info className="w-4 h-4 text-amber-400" />
                    <span>{conversation.isGroup ? 'Group Info' : 'View Contact'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowSearchInChat((prev) => !prev);
                      setInChatQuery('');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <Search className="w-4 h-4 text-amber-400" />
                    <span>Search in Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextMuted = !isMuted;
                      setIsMuted(nextMuted);
                      setShowMoreMenu(false);
                      showTransientBanner(
                        nextMuted
                          ? `Notifications muted for ${conversation.name}`
                          : `Notifications unmuted for ${conversation.name}`
                      );
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    {isMuted ? (
                      <>
                        <Bell className="w-4 h-4 text-emerald-400" />
                        <span>Unmute Notifications</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4 text-slate-400" />
                        <span>Mute Notifications</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextWallpaper =
                        wallpaperStyle === 'gold'
                          ? 'classic'
                          : wallpaperStyle === 'classic'
                          ? 'amoled'
                          : 'gold';
                      setWallpaperStyle(nextWallpaper);
                      setShowMoreMenu(false);
                      showTransientBanner(
                        nextWallpaper === 'gold'
                          ? 'Wallpaper: OVERVERSE Gold Pattern'
                          : nextWallpaper === 'classic'
                          ? 'Wallpaper: Dark Doodle Slate'
                          : 'Wallpaper: Pure AMOLED Black'
                      );
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>Cycle Chat Wallpaper</span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  {/* Block / Unblock User */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleToggleBlockContact();
                    }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-medium flex items-center gap-2.5 ${
                      isContactBlocked
                        ? 'text-emerald-400 hover:bg-emerald-500/10'
                        : 'text-amber-400 hover:bg-amber-500/10'
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    <span>{isContactBlocked ? 'Unblock User' : 'Block User'}</span>
                  </button>

                  {/* Report User */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      setIsReportingUser(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Report User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClearConversation(conversation.id);
                      setShowMoreMenu(false);
                      showTransientBanner('Messages cleared in this chat');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Chat</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Optional In-Chat Search Bar */}
        <AnimatePresence>
          {showSearchInChat && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="mx-auto max-w-5xl pt-2 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inChatQuery}
                  onChange={(e) => setInChatQuery(e.target.value)}
                  placeholder="Search messages in this conversation..."
                  autoFocus
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSearchInChat(false);
                  setInChatQuery('');
                }}
                className="min-h-[36px] px-3 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Subtle Transient Toast Banner */}
      <AnimatePresence>
        {statusBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-40 rounded-xl bg-slate-900/95 border border-amber-500/40 px-3.5 py-1.5 text-xs font-semibold text-amber-200 shadow-xl pointer-events-none"
          >
            {statusBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MESSAGES AREA (WhatsApp Dark Wallpaper + Bubbles + Date Separators) */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        onClick={() => {
          if (showMoreMenu) setShowMoreMenu(false);
          if (showAttachMenu) setShowAttachMenu(false);
          if (activeReactionPickerMsgId) setActiveReactionPickerMsgId(null);
        }}
        className={`flex-1 overflow-y-auto fluid-scroller px-3 sm:px-6 py-4 ${wallpaperClass}`}
      >
        <div className="mx-auto max-w-4xl space-y-5 pb-2">
          {/* End-to-End / VIP Signature Notice */}
          <div className="flex justify-center">
            <div className="rounded-xl bg-slate-900/85 border border-slate-800/90 px-3.5 py-1.5 text-[11px] text-slate-400 text-center max-w-md shadow-sm">
              {isRecipientVIP ? (
                <span>
                  <span className="text-amber-400 font-semibold">✨ Gold VIP Channel:</span> Read receipts from{' '}
                  <span className="text-slate-200 font-medium">{conversation.name}</span> glow in{' '}
                  <span className="text-amber-400 font-bold">Gold VIP ✓✓</span>. Long-press ticks for details.
                </span>
              ) : (
                <span>
                  <span className="text-red-400 font-semibold">AZ OVERVERSE Direct:</span> Read receipts from Guest Readers glow in{' '}
                  <span className="text-red-400 font-bold">Red ✓✓</span>. Long-press ticks for details.
                </span>
              )}
            </div>
          </div>

          {groupedMessages.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-300">
                {inChatQuery ? 'No matching messages found.' : 'No messages yet.'}
              </p>
              <p className="text-xs text-slate-500">
                {inChatQuery
                  ? 'Try another search keyword.'
                  : `Send a message or voice note to ${conversation.name} below.`}
              </p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.dateLabel} className="space-y-3">
                {/* Date Separator Pill ("Yesterday", "Today") */}
                <div className="flex justify-center sticky top-1 z-10 pointer-events-none">
                  <span className="rounded-lg bg-slate-900/95 border border-slate-800/90 px-3 py-1 text-[11px] font-semibold text-slate-300 shadow-md">
                    {group.dateLabel}
                  </span>
                </div>

                {group.items.map((msg) => {
                  const isMe = msg.isMe;
                  const reactionEntries = Object.entries(msg.reactions || {}).filter(
                    ([, count]) => count > 0
                  );
                  const isPlayingThisVoice = playingVoiceId === msg.id;
                  const totalVoiceSec = parseDurationSeconds(msg.voiceDuration);
                  const progressRatio = isPlayingThisVoice
                    ? Math.min(1, voiceElapsedSec / totalVoiceSec)
                    : 0;
                  const readByVIP =
                    msg.isReadByVIP !== undefined ? msg.isReadByVIP : isRecipientVIP;
                  const readerDisplayName = msg.readByName || conversation.name;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col relative group ${
                        isMe ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Double-tap heart burst */}
                      {heartBurstMsgId === msg.id && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-ping">
                          <Heart className="w-10 h-10 fill-rose-500 text-rose-500" />
                        </div>
                      )}

                      <div className="relative max-w-[86%] sm:max-w-[72%]">
                        {/* Speech Tail SVG */}
                        {isMe ? (
                          <svg
                            viewBox="0 0 8 13"
                            width="8"
                            height="13"
                            className="absolute -right-[7px] top-0 text-[#FBBF24] fill-current pointer-events-none"
                            aria-hidden="true"
                          >
                            <path d="M0 0h8L0 13V0z" />
                          </svg>
                        ) : (
                          <svg
                            viewBox="0 0 8 13"
                            width="8"
                            height="13"
                            className="absolute -left-[7px] top-0 text-[#1e293b] fill-current pointer-events-none"
                            aria-hidden="true"
                          >
                            <path d="M8 0H0l8 13V0z" />
                          </svg>
                        )}

                        {/* Message Bubble */}
                        <div
                          onDoubleClick={() => handleDoubleTapMessage(msg.id)}
                          className={`relative rounded-2xl px-3.5 pt-2.5 pb-2 shadow-md transition ${
                            isMe
                              ? 'rounded-tr-none bg-gradient-to-br from-[#FFD700] via-[#FBBF24] to-[#FF8C00] text-slate-950'
                              : 'rounded-tl-none bg-[#1e293b] border border-slate-700/60 text-slate-100'
                          }`}
                        >
                          {/* Sender Name Header inside Group Chats (Left Bubbles) */}
                          {!isMe && conversation.isGroup && (
                            <div className="flex items-center gap-1 mb-1">
                              <span
                                className={`text-[11px] font-extrabold tracking-tight ${
                                  msg.senderIsVIP ? 'text-amber-400' : 'text-sky-400'
                                }`}
                              >
                                {msg.sender}
                              </span>
                              {msg.senderIsVIP && (
                                <span className="text-[10px]" title="Verified Creator">
                                  ✨
                                </span>
                              )}
                              {msg.senderRole && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  • {msg.senderRole}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Image Attachment */}
                          {msg.imageUrl && (
                            <div className="mb-2 -mx-1.5 -mt-0.5 overflow-hidden rounded-xl border border-black/15 bg-slate-950">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLightboxImage({
                                    url: msg.imageUrl!,
                                    caption: msg.imageCaption || msg.text,
                                  });
                                }}
                                className="block w-full text-left focus:outline-none"
                              >
                                <img
                                  src={msg.imageUrl}
                                  alt={msg.imageCaption || 'Shared artwork'}
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  className="w-full max-h-64 object-cover hover:opacity-95 transition"
                                />
                              </button>
                            </div>
                          )}

                          {/* Voice Note Bubble */}
                          {msg.isVoice ? (
                            <div className="flex items-center gap-2.5 py-1 min-w-[210px] sm:min-w-[250px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isPlayingThisVoice) {
                                    setPlayingVoiceId(null);
                                  } else {
                                    playSubtleStudioTone();
                                    setVoiceElapsedSec(0);
                                    setPlayingVoiceId(msg.id);
                                  }
                                }}
                                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow transition active:scale-95 ${
                                  isMe
                                    ? 'bg-slate-950 text-amber-400 hover:bg-slate-900'
                                    : 'bg-gradient-to-br from-[#FFD700] to-[#FF8C00] text-slate-950 hover:brightness-105'
                                }`}
                                aria-label={isPlayingThisVoice ? 'Pause voice note' : 'Play voice note'}
                              >
                                {isPlayingThisVoice ? (
                                  <Pause className="w-4 h-4 fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-[3px] h-6">
                                  {WAVEFORM_BAR_CLASSES.map((barHeightClass, idx) => {
                                    const barRatio = (idx + 1) / WAVEFORM_BAR_CLASSES.length;
                                    const isPlayedBar = isPlayingThisVoice && barRatio <= progressRatio;
                                    return (
                                      <span
                                        key={idx}
                                        className={`w-[3px] rounded-full transition-colors ${barHeightClass} ${
                                          isMe
                                            ? isPlayedBar
                                              ? 'bg-slate-950'
                                              : 'bg-slate-950/45'
                                            : isPlayedBar
                                            ? 'bg-amber-400'
                                            : 'bg-slate-500/70'
                                        }`}
                                      />
                                    );
                                  })}
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className={isMe ? 'text-slate-900/85 font-semibold' : 'text-slate-400'}>
                                    {isPlayingThisVoice
                                      ? formatSeconds(voiceElapsedSec)
                                      : msg.voiceDuration || '0:15'}
                                  </span>
                                  <span className={isMe ? 'text-slate-900/75' : 'text-slate-400'}>
                                    Voice Note
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : msg.isDeleted || msg.text === 'This message was deleted' ? (
                            <p className="text-[13px] italic text-slate-400 flex items-center gap-1.5 py-0.5">
                              <Ban className="w-3.5 h-3.5 text-slate-500" />
                              <span>This message was deleted</span>
                            </p>
                          ) : (
                            <p
                              className={`text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${
                                isMe ? 'font-medium text-slate-950' : 'text-slate-100'
                              }`}
                            >
                              {msg.text}
                            </p>
                          )}

                          {/* Bottom-Right Timestamp + Signature AZ OVERVERSE Read Ticks */}
                          <div className="mt-1.5 flex items-center justify-end gap-1.5">
                            {isMe ? (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-950/90 border border-black/30 px-1.5 py-0.5 shadow-sm">
                                <span className="text-[10px] text-slate-300 tabular-nums leading-none">
                                  {msg.timestamp}
                                </span>
                                <MessageTicks
                                  status={msg.status || 'sent'}
                                  isVIPSender={isCurrentUserVIP}
                                  isReadByVIP={readByVIP}
                                  readerName={readerDisplayName}
                                  justTransitionedToRead={msg.justRead}
                                />
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 tabular-nums leading-none">
                                {msg.timestamp}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Message Action Menu Trigger (3 Dots) */}
                        <div
                          className={`absolute top-1 ${
                            isMe ? '-left-8' : '-right-8'
                          } flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition z-20`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMessageMenuId((curr) => (curr === msg.id ? null : msg.id));
                              setActiveReactionPickerMsgId(null);
                            }}
                            className="h-6 w-6 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-amber-400 flex items-center justify-center shadow"
                            aria-label="Message options"
                            title="Message options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* WhatsApp-Style Message Context Menu */}
                        <AnimatePresence>
                          {activeMessageMenuId === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.92, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.92, y: -4 }}
                              transition={{ duration: 0.12 }}
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute top-8 ${
                                isMe ? 'right-0' : 'left-0'
                              } z-40 w-44 rounded-2xl bg-slate-900/98 border border-slate-700 p-1.5 shadow-2xl space-y-1 text-xs`}
                            >
                              {/* Copy message text */}
                              {!msg.isDeleted && msg.text !== 'This message was deleted' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(msg.text);
                                    setActiveMessageMenuId(null);
                                    showTransientBanner('Message text copied');
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium text-slate-200 hover:bg-slate-800 transition"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Copy</span>
                                </button>
                              )}

                              {/* Own message: Delete for Everyone / Delete for Me */}
                              {isMe ? (
                                <>
                                  {!msg.isDeleted && msg.text !== 'This message was deleted' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMessageMenuId(null);
                                        setMessageToDelete({ id: msg.id, type: 'everyone' });
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium text-red-300 hover:bg-red-500/15 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                      <span>Delete for Everyone</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      setMessageToDelete({ id: msg.id, type: 'me' });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium text-slate-300 hover:bg-slate-800 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Delete for Me</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Other user's message: Report & Block */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      setReportingMessage(msg);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium text-amber-300 hover:bg-amber-500/15 transition"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Report Message</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      handleToggleBlockContact();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium text-red-300 hover:bg-red-500/15 transition"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-red-400" />
                                    <span>{isContactBlocked ? 'Unblock User' : 'Block User'}</span>
                                  </button>
                                </>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Quick Emoji Reaction Trigger Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReactionPickerMsgId((curr) =>
                              curr === msg.id ? null : msg.id
                            );
                            setActiveMessageMenuId(null);
                          }}
                          className={`absolute top-1/2 -translate-y-1/2 ${
                            isMe ? '-left-8' : '-right-8'
                          } h-7 w-7 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-400 hover:text-amber-400 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition`}
                          aria-label="React to message"
                          title="Add reaction"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>

                        {/* Popover Reaction Picker */}
                        <AnimatePresence>
                          {activeReactionPickerMsgId === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 4 }}
                              transition={{ duration: 0.12 }}
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute -top-11 ${
                                isMe ? 'right-0' : 'left-0'
                              } z-30 flex items-center gap-1 rounded-full bg-slate-900/98 border border-slate-700 px-2.5 py-1 shadow-2xl`}
                            >
                              {QUICK_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    onToggleReaction(conversation.id, msg.id, emoji);
                                    setActiveReactionPickerMsgId(null);
                                  }}
                                  className="h-7 w-7 rounded-full hover:bg-slate-800 flex items-center justify-center text-sm hover:scale-125 transition-transform"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Reaction Pills Under Bubble */}
                      {reactionEntries.length > 0 && (
                        <div
                          className={`flex items-center flex-wrap gap-1 -mt-1.5 z-10 ${
                            isMe ? 'pr-2 justify-end' : 'pl-2 justify-start'
                          }`}
                        >
                          {reactionEntries.map(([emoji, count]) => {
                            const isMine = msg.userReaction === emoji;
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => onToggleReaction(conversation.id, msg.id, emoji)}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] shadow transition ${
                                  isMine
                                    ? 'bg-slate-900 border border-amber-400/70 text-amber-300'
                                    : 'bg-slate-900/95 border border-slate-700/80 text-slate-200 hover:border-slate-500'
                                }`}
                              >
                                <span>{emoji}</span>
                                {count > 1 && (
                                  <span className="text-[10px] font-mono font-semibold">
                                    {count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {/* Live Peer Typing Bubble */}
          <AnimatePresence>
            {isPeerTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex items-start"
              >
                <div className="rounded-2xl rounded-tl-none bg-[#1e293b] border border-slate-700/60 px-4 py-3 shadow-md flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/80 animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/60 animate-bounce" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      <AnimatePresence>
        {showScrollBottomBtn && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            onClick={() => scrollToBottom('smooth')}
            className="absolute right-4 bottom-24 z-30 h-10 w-10 rounded-full bg-slate-900/95 border border-slate-700 text-amber-400 shadow-xl flex items-center justify-center hover:bg-slate-800"
            aria-label="Scroll to latest messages"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 3. BOTTOM STICKY INPUT BAR (Emoji + Attach + Auto-Expanding Input + Mic/Send Morph) */}
      <footer className="shrink-0 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-2 sm:px-4 pt-2 safe-bottom-inset">
        <div className="mx-auto max-w-4xl">
          {/* Staged Image Attachment Preview */}
          <AnimatePresence>
            {stagedImage && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mb-2 flex items-center justify-between gap-3 rounded-2xl bg-[#1e293b] border border-amber-500/40 p-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={stagedImage.url}
                    alt={stagedImage.title}
                    className="h-12 w-12 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-300 truncate">
                      Ready to send artwork
                    </p>
                    <p className="text-[11px] text-slate-300 truncate">{stagedImage.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStagedImage(null)}
                  className="h-9 w-9 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center shrink-0"
                  aria-label="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji Drawer */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="mb-2 rounded-2xl bg-slate-900 border border-slate-800 p-3 shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    OVERVERSE Emojis & Reactions
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-0.5"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-8 sm:grid-cols-12 gap-1">
                  {EMOJI_DRAWER_ITEMS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setInputText((prev) => `${prev}${emoji}`);
                        textareaRef.current?.focus();
                      }}
                      className="h-9 rounded-xl hover:bg-slate-800 flex items-center justify-center text-lg active:scale-95 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attach Menu (Upload Device Photo or Share Studio Manga Panel) */}
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="mb-2 rounded-2xl bg-slate-900 border border-slate-800 p-3 shadow-xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Attach Photo or Studio Panel
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(false)}
                    className="text-slate-400 hover:text-white p-1"
                    aria-label="Close attachment menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload from Device</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {STUDIO_ARTWORK_ATTACHMENTS.map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        setStagedImage({ url: art.url, title: art.title });
                        setShowAttachMenu(false);
                      }}
                      className="group rounded-xl overflow-hidden border border-slate-800 hover:border-amber-400 bg-slate-950 text-left transition"
                    >
                      <img
                        src={art.url}
                        alt={art.title}
                        className="h-16 w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="block px-2 py-1 text-[10px] font-medium text-slate-300 truncate">
                        {art.title}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* If user is blocked, render Blocked Banner instead of text/voice input */}
          {isContactBlocked ? (
            <div className="py-2.5 px-4 rounded-2xl bg-slate-900 border border-red-500/30 flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2 text-xs text-red-300">
                <Ban className="w-4 h-4 shrink-0 text-red-400" />
                <span>You blocked this user. Unblock to send and receive messages.</span>
              </div>
              <button
                type="button"
                onClick={handleToggleBlockContact}
                className="px-3 py-1.5 rounded-xl bg-red-500 text-slate-950 font-bold text-xs hover:bg-red-400 transition shrink-0"
              >
                Unblock
              </button>
            </div>
          ) : isRecordingVoice ? (
            <div className="flex items-center justify-between gap-2 pb-1">
              <button
                type="button"
                onClick={() => setIsRecordingVoice(false)}
                className="min-h-[46px] min-w-[46px] rounded-full bg-slate-900 border border-slate-800 text-red-400 hover:bg-red-500/15 flex items-center justify-center transition"
                aria-label="Cancel voice recording"
                title="Cancel"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex-1 flex items-center justify-between gap-3 rounded-full bg-[#1e293b] border border-red-500/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-mono font-bold text-white tabular-nums">
                    {formatSeconds(recordingSeconds)}
                  </span>
                </div>
                <span className="text-xs text-slate-300 truncate">
                  Recording voice note...
                </span>
                <div className="hidden sm:flex items-center gap-1">
                  <span className="w-1 h-3 rounded-full bg-amber-400 animate-pulse" />
                  <span className="w-1 h-4 rounded-full bg-amber-400 animate-pulse" />
                  <span className="w-1 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="w-1 h-5 rounded-full bg-amber-400 animate-pulse" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendRecordedVoice}
                className="min-h-[46px] min-w-[46px] rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF8C00] text-slate-950 font-black shadow-lg shadow-amber-500/25 flex items-center justify-center active:scale-95 transition"
                aria-label="Send voice note"
                title="Send voice note"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-2 pb-1">
              {/* Left + Center Rounded Input Pill */}
              <div className="flex-1 flex items-end gap-1 rounded-3xl bg-[#1e293b] border border-slate-700/80 focus-within:border-amber-400/80 px-2 py-1 transition-colors">
                {/* Left: Emoji Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker((prev) => !prev);
                    setShowAttachMenu(false);
                  }}
                  className={`min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center transition shrink-0 ${
                    showEmojiPicker
                      ? 'text-amber-400 bg-amber-500/15'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                  aria-label="Toggle emoji picker"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Center: Auto-expanding Textarea (up to 4 lines) */}
                <textarea
                  ref={textareaRef}
                  rows={computedTextareaRows}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleDispatchSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent py-2.5 px-1 text-sm text-white placeholder-slate-400 resize-none max-h-28 overflow-y-auto focus:outline-none leading-snug"
                />

                {/* Left/Inner: Attach Paperclip Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu((prev) => !prev);
                    setShowEmojiPicker(false);
                  }}
                  className={`min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center transition shrink-0 ${
                    showAttachMenu
                      ? 'text-amber-400 bg-amber-500/15'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                  aria-label="Attach photo or manga panel"
                  title="Attach"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>

              {/* Right: Mic Button -> Morphs smoothly into Gold Send Button when typing */}
              <div className="shrink-0">
                <AnimatePresence mode="wait" initial={false}>
                  {hasTypedContent ? (
                    <motion.button
                      key="send-btn"
                      type="button"
                      initial={{ scale: 0.75, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.75, opacity: 0 }}
                      transition={{ duration: 0.13 }}
                      onClick={handleDispatchSend}
                      className="min-h-[48px] min-w-[48px] rounded-full bg-gradient-to-br from-[#FFD700] via-amber-400 to-[#FF8C00] text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:brightness-105 active:scale-95 transition"
                      aria-label="Send message"
                    >
                      <Send className="w-5 h-5 ml-0.5" />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="mic-btn"
                      type="button"
                      initial={{ scale: 0.75, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.75, opacity: 0 }}
                      transition={{ duration: 0.13 }}
                      onClick={() => {
                        setShowEmojiPicker(false);
                        setShowAttachMenu(false);
                        setIsRecordingVoice(true);
                      }}
                      className="min-h-[48px] min-w-[48px] rounded-full bg-gradient-to-br from-[#FFD700] via-amber-400 to-[#FF8C00] text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-95 transition"
                      aria-label="Record voice note"
                      title="Record voice note"
                    >
                      <Mic className="w-5 h-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* CONTACT / GROUP INFO SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {showContactInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowContactInfo(false)}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 p-5 overflow-y-auto space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">
                  {conversation.isGroup ? 'Group Info' : 'Contact Info'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowContactInfo(false)}
                  className="min-h-[40px] min-w-[40px] rounded-full bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-2.5 pt-2">
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  onError={(e) => {
                    e.currentTarget.src = conversation.fallbackAvatar;
                  }}
                  className={`h-24 w-24 rounded-full object-cover border-2 ${
                    isRecipientVIP ? 'border-amber-400' : 'border-slate-700'
                  }`}
                />
                <div className="flex items-center gap-1.5">
                  <h4 className="text-lg font-bold text-white">{conversation.name}</h4>
                  {isRecipientVIP && <span>✨</span>}
                  {isRecipientVIP && <ShieldCheck className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-xs text-amber-400 font-medium">{conversation.role}</p>
                <p className="text-xs text-slate-400">{conversation.handle}</p>

                {/* Read Receipt Status Badge Explanation */}
                <div
                  className={`mt-2 rounded-xl px-3.5 py-2 text-xs font-semibold border ${
                    isRecipientVIP
                      ? 'bg-amber-500/10 border-amber-500/35 text-amber-300'
                      : 'bg-red-500/10 border-red-500/35 text-red-300'
                  }`}
                >
                  {isRecipientVIP
                    ? '✨ Gold VIP Verified Creator — Gold Read Ticks Active'
                    : '✓✓ Guest Reader — AZ OVERVERSE Red Read Ticks Active'}
                </div>

                {onToggleFollow && !conversation.isGroup && (
                  <button
                    type="button"
                    onClick={() => onToggleFollow(conversation.id)}
                    className={`mt-2 min-h-[42px] px-5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isFollowed
                        ? 'bg-slate-900 border border-slate-700 text-slate-200'
                        : 'bg-gradient-to-r from-[#FFD700] to-[#FF8C00] text-slate-950 font-black'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Following Creator</span>
                      </>
                    ) : (
                      <span>+ Follow {getFirstReaderName(conversation.name)}</span>
                    )}
                  </button>
                )}

                {/* Safety Actions: Block & Report */}
                {!conversation.isGroup && (
                  <div className="w-full flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleToggleBlockContact}
                      className={`flex-1 min-h-[40px] px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        isContactBlocked
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                          : 'bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25'
                      }`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>{isContactBlocked ? 'Unblock User' : 'Block User'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReportingUser(true)}
                      className="min-h-[40px] px-3.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  About
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{conversation.bio}</p>
              </div>

              {sharedImagesInThread.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Media Shared ({sharedImagesInThread.length})</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {sharedImagesInThread.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setLightboxImage({
                            url: m.imageUrl!,
                            caption: m.imageCaption || m.text,
                          })
                        }
                        className="rounded-xl overflow-hidden border border-slate-800 hover:border-amber-400 aspect-square"
                      >
                        <img
                          src={m.imageUrl}
                          alt={m.imageCaption || 'Shared'}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VOICE / VIDEO CALL OVERLAY */}
      <AnimatePresence>
        {activeCallMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-[#0f172a] to-black flex flex-col items-center justify-between py-12 px-6 text-center safe-top-inset safe-bottom-inset"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  AZ OVERVERSE {activeCallMode === 'video' ? 'Studio Video Call' : 'Encrypted Voice Call'}
                </span>
              </span>
              <h3 className="text-2xl font-bold text-white pt-2">
                {conversation.name} {isRecipientVIP ? '✨' : ''}
              </h3>
              <p className="text-sm text-emerald-400 font-medium tabular-nums">
                {callSeconds < 2 ? 'Ringing...' : formatSeconds(callSeconds - 2)}
              </p>
            </div>

            <div className="relative flex items-center justify-center my-6">
              <span className="absolute h-44 w-44 rounded-full border border-amber-400/25 animate-ping" />
              <span className="absolute h-36 w-36 rounded-full border border-amber-400/40" />
              {activeCallMode === 'video' && !isCallCameraOff ? (
                <div className="relative h-56 w-44 sm:h-64 sm:w-52 rounded-3xl overflow-hidden border-2 border-amber-400/70 shadow-2xl">
                  <img
                    src={conversation.avatar}
                    alt={conversation.name}
                    onError={(e) => {
                      e.currentTarget.src = conversation.fallbackAvatar;
                    }}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 rounded-lg bg-slate-950/85 border border-slate-700 px-2 py-1 text-[10px] text-amber-300 font-semibold">
                    HD Studio Feed
                  </div>
                </div>
              ) : (
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  onError={(e) => {
                    e.currentTarget.src = conversation.fallbackAvatar;
                  }}
                  className="relative h-32 w-32 rounded-full object-cover border-2 border-amber-400 shadow-2xl"
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsCallMicMuted((m) => !m)}
                className={`h-13 w-13 rounded-full flex items-center justify-center border transition ${
                  isCallMicMuted
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
                }`}
                aria-label="Toggle mute microphone"
              >
                <MicOff className="w-5 h-5" />
              </button>

              {activeCallMode === 'video' && (
                <button
                  type="button"
                  onClick={() => setIsCallCameraOff((c) => !c)}
                  className={`h-13 w-13 rounded-full flex items-center justify-center border transition ${
                    isCallCameraOff
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
                  }`}
                  aria-label="Toggle camera"
                >
                  <CameraOff className="w-5 h-5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCallSpeakerOn((s) => !s)}
                className={`h-13 w-13 rounded-full flex items-center justify-center border transition ${
                  isCallSpeakerOn
                    ? 'bg-slate-800 text-amber-400 border-amber-400/50'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700'
                }`}
                aria-label="Toggle speaker"
              >
                <Volume2 className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveCallMode(null)}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-95 transition"
                aria-label="End call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMAGE LIGHTBOX VIEWER */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-5 right-5 h-11 w-11 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-800"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption || 'Artwork preview'}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain border border-slate-800 shadow-2xl"
            />
            {lightboxImage.caption && (
              <p className="mt-3 text-xs sm:text-sm font-medium text-slate-200 text-center max-w-lg">
                {lightboxImage.caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE MESSAGE CONFIRMATION DIALOG ("Are you sure?") */}
      <AnimatePresence>
        {messageToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMessageToDelete(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Delete Message?</h4>
                <p className="text-xs text-slate-300">
                  {messageToDelete.type === 'everyone'
                    ? 'Are you sure? This message will be deleted for everyone in this chat.'
                    : 'Are you sure? This message will be removed from your chat history.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMessageToDelete(null)}
                  className="flex-1 min-h-[42px] rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { id, type } = messageToDelete;
                    if (type === 'everyone') {
                      onDeleteMessageForEveryone?.(conversation.id, id);
                      showTransientBanner('Message deleted for everyone.');
                    } else {
                      onDeleteMessageForMe?.(conversation.id, id);
                      showTransientBanner('Message deleted for you.');
                    }
                    setMessageToDelete(null);
                  }}
                  className="flex-1 min-h-[42px] rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REPORT MESSAGE / USER MODAL */}
      <ReportModal
        isOpen={Boolean(reportingMessage || isReportingUser)}
        onClose={() => {
          setReportingMessage(null);
          setIsReportingUser(false);
        }}
        reportedUserId={conversation.id}
        reportedUserName={conversation.name}
        messageId={reportingMessage?.id}
        messageText={reportingMessage?.text}
        onReportSubmitted={() => {
          showTransientBanner('Thanks, we received your report. Our team will review it.');
        }}
      />
    </motion.div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(chatContent, document.body);
  }
  return chatContent;
};

export default FullChatView;
