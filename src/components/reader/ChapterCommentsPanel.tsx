import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Eye,
  EyeOff,
  Heart,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  CommentSortOption,
  MAX_CHAPTER_COMMENT_LENGTH,
  ThreadedCommentNode,
  getPreferredReaderCommentName,
  setPreferredReaderCommentName,
  useChapterComments,
} from '../../services/chapterCommentService';

export interface ChapterCommentsPanelProps {
  mangaId: string;
  mangaTitle: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle?: string;
  currentPageNumber?: number;
  totalPages?: number;
  userBadge?: string;
  variant?: 'drawer' | 'inline';
  onClose?: () => void;
  onJumpToPage?: (zeroBasedPageIndex: number) => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

interface CommentNodeItemProps {
  node: ThreadedCommentNode;
  activeReplyId: string | null;
  onToggleReplyComposer: (node: ThreadedCommentNode) => void;
  onSubmitReply: (
    parent: ThreadedCommentNode,
    text: string,
    isSpoiler: boolean
  ) => Promise<boolean>;
  onToggleLike: (commentId: string) => void;
  onEditComment: (commentId: string, text: string, isSpoiler: boolean) => Promise<void>;
  onDeleteComment: (commentId: string) => void;
  onJumpToPage?: (zeroBasedPageIndex: number) => void;
  justPostedId: string | null;
}

const CommentNodeItem: React.FC<CommentNodeItemProps> = ({
  node,
  activeReplyId,
  onToggleReplyComposer,
  onSubmitReply,
  onToggleLike,
  onEditComment,
  onDeleteComment,
  onJumpToPage,
  justPostedId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyIsSpoiler, setReplyIsSpoiler] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(node.text);
  const [editSpoiler, setEditSpoiler] = useState(node.isSpoiler);

  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isReplyingHere = activeReplyId === node.id;
  const hasReplies = node.replies.length > 0;
  const userInitial = (node.authorName || 'R').trim().charAt(0).toUpperCase() || 'R';

  useEffect(() => {
    if (isReplyingHere) {
      setIsCollapsed(false);
      const timer = window.setTimeout(() => {
        replyTextareaRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(timer);
    }
  }, [isReplyingHere]);

  const handleReplyFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      const ok = await onSubmitReply(node, replyText, replyIsSpoiler);
      if (ok) {
        setReplyText('');
        setReplyIsSpoiler(false);
        setIsCollapsed(false);
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;
    await onEditComment(node.id, editText, editSpoiler);
    setIsEditing(false);
  };

  return (
    <div
      id={`chapter-comment-${node.id}`}
      className={`relative ${
        justPostedId === node.id ? 'bg-amber-500/[0.06] rounded-xl -mx-2 px-2 py-1 transition-colors' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Left Avatar + Continuous 1px Thread Guide Line */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className={`flex items-center justify-center rounded-full font-bold select-none ${
              node.depth === 0
                ? 'h-8 w-8 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'h-6 w-6 text-[11px] bg-slate-800 text-slate-200 border border-slate-700'
            }`}
            aria-hidden="true"
          >
            {userInitial}
          </div>
        </div>

        {/* Right Comment Content Column */}
        <div className="min-w-0 flex-1">
          {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-snug">
            <span className="font-semibold text-white">{node.authorName}</span>

            {node.authorBadge && (
              <>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-[11px] font-medium text-amber-400/90">
                  {node.authorBadge}
                </span>
              </>
            )}

            {typeof node.pageNumber === 'number' && node.pageNumber >= 1 && (
              <>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                {onJumpToPage ? (
                  <button
                    type="button"
                    onClick={() => onJumpToPage(node.pageNumber! - 1)}
                    className="text-[11px] font-mono tabular-nums font-semibold text-cyan-400 hover:text-cyan-300 hover:underline underline-offset-2 transition whitespace-nowrap shrink-0"
                    title={`Jump reader to Page ${node.pageNumber}`}
                  >
                    Pg {node.pageNumber}
                  </button>
                ) : (
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    Pg {node.pageNumber}
                  </span>
                )}
              </>
            )}

            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span
              className="text-[11px] font-mono tabular-nums text-slate-500"
              title={new Date(node.createdAt).toLocaleString()}
            >
              {formatRelativeTime(node.createdAt)}
            </span>

            {node.updatedAt !== node.createdAt && (
              <>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-[10px] text-slate-500">edited</span>
              </>
            )}
          </div>

          {/* Direct @Reply Context Indicator */}
          {node.depth >= 1 && node.replyToUserName && (
            <p className="mt-0.5 text-[11px] text-slate-400">
              Replying to <span className="font-semibold text-amber-300/90">@{node.replyToUserName}</span>
            </p>
          )}

          {/* Body or Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
              <textarea
                value={editText}
                maxLength={MAX_CHAPTER_COMMENT_LENGTH}
                onChange={(e) => setEditText(e.target.value.slice(0, MAX_CHAPTER_COMMENT_LENGTH))}
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setEditSpoiler((s) => !s)}
                  className={`min-h-[36px] inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition whitespace-nowrap shrink-0 ${
                    editSpoiler
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {editSpoiler ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>Spoiler</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono tabular-nums text-slate-500">
                    {editText.length}/{MAX_CHAPTER_COMMENT_LENGTH}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(node.text);
                      setEditSpoiler(node.isSpoiler);
                    }}
                    className="min-h-[36px] rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editText.trim()}
                    className="min-h-[36px] rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 px-3 py-1 text-xs font-bold text-black transition whitespace-nowrap shrink-0"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          ) : node.isSpoiler && !spoilerRevealed ? (
            <button
              type="button"
              onClick={() => setSpoilerRevealed(true)}
              className="mt-1.5 min-h-[40px] w-full text-left rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 px-3 py-2 flex items-center justify-between gap-2 transition group"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300/90">
                <EyeOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>Chapter spoiler hidden · Tap to reveal</span>
              </span>
              <span className="text-[11px] text-slate-400 group-hover:text-white transition whitespace-nowrap shrink-0">
                Show
              </span>
            </button>
          ) : (
            <p className="mt-1 text-[13px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words">
              {node.text}
            </p>
          )}

          {/* Action Toolbar: Like · Reply · Edit/Delete · Collapse Replies */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1 -ml-2">
            <button
              type="button"
              onClick={() => onToggleLike(node.id)}
              aria-label={node.isLikedByCurrentUser ? 'Unlike comment' : 'Like comment'}
              className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition whitespace-nowrap shrink-0 ${
                node.isLikedByCurrentUser
                  ? 'text-rose-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 shrink-0 ${
                  node.isLikedByCurrentUser ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
              <span className="font-mono tabular-nums">
                {node.likesCount > 0 ? node.likesCount : 'Like'}
              </span>
            </button>

            <button
              id={`reply-trigger-btn-${node.id}`}
              type="button"
              onClick={() => onToggleReplyComposer(node)}
              className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap shrink-0 ${
                isReplyingHere
                  ? 'text-amber-300 bg-amber-500/10 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
              <span>{isReplyingHere ? 'Cancel Reply' : 'Reply'}</span>
            </button>

            {node.isOwnComment && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditText(node.text);
                    setEditSpoiler(node.isSpoiler);
                    setIsEditing(true);
                  }}
                  className="min-h-[38px] inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition whitespace-nowrap shrink-0"
                  title="Edit your comment"
                >
                  <Pencil className="w-3 h-3 shrink-0" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteComment(node.id)}
                  className="min-h-[38px] inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition whitespace-nowrap shrink-0"
                  title="Delete your comment"
                >
                  <Trash2 className="w-3 h-3 shrink-0" />
                  <span>Delete</span>
                </button>
              </>
            )}

            {hasReplies && (
              <button
                type="button"
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="min-h-[38px] inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 transition whitespace-nowrap shrink-0 ml-auto sm:ml-1"
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    <span className="tabular-nums">
                      View {node.descendantCount}{' '}
                      {node.descendantCount === 1 ? 'reply' : 'replies'}
                    </span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                    <span className="tabular-nums">
                      Hide {node.descendantCount}{' '}
                      {node.descendantCount === 1 ? 'reply' : 'replies'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Inline Direct Reply Composer */}
          {isReplyingHere && (
            <form
              onSubmit={handleReplyFormSubmit}
              className="mt-2.5 rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-300 truncate">
                  Replying to <span className="font-semibold text-amber-300">@{node.authorName}</span>
                </span>
                <span
                  className={`font-mono tabular-nums shrink-0 ${
                    replyText.length >= MAX_CHAPTER_COMMENT_LENGTH
                      ? 'text-rose-400 font-bold'
                      : replyText.length >= Math.floor(MAX_CHAPTER_COMMENT_LENGTH * 0.85)
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}
                >
                  {replyText.length}/{MAX_CHAPTER_COMMENT_LENGTH}
                </span>
              </div>

              <textarea
                id={`inline-reply-textarea-${node.id}`}
                ref={replyTextareaRef}
                value={replyText}
                maxLength={MAX_CHAPTER_COMMENT_LENGTH}
                onChange={(e) => setReplyText(e.target.value.slice(0, MAX_CHAPTER_COMMENT_LENGTH))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleReplyFormSubmit();
                  }
                }}
                rows={2}
                placeholder={`Write a reply to ${node.authorName}...`}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setReplyIsSpoiler((prev) => !prev)}
                  className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap shrink-0 ${
                    replyIsSpoiler
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {replyIsSpoiler ? (
                    <EyeOff className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>Spoiler</span>
                </button>

                <div className="flex items-center gap-2">
                  {replyText.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyText('');
                        replyTextareaRef.current?.focus();
                      }}
                      className="min-h-[38px] inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
                    >
                      <X className="w-3.5 h-3.5 shrink-0" />
                      <span>Clear</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleReplyComposer(node)}
                    className="min-h-[38px] rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSubmittingReply}
                    className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 px-3.5 py-1 text-xs font-bold text-black transition whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 fill-black shrink-0" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Nested Replies Tree (Subtle 1px Thread Guide Line — Zero Thick Left Borders) */}
          {hasReplies && !isCollapsed && (
            <div className="relative mt-3 pl-4 sm:pl-5 space-y-3.5">
              <div
                aria-hidden="true"
                className="absolute left-0 top-1 bottom-2 w-px bg-slate-800/90"
              />
              {node.replies.map((childReply) => (
                <CommentNodeItem
                  key={childReply.id}
                  node={childReply}
                  activeReplyId={activeReplyId}
                  onToggleReplyComposer={onToggleReplyComposer}
                  onSubmitReply={onSubmitReply}
                  onToggleLike={onToggleLike}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                  onJumpToPage={onJumpToPage}
                  justPostedId={justPostedId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ChapterCommentsPanel: React.FC<ChapterCommentsPanelProps> = ({
  mangaId,
  mangaTitle,
  chapterId,
  chapterNumber,
  chapterTitle,
  currentPageNumber,
  userBadge,
  variant = 'inline',
  onClose,
  onJumpToPage,
}) => {
  const {
    threads,
    totalCount,
    sortBy,
    setSortBy,
    addCommentOrReply,
    toggleLike,
    editComment,
    removeComment,
  } = useChapterComments({
    mangaId,
    chapterId,
    chapterNumber,
    userBadge,
  });

  const [commentText, setCommentText] = useState('');
  const [tagCurrentPage, setTagCurrentPage] = useState(false);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [readerName, setReaderName] = useState<string>(() => getPreferredReaderCommentName());
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [justPostedId, setJustPostedId] = useState<string | null>(null);
  const [isSubmittingRoot, setIsSubmittingRoot] = useState(false);

  const rootComposerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setActiveReplyId(null);
    setErrorBanner(null);
  }, [chapterId]);

  const markRecentlyPosted = useCallback((id?: string) => {
    if (!id) return;
    setJustPostedId(id);
    window.setTimeout(() => {
      setJustPostedId((prev) => (prev === id ? null : prev));
    }, 2200);
  }, []);

  const handleSaveHandle = (nextName: string) => {
    const saved = setPreferredReaderCommentName(nextName);
    setReaderName(saved);
  };

  const handlePostRootComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim() || isSubmittingRoot) return;
    setErrorBanner(null);
    setIsSubmittingRoot(true);
    try {
      const res = await addCommentOrReply({
        text: commentText,
        parentComment: null,
        pageNumber:
          tagCurrentPage && typeof currentPageNumber === 'number' && currentPageNumber >= 1
            ? currentPageNumber
            : undefined,
        isSpoiler,
        authorNameOverride: readerName,
      });

      if (!res.success) {
        setErrorBanner(res.error || 'Could not post comment.');
        return;
      }

      setCommentText('');
      setIsSpoiler(false);
      setTagCurrentPage(false);
      markRecentlyPosted(res.comment?.id);
    } finally {
      setIsSubmittingRoot(false);
    }
  };

  const handleToggleReplyComposer = useCallback((node: ThreadedCommentNode) => {
    setActiveReplyId((prev) => (prev === node.id ? null : node.id));
    setErrorBanner(null);
  }, []);

  const handleSubmitReply = useCallback(
    async (parent: ThreadedCommentNode, text: string, replySpoiler: boolean): Promise<boolean> => {
      setErrorBanner(null);
      const res = await addCommentOrReply({
        text,
        parentComment: parent,
        isSpoiler: replySpoiler,
        authorNameOverride: readerName,
      });
      if (!res.success) {
        setErrorBanner(res.error || 'Could not post reply.');
        return false;
      }
      setActiveReplyId(null);
      markRecentlyPosted(res.comment?.id);
      return true;
    },
    [addCommentOrReply, readerName, markRecentlyPosted]
  );

  const handleEditNode = useCallback(
    async (commentId: string, text: string, nextSpoiler: boolean) => {
      const res = await editComment(commentId, text, nextSpoiler);
      if (!res.success && res.error) {
        setErrorBanner(res.error);
      }
    },
    [editComment]
  );

  const sortOptions: { key: CommentSortOption; label: string }[] = [
    { key: 'top', label: 'Top' },
    { key: 'newest', label: 'Newest' },
    { key: 'oldest', label: 'Oldest' },
  ];

  return (
    <section
      id={
        variant === 'drawer'
          ? 'reader-chapter-comments-drawer-panel'
          : 'reader-chapter-comments-inline-panel'
      }
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      className={
        variant === 'drawer'
          ? 'flex flex-col h-full w-full bg-[#0b0e16] text-white overflow-hidden'
          : 'w-full rounded-2xl border border-slate-800 bg-slate-950/95 p-4 sm:p-6 text-left text-white space-y-5'
      }
    >
      {/* Header */}
      <div
        className={
          variant === 'drawer'
            ? 'flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-800/90 shrink-0'
            : 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/90'
        }
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-white truncate">
              Chapter {chapterNumber} Discussion
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
              ({totalCount})
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {mangaTitle}
            {chapterTitle ? ` · ${chapterTitle}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented Sort Control */}
          <div
            role="tablist"
            aria-label="Sort chapter comments"
            className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-900 border border-slate-800"
          >
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                role="tab"
                aria-selected={sortBy === opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap shrink-0 ${
                  sortBy === opt.key
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {variant === 'drawer' && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chapter comments"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body (in Drawer) or Natural Flow (in Inline) */}
      <div
        className={
          variant === 'drawer'
            ? 'flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5 overscroll-y-contain'
            : 'space-y-5'
        }
      >
        {/* Top-Level Chapter Comment Composer */}
        <form
          onSubmit={handlePostRootComment}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {isEditingHandle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={readerName}
                    maxLength={32}
                    onChange={(e) => setReaderName(e.target.value.slice(0, 32))}
                    onBlur={() => {
                      handleSaveHandle(readerName);
                      setIsEditingHandle(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveHandle(readerName);
                        setIsEditingHandle(false);
                      }
                    }}
                    autoFocus
                    placeholder="Reader name"
                    className="bg-slate-950 border border-amber-500 rounded-lg px-2 py-1 text-xs text-white focus:outline-none w-32 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveHandle(readerName);
                      setIsEditingHandle(false);
                    }}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap shrink-0"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-slate-200 truncate">{readerName}</span>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingHandle(true)}
                    className="text-[11px] text-amber-400/90 hover:text-amber-300 hover:underline underline-offset-2 whitespace-nowrap shrink-0"
                  >
                    Change name
                  </button>
                </div>
              )}
            </div>

            <span
              aria-live="polite"
              className={`text-[11px] font-mono tabular-nums shrink-0 ${
                commentText.length >= MAX_CHAPTER_COMMENT_LENGTH
                  ? 'text-rose-400 font-bold'
                  : commentText.length >= Math.floor(MAX_CHAPTER_COMMENT_LENGTH * 0.85)
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {commentText.length}/{MAX_CHAPTER_COMMENT_LENGTH}
            </span>
          </div>

          <textarea
            id={
              variant === 'drawer'
                ? 'reader-drawer-comment-textarea'
                : 'reader-inline-comment-textarea'
            }
            ref={rootComposerRef}
            value={commentText}
            maxLength={MAX_CHAPTER_COMMENT_LENGTH}
            onChange={(e) => setCommentText(e.target.value.slice(0, MAX_CHAPTER_COMMENT_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handlePostRootComment();
              }
            }}
            rows={2}
            placeholder={`Share your reaction to Chapter ${chapterNumber} or reply to readers below...`}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {typeof currentPageNumber === 'number' && currentPageNumber >= 1 && (
                <button
                  type="button"
                  onClick={() => setTagCurrentPage((prev) => !prev)}
                  className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap shrink-0 ${
                    tagCurrentPage
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="font-mono tabular-nums">Tag Pg {currentPageNumber}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsSpoiler((prev) => !prev)}
                className={`min-h-[38px] inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap shrink-0 ${
                  isSpoiler
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {isSpoiler ? (
                  <EyeOff className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>Spoiler</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                disabled={commentText.length === 0}
                onClick={() => {
                  setCommentText('');
                  rootComposerRef.current?.focus();
                }}
                className="min-h-[38px] inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
                <span>Clear</span>
              </button>

              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingRoot}
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 px-4 py-1 text-xs font-bold text-black transition whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5 fill-black shrink-0" />
                <span>Post Comment</span>
              </button>
            </div>
          </div>

          {errorBanner && (
            <p role="alert" className="text-xs text-rose-400 pt-1">
              {errorBanner}
            </p>
          )}
        </form>

        {/* Threaded Reader Comments List */}
        {threads.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <MessageSquare className="w-7 h-7 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No comments on this chapter yet</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Be the first reader to share a panel reaction or start a theory thread for Chapter{' '}
              {chapterNumber}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {threads.map((rootNode) => (
              <div key={rootNode.id} className="py-4 first:pt-1 last:pb-1">
                <CommentNodeItem
                  node={rootNode}
                  activeReplyId={activeReplyId}
                  onToggleReplyComposer={handleToggleReplyComposer}
                  onSubmitReply={handleSubmitReply}
                  onToggleLike={toggleLike}
                  onEditComment={handleEditNode}
                  onDeleteComment={removeComment}
                  onJumpToPage={onJumpToPage}
                  justPostedId={justPostedId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
