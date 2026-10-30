# AZ OVERVERSE — Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Relationship Mapping

1. **Global Default-Deny Safety Net**: Every path not explicitly matched under `/databases/{database}/documents` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Invariant**: All standard write mutations require `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Isolation (Split Collection Strategy)**:
   - `/users/{userId}` stores ONLY public reader and Creator Studio metadata (`uid`, `displayName`, `avatarUrl`, `bio`, `isCreator`, `penName`, `studioName`, `primaryGenres`, `followersCount`, `followingCount`, `createdAt`, `updatedAt`). No `email` or `role` privilege field is allowed in `/users/{userId}`.
   - `/users/{userId}/private/{docId}` (`docId == 'info'`) stores isolated PII (`uid`, `email`, `createdAt`, `updatedAt`) and is readable strictly by `isOwner(userId) || isAdmin()`.
4. **Master Gate (Relational Sync)**:
   - Every user subcollection (`/users/{userId}/private/{docId}`, `/users/{userId}/reading_progress/{mangaId}`, `/users/{userId}/bookmarks/{mangaId}`, `/users/{userId}/preferences/{prefId}`) verifies parent existence via `exists(/databases/$(database)/documents/users/$(userId))` (or `existsAfter` during atomic initial registration) and enforces `uid == userId`.
   - `/mangas/{mangaId}` creation requires that the author has an active Creator Account (`get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isCreator == true`).
   - `/chapters/{chapterId}` creation requires that `/mangas/$(incoming().mangaId)` exists and `get(/databases/$(database)/documents/mangas/$(incoming().mangaId)).data.authorUid == request.auth.uid`.
5. **Temporal & Immortal Field Integrity**:
   - Every `create` enforces `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - Every `update` enforces `incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time` plus immutable ownership (`uid`, `authorUid`, `senderId`, `createdBy`).
6. **Atomic 1–5 Star Rating & Tamper-Proof Aggregate Invariant (`/ratings/{ratingId}` & `/rating_summaries/{summaryId}`)**:
   - Each user can hold at most one rating per target via deterministic ID `ratingId == summaryId + '__' + request.auth.uid`, with `score in [1, 2, 3, 4, 5]`.
   - `/ratings/{ratingId}` is readable only by its owner (`uid == request.auth.uid`) or `isAdmin()`, preventing cross-user behavioral scraping.
   - `/rating_summaries/{summaryId}` mutations are atomically bound via `existsAfter` / `getAfter` to `/ratings/$(summaryId + '__' + request.auth.uid)` at `request.time`, ensuring `ratingCount` can only increment by 1 on a user's first rating and `ratingSum` must match the exact delta `newScore - oldScore`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Role Escalation (`/users/u1`)**: `{ uid: "u1", displayName: "Attacker", isCreator: true, penName: "Hack", role: "admin", createdAt: SERVER_TIME, updatedAt: SERVER_TIME }` -> Rejected by `hasOnly()` key allowlist.
2. **Unverified Admin Email Spoof**: Authenticated token `{ uid: "spoof1", email: "mlungisenimbhele3@gmail.com", email_verified: false }` attempting admin override -> Rejected by `request.auth.token.email_verified == true`.
3. **PII Leak Attempt (`GET /users/victim/private/info`)**: Authenticated user `u2` reading `victim`'s private email doc -> Rejected by `isOwner(userId) || isAdmin()`.
4. **Identity Spoofing on User Create (`CREATE /users/u1` as `u2`)**: `{ uid: "u1", displayName: "Spoof", isCreator: true, penName: "Pen", createdAt: SERVER_TIME, updatedAt: SERVER_TIME }` -> Rejected by `isOwner(userId)` and `data.uid == request.auth.uid`.
5. **Creator Account Without Pen Name (`CREATE /users/u1`)**: `{ uid: "u1", displayName: "NoPen", isCreator: true, penName: "", createdAt: SERVER_TIME, updatedAt: SERVER_TIME }` -> Rejected by Creator invariant (`!data.isCreator || (data.penName is string && data.penName.size() >= 2)`).
6. **1.5KB ID Poisoning (`CREATE /users/<1500-char-id>`)**: Document ID > 128 chars or containing invalid regex characters -> Rejected by `isValidId()`.
7. **Denial-of-Wallet Oversized Bio (`UPDATE /users/u1`)**: `{ bio: "<10,000 chars>", updatedAt: SERVER_TIME }` -> Rejected by `isValidUserPublicProfile(incoming())` (`bio.size() <= 500`).
8. **Unbounded Genre Array (`UPDATE /users/u1`)**: `{ primaryGenres: ["a","b","c","d","e","f","g","h"], updatedAt: SERVER_TIME }` -> Rejected by `primaryGenres.size() <= 6`.
9. **Client Timestamp Forgery (`CREATE /users/u1`)**: `{ uid: "u1", displayName: "Past", isCreator: false, createdAt: Timestamp(2020,1,1), updatedAt: Timestamp(2020,1,1) }` -> Rejected by `incoming().createdAt == request.time`.
10. **Immutable `createdAt` Tampering (`UPDATE /users/u1`)**: Modifying `createdAt` during profile update -> Rejected by `affectedKeys().hasOnly(...)` and `incoming().createdAt == existing().createdAt`.
11. **Out-of-Bounds Star Rating (`CREATE /ratings/manga_nkosi__u1` with `score: 100` or `score: 0`)**: Rejected by `data.score is int && data.score in [1, 2, 3, 4, 5]`.
12. **Aggregate Rating Inflation (`UPDATE /rating_summaries/manga_nkosi` with `ratingCount: 9999` without atomic `/ratings` write)**: Rejected by `existsAfter` + `getAfter(...).data.updatedAt == request.time` and exact delta arithmetic check.
13. **Unauthorized Direct Message / User Rating Scraping (`LIST /chat_messages` or `LIST /ratings` without owner filter)**: Rejected by Query Enforcer (`existing().uid == request.auth.uid`).

