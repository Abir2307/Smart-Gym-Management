import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  createAttendanceEntry,
  createRecord,
  deleteRecord,
  getUserByEmail,
  listAttendanceEntries,
  listRecords,
  query,
  updateUserPassword,
  updateRecord,
} from "./db.js";
import { seedAttendance, seedAttendanceTrend, seedNotifications } from "./data/seed.js";

const resourceNames = ["members", "trainers", "plans", "payments"];

const gameChallenges = [
  ...[
    ["Puzzles", "I have keys but no locks, space but no room. What am I?", "keyboard", "You use me to type."],
    ["Riddles", "What gets wetter the more it dries?", "towel", "It lives near a wash basin."],
    ["Sports", "How many players from one team are on the field in cricket?", "11", "It is more than a football team."],
    ["Cinema", "Which film industry is popularly known as Bollywood?", "hindi cinema", "Its home is Mumbai."],
    ["Travels", "Which direction does the sun rise from?", "east", "It is opposite to west."],
    ["Food", "What is the main ingredient in guacamole?", "avocado", "It is a green fruit."],
    ["Puzzles", "What has a face and two hands but no arms or legs?", "clock", "It tells the time."],
    ["Riddles", "What has many teeth but cannot bite?", "comb", "It helps tidy hair."],
    ["Sports", "How many rings are on the Olympic flag?", "5", "Count the interlocking circles."],
    ["Cinema", "What is the name of the cowboy toy in Toy Story?", "woody", "He wears a cowboy hat."],
    ["Travels", "Which country is famous for the pyramids of Giza?", "egypt", "The Nile flows through it."],
    ["Food", "Which fruit is dried to make a raisin?", "grape", "It grows in bunches."],
    ["Puzzles", "What comes down but never goes up?", "rain", "Look at the sky."],
    ["Riddles", "What can travel around the world while staying in a corner?", "stamp", "It sits on an envelope."],
    ["Sports", "How many points is a free throw worth in basketball?", "1", "It is the smallest normal score."],
    ["Cinema", "Which superhero carries a shield with a star?", "captain america", "He is a Marvel hero."],
    ["Travels", "What is the capital of Japan?", "tokyo", "It is one of the world's largest cities."],
    ["Food", "What colour is a ripe banana?", "yellow", "It is a bright warm colour."],
    ["Puzzles", "What has one eye but cannot see?", "needle", "It is used for sewing."],
    ["Riddles", "What has a thumb and four fingers but is not alive?", "glove", "You wear it on your hand."],
    ["Sports", "How many minutes are in a standard football match, excluding added time?", "90", "It is two halves of 45."],
    ["Cinema", "What is the name of the snowman in Frozen?", "olaf", "He loves warm hugs."],
    ["Travels", "Which monument is located in Agra?", "taj mahal", "It is a famous white marble monument."],
    ["Food", "What is the main ingredient in popcorn?", "corn", "It is a grain that can pop."],
    ["Puzzles", "What has a neck but no head?", "bottle", "It can hold water."],
  ].map(([category, prompt, answer, hint], index) => ({ id: `easy-${index + 1}`, category, difficulty: "Easy", reward: 1, prompt, answer, hint })),
  ...[
    ["Current Affairs", "Which city hosted the 2024 Summer Olympics?", "paris", "It is the capital of France."],
    ["Googlies", "A bat and ball cost Rs 110. The bat costs Rs 100 more. What does the ball cost?", "5", "Let the ball cost x."],
    ["Travels", "The Eiffel Tower is in which city?", "paris", "The same city hosted the 2024 Olympics."],
    ["Sports", "How many players are on a volleyball team on court?", "6", "It is fewer than a cricket team."],
    ["Food", "What is the main ingredient in hummus?", "chickpeas", "A small beige legume."],
    ["Cinema", "Which director made the film Pather Panchali?", "satyajit ray", "He was a celebrated Indian filmmaker."],
    ["Puzzles", "If you have me, you want to share me. If you share me, you no longer have me. What am I?", "secret", "It should stay hidden."],
    ["Riddles", "What word becomes shorter when you add two letters to it?", "short", "The answer describes itself."],
    ["Current Affairs", "Which Indian mission landed near the Moon's south pole in 2023?", "chandrayaan 3", "It was India's third lunar mission."],
    ["Sports", "In tennis, what is the score called at 40-40?", "deuce", "It means the game is tied."],
    ["Travels", "Which river flows through London?", "thames", "It passes the Houses of Parliament."],
    ["Food", "Sushi is traditionally associated with which country?", "japan", "Its capital is Tokyo."],
    ["Cinema", "Which Indian film won the Best Original Song Oscar in 2023?", "rrr", "Its song was Naatu Naatu."],
    ["Googlies", "What is the next number: 2, 6, 12, 20, 30?", "42", "The gaps increase by two each time."],
    ["Puzzles", "A room has four corners, with a cat in each corner. How many cats are there?", "4", "Each corner has one cat."],
    ["Riddles", "What has cities, but no houses; forests, but no trees?", "map", "You can fold it."],
    ["Current Affairs", "Which country won the 2023 Cricket World Cup?", "australia", "They defeated India in the final."],
    ["Sports", "How long is an Olympic swimming pool?", "50 metres", "It is half a hundred metres."],
    ["Travels", "Machu Picchu is in which country?", "peru", "It is in the Andes."],
    ["Food", "What is the key grain in risotto?", "rice", "It is a creamy Italian dish."],
    ["Current Affairs", "Which country hosted the 2024 G20 summit?", "brazil", "It is the largest country in South America."],
    ["Sports", "In which sport is the term love used for zero?", "tennis", "It is played over sets."],
    ["Cinema", "Which Indian actor played the lead in 3 Idiots as Rancho?", "aamir khan", "He is known as Mr Perfectionist."],
    ["Travels", "Which desert covers much of Rajasthan?", "thar", "It is also called the Great Indian Desert."],
    ["Food", "What is the base spirit in a classic mojito?", "rum", "It is often paired with mint and lime."],
  ].map(([category, prompt, answer, hint], index) => ({ id: `medium-${index + 1}`, category, difficulty: "Medium", reward: 2, prompt, answer, hint })),
  ...[
    ["Googlies", "If two workers make two widgets in two minutes, how long for 100 workers to make 100 widgets?", "2 minutes", "Each worker makes one widget in two minutes."],
    ["Puzzles", "A farmer has 17 sheep. All but 9 run away. How many remain?", "9", "Read the phrase carefully."],
    ["Riddles", "What is always in front of you but can never be seen?", "future", "It has not happened yet."],
    ["Sports", "How many squares are on a chessboard?", "64", "It is 8 multiplied by 8."],
    ["Cinema", "Which film won the first Academy Award for Best Picture?", "wings", "It was a silent film from 1927."],
    ["Travels", "What is the only country that borders both the Atlantic and Indian oceans?", "south africa", "It is at the southern tip of Africa."],
    ["Food", "What is the culinary term for cooking in a vacuum-sealed bag?", "sous vide", "The phrase is French for under vacuum."],
    ["Current Affairs", "Which treaty created the European Union?", "maastricht treaty", "It was signed in the Netherlands."],
    ["Googlies", "A clock strikes 6 in 5 seconds. How long does it take to strike 12?", "11 seconds", "There are intervals between strikes."],
    ["Puzzles", "You have 8 balls and one is heavier. Find it in two weighings. What is the first split?", "3 3 2", "Balance groups of three first."],
    ["Riddles", "What disappears as soon as you say its name?", "silence", "It needs quiet to exist."],
    ["Sports", "Which country has won the most men's FIFA World Cups?", "brazil", "They have five titles."],
    ["Cinema", "Who composed the score for the film Interstellar?", "hans zimmer", "He is a German film composer."],
    ["Travels", "What is the deepest lake in the world?", "lake baikal", "It is in Siberia."],
    ["Food", "What is the Scoville scale used to measure?", "spiciness", "Chillies are rated on it."],
    ["Current Affairs", "Which organisation operates the James Webb Space Telescope with NASA?", "esa", "It is Europe's space agency."],
    ["Googlies", "A lily pad doubles every day and fills a lake in 48 days. When is it half full?", "47 days", "Work backwards one day."],
    ["Puzzles", "What is the smallest positive number divisible by every number from 1 to 10?", "2520", "It is the least common multiple."],
    ["Sports", "In cricket, what is a hat-trick?", "three wickets in three balls", "It involves three consecutive dismissals."],
    ["Food", "What is the Japanese word for a traditional tea ceremony?", "chado", "It literally relates to the way of tea."],
    ["Current Affairs", "Which planet was the focus of NASA's Perseverance rover mission?", "mars", "It is known as the Red Planet."],
    ["Sports", "What is the maximum break in snooker?", "147", "It is called a maximum break."],
    ["Cinema", "Who directed the film The Godfather?", "francis ford coppola", "His initials are FFC."],
    ["Travels", "What is the world's largest hot desert?", "sahara", "It is in northern Africa."],
    ["Food", "What is the French cooking term for preparing ingredients before cooking?", "mise en place", "It means everything in its place."],
  ].map(([category, prompt, answer, hint], index) => ({ id: `hard-${index + 1}`, category, difficulty: "Hard", reward: 3, prompt, answer, hint })),
];

