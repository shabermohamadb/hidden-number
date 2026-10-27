// server/tests/profileProgression.test.js
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { ProfileManager, ACHIEVEMENTS } from '../game/ProfileManager.js';

describe('Player Profile, Progression & Social System', () => {
  let pm;

  beforeEach(() => {
    pm = new ProfileManager(null);
  });

  it('initializes a new profile with level 1, 0 XP, and default cosmetics', () => {
    const playerId = 'player-test-001';
    const profile = pm.getOrCreateProfile(playerId, 'CipherKnight', 'avatar-2');

    assert.strictEqual(profile.playerId, playerId);
    assert.strictEqual(profile.username, 'CipherKnight');
    assert.strictEqual(profile.avatar, 'avatar-2');
    assert.strictEqual(profile.level, 1);
    assert.strictEqual(profile.xp, 0);
    assert.strictEqual(profile.stats.gamesPlayed, 0);
    assert.strictEqual(profile.stats.wins, 0);
    assert.strictEqual(profile.stats.winRate, 0);
    assert.strictEqual(profile.unlockedCosmetics.frames.includes('frame-bronze'), true);
    assert.strictEqual(profile.achievements.length, ACHIEVEMENTS.length);
  });

  it('guarantees username uniqueness when duplicate nicknames are given', () => {
    const p1 = pm.getOrCreateProfile('p1', 'Oracle');
    const p2 = pm.getOrCreateProfile('p2', 'Oracle');

    assert.strictEqual(p1.username, 'Oracle');
    assert.notStrictEqual(p2.username, 'Oracle');
    assert.strictEqual(p2.username.startsWith('Oracle_'), true);
  });

  it('validates username updates (length, charset, cooldown, and uniqueness)', () => {
    const playerId = 'player-validator';
    pm.getOrCreateProfile(playerId, 'OriginalName');

    // Reject too short
    const resShort = pm.updateProfile(playerId, { username: 'ab' });
    assert.strictEqual(resShort.success, false);
    assert.strictEqual(resShort.error.includes('3 and 20'), true);

    // Reject special characters
    const resChars = pm.updateProfile(playerId, { username: 'bad name!#$' });
    assert.strictEqual(resChars.success, false);
    assert.strictEqual(resChars.error.includes('letters, numbers'), true);

    // Valid update
    const resValid = pm.updateProfile(playerId, { username: 'NewValidName' });
    assert.strictEqual(resValid.success, true);
    assert.strictEqual(resValid.profile.username, 'NewValidName');

    // Reject on cooldown
    const resCooldown = pm.updateProfile(playerId, { username: 'AnotherName' });
    assert.strictEqual(resCooldown.success, false);
    assert.strictEqual(resCooldown.error.includes('Username can be changed again'), true);
  });

  it('validates custom avatar image uploads (format and size guard)', () => {
    const playerId = 'player-avatar-test';
    pm.getOrCreateProfile(playerId);

    // Reject invalid format
    const resInvalid = pm.updateProfile(playerId, { customAvatar: 'not-a-data-uri' });
    assert.strictEqual(resInvalid.success, false);

    // Reject unsupported mime type
    const resMime = pm.updateProfile(playerId, { customAvatar: 'data:image/svg+xml;base64,PHN2Zz4=' });
    assert.strictEqual(resMime.success, false);

    // Accept valid PNG base64
    const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const resValid = pm.updateProfile(playerId, { customAvatar: validPng });
    assert.strictEqual(resValid.success, true);
    assert.strictEqual(resValid.profile.customAvatar, validPng);
  });

  it('correctly calculates XP and level curves', () => {
    const l1 = ProfileManager.calculateLevelInfo(0);
    assert.strictEqual(l1.level, 1);
    assert.strictEqual(l1.progressPercent, 0);

    const needed1 = ProfileManager.xpNeededForLevel(1);
    assert.strictEqual(needed1, 100);

    // 100 XP brings user to Level 2
    const l2 = ProfileManager.calculateLevelInfo(100);
    assert.strictEqual(l2.level, 2);
    assert.strictEqual(l2.currentLevelXp, 0);

    // 200 XP brings user into Level 2 progress
    const l2Half = ProfileManager.calculateLevelInfo(200);
    assert.strictEqual(l2Half.level, 2);
    assert.strictEqual(l2Half.currentLevelXp, 100);
    assert.strictEqual(l2Half.progressPercent > 0, true);
  });

  it('records verified match results, awards XP & unlocks achievements', () => {
    const p1Id = 'player-match-1';
    const p2Id = 'player-match-2';

    pm.getOrCreateProfile(p1Id, 'WinnerPlayer');
    pm.getOrCreateProfile(p2Id, 'RunnerUp');

    const matchId = crypto.randomUUID();
    const matchData = {
      matchId,
      roomCode: 'ARENA1',
      results: {
        roundScores: [
          {
            playerId: p1Id,
            nickname: 'WinnerPlayer',
            avatar: 'avatar-1',
            cumulativeScore: 120,
            isExact: true,
            accuracy: 100,
            difference: 0
          },
          {
            playerId: p2Id,
            nickname: 'RunnerUp',
            avatar: 'avatar-2',
            cumulativeScore: 85,
            isExact: false,
            accuracy: 85,
            difference: 5
          }
        ]
      }
    };

    const res = pm.recordMatchResult(matchData);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.processedPlayers.length, 2);

    const p1Updated = pm.getProfile(p1Id);
    assert.strictEqual(p1Updated.stats.gamesPlayed, 1);
    assert.strictEqual(p1Updated.stats.wins, 1);
    assert.strictEqual(p1Updated.stats.winRate, 100);
    assert.strictEqual(p1Updated.stats.exactGuesses, 1);
    assert.strictEqual(p1Updated.stats.totalPoints, 120);

    // Winner XP: base 60 + win 120 + exact 40 = 220 XP + First Win (100) + Exact Deduction (150) = 470 XP
    assert.strictEqual(p1Updated.xp >= 220, true);
    assert.strictEqual(p1Updated.level >= 2, true);

    // Achievement unlock verification
    const firstWinAch = p1Updated.achievements.find(a => a.id === 'FIRST_WIN');
    assert.strictEqual(firstWinAch.unlocked, true);

    const exactAch = p1Updated.achievements.find(a => a.id === 'PERFECT_GUESS');
    assert.strictEqual(exactAch.unlocked, true);

    // Frame cosmetic rewarded from PERFECT_GUESS
    assert.strictEqual(p1Updated.unlockedCosmetics.frames.includes('frame-gilded-laurel'), true);
  });

  it('IDEMPOTENCY: prevents duplicate match recording from double-counting stats or rewards', () => {
    const pId = 'player-idempotent';
    pm.getOrCreateProfile(pId, 'Steadfast');

    const matchId = 'static-match-uuid-1234';
    const matchPayload = {
      matchId,
      roomCode: 'TEST99',
      results: {
        roundScores: [
          {
            playerId: pId,
            nickname: 'Steadfast',
            avatar: 'avatar-1',
            cumulativeScore: 100,
            isExact: false,
            accuracy: 90
          }
        ]
      }
    };

    // First call
    pm.recordMatchResult(matchPayload);
    const prof1 = pm.getProfile(pId);
    const xpAfterFirst = prof1.xp;
    const gamesAfterFirst = prof1.stats.gamesPlayed;

    // Second call with same matchId
    pm.recordMatchResult(matchPayload);
    const prof2 = pm.getProfile(pId);

    assert.strictEqual(prof2.stats.gamesPlayed, gamesAfterFirst);
    assert.strictEqual(prof2.xp, xpAfterFirst);
    assert.strictEqual(prof2.matchHistory.length, 1);
  });

  it('handles the complete social flow (friend requests, accepts, lists, search and blocking)', () => {
    const pA = 'user-alice';
    const pB = 'user-bob';

    pm.getOrCreateProfile(pA, 'AliceDeduction');
    pm.getOrCreateProfile(pB, 'BobSolver');

    // 1. Search player
    const searchRes = pm.searchPlayers('Alice', pB);
    assert.strictEqual(searchRes.length, 1);
    assert.strictEqual(searchRes[0].playerId, pA);

    // 2. Cannot friend self
    const selfReq = pm.sendFriendRequest(pA, pA);
    assert.strictEqual(selfReq.success, false);

    // 3. Send friend request
    const sendReq = pm.sendFriendRequest(pA, pB);
    assert.strictEqual(sendReq.success, true);
    assert.strictEqual(sendReq.status, 'pending');

    // Check pending requests for B
    const requestsB = pm.getFriendRequests(pB);
    assert.strictEqual(requestsB.incoming.length, 1);
    assert.strictEqual(requestsB.incoming[0].playerId, pA);

    // 4. Accept friend request
    const acceptRes = pm.respondFriendRequest(pB, pA, true);
    assert.strictEqual(acceptRes.success, true);
    assert.strictEqual(acceptRes.status, 'accepted');

    // Both are now friends
    assert.strictEqual(pm.areFriends(pA, pB), true);
    const friendsA = pm.getFriendsList(pA);
    assert.strictEqual(friendsA.length, 1);
    assert.strictEqual(friendsA[0].playerId, pB);

    // 5. Block player removes friendship
    const blockRes = pm.blockPlayer(pB, pA);
    assert.strictEqual(blockRes.success, true);
    assert.strictEqual(pm.areFriends(pA, pB), false);
  });

  it('enforces public profile privacy settings (public, friends_only, private)', () => {
    const pOwner = 'owner-id';
    const pStranger = 'stranger-id';
    const pFriend = 'friend-id';

    pm.getOrCreateProfile(pOwner, 'SecretAgent');
    pm.getOrCreateProfile(pStranger, 'CuriousPlayer');
    pm.getOrCreateProfile(pFriend, 'AlliedPlayer');

    // Set friendship with pFriend
    pm.sendFriendRequest(pOwner, pFriend);
    pm.respondFriendRequest(pFriend, pOwner, true);

    // Case 1: Public profile (default)
    const pubView = pm.getPublicProfile(pStranger, pOwner);
    assert.strictEqual(pubView.username, 'SecretAgent');
    assert.strictEqual(typeof pubView.stats, 'object');
    assert.strictEqual(pubView.isPrivate, undefined);

    // Case 2: Friends Only
    pm.updateProfile(pOwner, { settings: { visibility: 'friends_only' } });
    const friendsOnlyStranger = pm.getPublicProfile(pStranger, pOwner);
    assert.strictEqual(friendsOnlyStranger.isFriendsOnly, true);
    assert.strictEqual(friendsOnlyStranger.stats, undefined);

    const friendsOnlyFriend = pm.getPublicProfile(pFriend, pOwner);
    assert.strictEqual(friendsOnlyFriend.isFriendsOnly, undefined);
    assert.strictEqual(typeof friendsOnlyFriend.stats, 'object');

    // Case 3: Private
    pm.updateProfile(pOwner, { settings: { visibility: 'private' } });
    const privateView = pm.getPublicProfile(pStranger, pOwner);
    assert.strictEqual(privateView.isPrivate, true);
    assert.strictEqual(privateView.stats, undefined);
  });
});