---

## 3. Security Rules Test Runner Specification (`firestore.rules.test.ts`)

```ts
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';

export async function verifyDirtyDozen() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-az-oververse-security',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });

  const alice = testEnv.authenticatedContext('alice_uid', { email: 'alice@example.com', email_verified: true });
  const mallory = testEnv.authenticatedContext('mallory_uid', { email: 'mallory@example.com', email_verified: true });
  const spoofAdmin = testEnv.authenticatedContext('spoof_uid', { email: 'mlungisenimbhele3@gmail.com', email_verified: false });

  // 1. Shadow field role escalation -> PERMISSION_DENIED
  await assertFails(setDoc(doc(alice.firestore(), 'users/alice_uid'), {
    uid: 'alice_uid', displayName: 'Alice', isCreator: true, penName: 'Alice Ink', role: 'admin',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  }));

  // 2. Unverified admin email spoof -> PERMISSION_DENIED
  await assertFails(getDoc(doc(spoofAdmin.firestore(), 'admins/spoof_uid')));

  // Valid Alice Creator Account setup
  await assertSucceeds(setDoc(doc(alice.firestore(), 'users/alice_uid'), {
    uid: 'alice_uid', displayName: 'Alice', avatarUrl: '', bio: 'Creator', isCreator: true,
    penName: 'Alice Ink', studioName: 'Zulu Studio', primaryGenres: ['Action'],
    followersCount: 0, followingCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  }));
  await assertSucceeds(setDoc(doc(alice.firestore(), 'users/alice_uid/private/info'), {
    uid: 'alice_uid', email: 'alice@example.com', createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  }));

  // 3. Mallory reading Alice's isolated PII -> PERMISSION_DENIED
  await assertFails(getDoc(doc(mallory.firestore(), 'users/alice_uid/private/info')));

  // 4. Identity spoofing -> PERMISSION_DENIED
  await assertFails(setDoc(doc(mallory.firestore(), 'users/alice_uid'), {
    uid: 'alice_uid', displayName: 'Mallory', isCreator: true, penName: 'Mallory',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  }));

  // 5. Creator account with empty penName -> PERMISSION_DENIED
  await assertFails(setDoc(doc(mallory.firestore(), 'users/mallory_uid'), {
    uid: 'mallory_uid', displayName: 'Mallory', isCreator: true, penName: '',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  }));

  // 6. Oversized bio DoW attack -> PERMISSION_DENIED
  await assertFails(updateDoc(doc(alice.firestore(), 'users/alice_uid'), {
    bio: 'x'.repeat(2000), updatedAt: serverTimestamp()
  }));

  // 7. Unbounded genres list -> PERMISSION_DENIED
  await assertFails(updateDoc(doc(alice.firestore(), 'users/alice_uid'), {
    primaryGenres: ['1', '2', '3', '4', '5', '6', '7'], updatedAt: serverTimestamp()
  }));

  // 8. Forged client timestamp -> PERMISSION_DENIED
  await assertFails(setDoc(doc(mallory.firestore(), 'users/mallory_uid'), {
    uid: 'mallory_uid', displayName: 'Mallory', isCreator: false,
    createdAt: Timestamp.fromMillis(100000), updatedAt: Timestamp.fromMillis(100000)
  }));

  // 9. Unauthorized DM list query -> PERMISSION_DENIED
  await assertFails(getDocs(collection(mallory.firestore(), 'chat_messages')));

  await testEnv.cleanup();
}
```