const gameDifficulties = ["Easy", "Medium", "Hard"];
const dailyDifficultyLimit = 20;
const dailyQuestionLimit = 60;

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function hashValue(value) {
  return [...value].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function shuffle(items, seed) {
  const result = [...items];
  let value = seed || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const swapIndex = value % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createDailyProfile(profile, userId) {
  const today = dayKey();
  if (profile.dailyDay === today && profile.dailyChallengeIds && profile.activeChallengeIds) {
    return profile;
  }

  const dailyChallengeIds = Object.fromEntries(gameDifficulties.map((difficulty) => [
    difficulty,
    shuffle(gameChallenges.filter((challenge) => challenge.difficulty === difficulty), hashValue(`${userId}-${today}-${difficulty}`))
      .slice(0, dailyDifficultyLimit)
      .map((challenge) => challenge.id),
  ]));
  const activeChallengeIds = [
    ...dailyChallengeIds.Easy.slice(0, 4),
    ...dailyChallengeIds.Medium.slice(0, 3),
    ...dailyChallengeIds.Hard.slice(0, 3),
  ];

  return {
    ...profile,
    dailyDay: today,
    dailyChallengeIds,
    activeChallengeIds,
    dailySolvedIds: [],
    dailySolvedCount: 0,
  };
}

function publicChallenges(profile) {
  const challengeIds = profile.activeChallengeIds ?? [];
  const solved = new Set(profile.dailySolvedIds ?? []);
  return challengeIds.map((id) => gameChallenges.find((challenge) => challenge.id === id))
    .filter(Boolean)
    .map(({ answer, ...challenge }) => ({ ...challenge, completed: solved.has(challenge.id) }));
}

async function getGameRecord(userId) {
  const profiles = await listRecords("game_profiles");
  return profiles.find((item) => item.id === userId);
}

async function saveGameProfile(userId, existing, profile) {
  if (existing) {
    await updateRecord("game_profiles", userId, profile);
  } else {
    await createRecord("game_profiles", userId, profile);
  }
}

async function buildPaymentSuggestions(userId, moneyCollected) {
  const [plans, payments] = await Promise.all([listRecords("plans"), listRecords("payments")]);
  const memberPayments = payments.filter((record) => record.payload.memberId === userId && record.payload.status === "Paid");
  const paidTillDate = memberPayments.reduce((total, record) => total + Number(record.payload.amount || 0), 0);
  const availableValue = moneyCollected + paidTillDate;
  const orderedPlans = plans.map((record) => ({ id: record.id, ...record.payload })).filter((plan) => Number(plan.price) > 0).sort((a, b) => Number(a.price) - Number(b.price));
  const nearestIndex = orderedPlans.findIndex((plan) => Number(plan.price) > availableValue);
  const index = nearestIndex === -1 ? orderedPlans.length - 1 : nearestIndex;
  const nearestPlan = orderedPlans[index] ?? null;
  const nextPlan = nearestPlan ? orderedPlans[index + 1] ?? null : null;
  const progress = nearestPlan ? Math.min(100, Math.round((availableValue / Number(nearestPlan.price)) * 100)) : 100;
  return {
    moneyCollected: moneyCollected + paidTillDate,
    nearestPlan: nearestPlan ? { name: nearestPlan.name, price: Number(nearestPlan.price), amountNeeded: Math.max(0, Number(nearestPlan.price) - availableValue), progress } : null,
    nextPlan: nextPlan ? { name: nextPlan.name, price: Number(nextPlan.price), amountNeeded: Math.max(0, Number(nextPlan.price) - availableValue) } : null,
    nearToGoal: progress >= 75,
  };
}

async function gameResponse(userId, profile) {
  const rewardValue = Number(profile.tokens || 0) * 10;
  const penaltyAmount = Number(profile.penaltyAmount || 0);
  const netMoneyCollected = Math.max(0, rewardValue - penaltyAmount);
  const paymentSuggestions = await buildPaymentSuggestions(userId, netMoneyCollected);
  return {
    profile: {
      tokens: Number(profile.tokens || 0),
      moneyCollected: netMoneyCollected,
      penaltyAmount,
      streak: Number(profile.streak || 0),
      dailySolvedCount: Number(profile.dailySolvedCount || 0),
      dailyQuestionLimit,
      dailyDifficultyLimit,
    },
    challenges: publicChallenges(profile),
    paymentSuggestions,
  };
}

export async function listGameData(userId) {
  const existing = await getGameRecord(userId);
  const profile = createDailyProfile(existing?.payload ?? { tokens: 0, streak: 0 }, userId);
  if (!existing || existing.payload.dailyDay !== profile.dailyDay) await saveGameProfile(userId, existing, profile);
  return gameResponse(userId, profile);
}

export async function submitGameAnswer(userId, challengeId, answer) {
  const existing = await getGameRecord(userId);
  const profile = createDailyProfile(existing?.payload ?? { tokens: 0, streak: 0 }, userId);
  const challenge = gameChallenges.find((item) => item.id === challengeId);
  if (!challenge || !(profile.activeChallengeIds ?? []).includes(challengeId)) throw new Error("Challenge is not in today's round");
  if ((profile.dailySolvedIds ?? []).includes(challengeId)) return { correct: true, alreadyCompleted: true, reward: 0, game: await gameResponse(userId, profile) };
  if (Number(profile.dailySolvedCount || 0) >= dailyQuestionLimit) return { correct: false, limitReached: true, reward: 0, game: await gameResponse(userId, profile) };

  const normalizedAnswer = String(answer ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (normalizedAnswer !== challenge.answer) {
    const nextProfile = {
      ...profile,
      penaltyAmount: Number(profile.penaltyAmount || 0) + 5,
      streak: 0,
    };
    await saveGameProfile(userId, existing, nextProfile);
    return { correct: false, penalty: 5, reward: 0, game: await gameResponse(userId, nextProfile) };
  }

  const dailySolvedIds = [...(profile.dailySolvedIds ?? []), challengeId];
  const dailyChallengeIds = profile.dailyChallengeIds[challenge.difficulty] ?? [];
  const replacement = dailyChallengeIds.find((id) => !dailySolvedIds.includes(id) && !profile.activeChallengeIds.includes(id));
  const nextProfile = {
    ...profile,
    tokens: Number(profile.tokens || 0) + challenge.reward,
    completedChallengeIds: [...(profile.completedChallengeIds ?? []), challengeId],
    dailySolvedIds,
    dailySolvedCount: Number(profile.dailySolvedCount || 0) + 1,
    activeChallengeIds: replacement
      ? profile.activeChallengeIds.map((id) => (id === challengeId ? replacement : id))
      : profile.activeChallengeIds.filter((id) => id !== challengeId),
    streak: Number(profile.streak || 0) + 1,
  };
  await saveGameProfile(userId, existing, nextProfile);
  return { correct: true, alreadyCompleted: false, reward: challenge.reward, game: await gameResponse(userId, nextProfile) };
}

function normalizeResourceRecords(records) {
  return records.map((record) => ({ id: record.id, ...record.payload }));
}

function isSameMonth(date, referenceDate) {
  return date.getFullYear() === referenceDate.getFullYear() && date.getMonth() === referenceDate.getMonth();
}

function isWithinCurrentWeek(date, referenceDate) {
  const startOfWeek = new Date(referenceDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  return date >= startOfWeek && date <= referenceDate;
}

function parsePaymentDate(value) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnlyMatch
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getPaymentDate(payment, referenceDate) {
  if (payment.paidOn) {
    const paidOn = parsePaymentDate(payment.paidOn);
    if (paidOn) {
      return paidOn;
    }
  }

  return payment.status === "Paid" ? referenceDate : null;
}

function buildOverview(recordsByResource, attendance = []) {
  const members = recordsByResource.members;
  const plans = recordsByResource.plans;
  const trainers = recordsByResource.trainers;
  const payments = recordsByResource.payments;

  const activeMembers = members.filter((member) => member.status === "Active").length;
  const inactiveMembers = members.length - activeMembers;
  const paidPayments = payments.filter((payment) => payment.status === "Paid");
  const revenue = paidPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const duePayments = payments.filter((payment) => payment.status !== "Paid").length;
  const now = new Date();
  const monthlyRevenue = paidPayments.reduce((total, payment) => {
    const paidOn = getPaymentDate(payment, now);
    return paidOn && isSameMonth(paidOn, now)
      ? total + Number(payment.amount || 0)
      : total;
  }, 0);
  const weeklyRevenue = paidPayments.reduce((total, payment) => {
    const paidOn = getPaymentDate(payment, now);
    return paidOn && isWithinCurrentWeek(paidOn, now)
      ? total + Number(payment.amount || 0)
      : total;
  }, 0);

  // Calculate attendance today
  const today = new Date().toDateString();
  const attendanceToday = attendance.filter((entry) => {
    const entryDate = new Date(entry.checkedInAt || entry.checked_in_at).toDateString();
    return entryDate === today;
  }).length;

  return {
    gymName: "PulseForge Fitness",
    totalMembers: members.length,
    activeMembers,
    inactiveMembers,
    revenue,
    duePayments,
    attendanceToday,
    trainerCount: trainers.length,
    planCount: plans.length,
    reports: {
      weeklyRevenue,
      monthlyRevenue,
      activeMembers,
      inactiveMembers,
      retentionRate: members.length === 0 ? 0 : Math.round((activeMembers / members.length) * 100),
    },
    attendanceTrend: seedAttendanceTrend,
  };
}

export async function listDashboardData(userId = null, userRole = "Member") {
  const recordsByResource = {};

  for (const resourceName of resourceNames) {
    recordsByResource[resourceName] = normalizeResourceRecords(await listRecords(resourceName));
  }

  const attendance = await listAttendanceEntries();
  const allAttendance = attendance;

  // For admin/staff: show organization overview with all data
  if (["Super Admin", "Staff"].includes(userRole)) {
    return {
      overview: buildOverview(recordsByResource, attendance),
      members: recordsByResource.members,
      trainers: recordsByResource.trainers,
      plans: recordsByResource.plans,
      payments: recordsByResource.payments,
      attendance: allAttendance,
      notifications: seedNotifications,
      attendanceTrend: seedAttendanceTrend,
    };
  }

  // For members: show personal data, hide other members' records
  if (userRole === "Member") {
    const memberRecord = recordsByResource.members.find((m) => m.id === userId);
    const memberPayments = recordsByResource.payments.filter((p) => p.memberId === userId);
    const memberAttendance = allAttendance.filter((a) => a.memberId === userId);
    const currentPlan = memberRecord?.planId
      ? recordsByResource.plans.find((p) => p.id === memberRecord.planId)
      : null;

    return {
      overview: {
        gymName: "PulseForge Fitness",
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        revenue: 0,
        duePayments: 0,
        attendanceToday: memberAttendance.length,
        trainerCount: recordsByResource.trainers.length,
        planCount: recordsByResource.plans.length,
        reports: {
          weeklyRevenue: 0,
          monthlyRevenue: 0,
          activeMembers: 0,
          inactiveMembers: 0,
          retentionRate: 0,
        },
        userProfile: memberRecord || {},
        currentPlan: currentPlan || {},
        paymentHistory: memberPayments,
      },
      members: memberRecord ? [memberRecord] : [],
      trainers: [],
      plans: currentPlan ? [currentPlan] : [],
      payments: memberPayments,
      attendance: memberAttendance,
      notifications: seedNotifications,
      attendanceTrend: seedAttendanceTrend,
    };
  }

  // For trainers: show only assigned members
  if (userRole === "Trainer") {
    const assignedMembers = recordsByResource.members.filter((m) => m.trainerId === userId);
    const trainerAttendance = allAttendance.filter((a) =>
      assignedMembers.some((m) => m.id === a.memberId)
    );

    return {
      overview: {
        gymName: "PulseForge Fitness",
        totalMembers: assignedMembers.length,
        activeMembers: assignedMembers.filter((m) => m.status === "Active").length,
        inactiveMembers: assignedMembers.filter((m) => m.status !== "Active").length,
        revenue: 0,
        duePayments: 0,
        attendanceToday: trainerAttendance.filter(
          (a) => new Date(a.checkedInAt).toDateString() === new Date().toDateString()
        ).length,
        trainerCount: 1,
        planCount: 0,
        reports: {
          weeklyRevenue: 0,
          monthlyRevenue: 0,
          activeMembers: assignedMembers.filter((m) => m.status === "Active").length,
          inactiveMembers: assignedMembers.filter((m) => m.status !== "Active").length,
          retentionRate: 0,
        },
      },
      members: assignedMembers,
      trainers: recordsByResource.trainers,
      plans: recordsByResource.plans,
      payments: [],
      attendance: trainerAttendance,
      notifications: seedNotifications,
      attendanceTrend: seedAttendanceTrend,
    };
  }

  return {
    overview: { gymName: "PulseForge Fitness" },
    members: [],
    trainers: [],
    plans: [],
    payments: [],
    attendance: [],
    notifications: [],
    attendanceTrend: [],
  };
}

export async function listResource(resourceName) {
  return normalizeResourceRecords(await listRecords(resourceName));
}

export async function saveMemberPreference(user, preference) {
  const members = await listRecords("members");
  const existing = members.find((record) => record.id === user.id);
  const currentPayload = existing?.payload ?? {
    name: user.fullName,
    email: user.email,
    status: "Active",
  };
  const payload = { ...currentPayload };

  if (preference.type === "plan") {
    payload.planId = preference.planId;
    payload.planName = preference.planName;
    payload.status = "Active";
  }

  if (preference.type === "trainer") {
    payload.trainerId = preference.trainerId;
    payload.trainerName = preference.trainerName;
  }

  if (preference.type === "wishlist") {
    const wishlistPlanIds = new Set(payload.wishlistPlanIds ?? []);
    wishlistPlanIds.add(preference.planId);
    payload.wishlistPlanIds = [...wishlistPlanIds];
  }

  if (existing) {
    return updateRecord("members", user.id, payload);
  }

  return createRecord("members", user.id, payload);
}

export async function createResource(resourceName, payload) {
  const id = `${resourceName.slice(0, 3)}-${crypto.randomUUID().slice(0, 8)}`;
  return createRecord(resourceName, id, payload);
}

export async function updateResource(resourceName, id, payload) {
  return updateRecord(resourceName, id, payload);
}

export async function deleteResource(resourceName, id) {
  return deleteRecord(resourceName, id);
}

export async function loginUser(email, password) {
  const user = await getUserByEmail(email);

  if (!user) {
    return null;
  }

  const passwordHash = user.passwordHash ?? user.password_hash ?? null;
  const storedPassword = user.password ?? null;
  const passwordMatches = passwordHash ? await bcrypt.compare(password, passwordHash) : storedPassword === password;

  if (!passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    fullName: user.fullName ?? user.full_name,
    email: user.email,
    role: user.role,
  };
}

export async function registerUser(fullName, email, password, role = "Member") {
  // Check if email already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate user ID
  const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;

  // Insert user into gym_users table (same table loginUser reads from)
  await query(
    `INSERT INTO gym_users (id, full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, fullName, email, passwordHash, role]
  );

  return {
    id: userId,
    fullName,
    email,
    role,
  };
}

export async function listAttendance() {
  return listAttendanceEntries();
}

export function listNotifications() {
  return seedNotifications;
}

export async function recordAttendanceCheckIn(entry) {
  const attendanceEntry = {
    id: `att-${crypto.randomUUID().slice(0, 8)}`,
    memberId: entry.memberId,
    memberName: entry.memberName,
    checkedInAt: new Date().toISOString(),
    checkedInBy: entry.checkedInBy,
    note: entry.note || "",
  };

  return createAttendanceEntry(attendanceEntry);
}

export async function requestPasswordReset(email) {
  const user = await getUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return null;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await createPasswordResetToken(tokenHash, user.id, expiresAt);

  return { email: user.email, token };
}

export async function resetPassword(token, password) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const userId = await consumePasswordResetToken(tokenHash);
  if (!userId) {
    return false;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updateUserPassword(userId, passwordHash);
  return true;
}