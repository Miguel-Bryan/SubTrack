/* Seed script.
 *   npm run db:seed         -> the two users + demo data (only if the database has no clients yet)
 *   npm run db:seed:empty   -> only the two users, no demo data (use this for production)
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { addDays, addMonths, today } from "../src/lib/dates";

const prisma = new PrismaClient();
const emptyOnly = process.argv.includes("--empty");

const adminUsername = (process.env.SEED_ADMIN_USERNAME ?? "admin").toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
const collabUsername = (process.env.SEED_COLLAB_USERNAME ?? "partner").toLowerCase();
const collabPassword = process.env.SEED_COLLAB_PASSWORD ?? "ChangeMe123!";

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: { name: "Admin", username: adminUsername, role: "ADMIN", passwordHash: await bcrypt.hash(adminPassword, 10) },
  });
  const partner = await prisma.user.upsert({
    where: { username: collabUsername },
    update: {},
    create: { name: "Partner", username: collabUsername, role: "COLLABORATOR", passwordHash: await bcrypt.hash(collabPassword, 10) },
  });
  console.log(`Users ready: ${adminUsername} (admin), ${collabUsername} (collaborator).`);

  if (emptyOnly) return;
  if ((await prisma.client.count()) > 0) {
    console.log("Clients already exist, skipping demo data.");
    return;
  }

  const t = today();
  const day = (offset: number) => addDays(t, offset);

  // ---- clients ----
  const [aicha, brice, carine, david, estelle, fabrice] = await Promise.all(
    [
      ["Aïcha Mbarga", "677 12 34 56", "aicha.mbarga"],
      ["Brice Nkeng", "655 98 76 54", "brice_n"],
      ["Carine Fotso", "699 11 22 33", "carine.f"],
      ["David Tchoua", "670 45 67 89", "dtchoua"],
      ["Estelle Ndzi", "690 33 44 55", "estelle.ndzi"],
      ["Fabrice Ekani", "656 77 88 99", "fabrice_e"],
    ].map(([fullName, phone, accountUsername]) => prisma.client.create({ data: { fullName, phone, accountUsername } })),
  );

  // ---- client subscriptions (dates are relative to today so the demo always looks alive) ----
  async function sell(clientId: string, platform: string, plan: string, startOffset: number, months: number, price: number, payments: [number, number, string][]) {
    const startDate = day(startOffset);
    const sub = await prisma.clientSubscription.create({
      data: { clientId, platform, plan, startDate, durationMonths: months, endDate: addMonths(startDate, months), price },
    });
    for (const [amount, paidOffset, method] of payments) {
      await prisma.payment.create({
        data: { subscriptionId: sub.id, amount, paidAt: day(paidOffset), method, recordedById: Math.random() > 0.5 ? admin.id : partner.id },
      });
    }
    return sub;
  }

  await sell(aicha.id, "Netflix", "Premium, 1 profile", -10, 1, 4500, [[4500, -10, "MTN MoMo"]]); // paid, ends in ~20 days
  await sell(aicha.id, "Spotify", "Premium Individual", -80, 3, 6000, [[3000, -80, "Orange Money"]]); // overdue balance
  await sell(brice.id, "Netflix", "Premium, 1 profile", -27, 1, 4500, [[2000, -27, "Cash"]]); // due soon, partial
  await sell(carine.id, "Canva", "Pro", -40, 2, 5000, [[5000, -40, "MTN MoMo"]]); // paid, ended ~20 days ago -> expired
  await sell(carine.id, "Netflix", "Standard, 1 profile", -3, 1, 3500, []); // unpaid, not due yet
  await sell(david.id, "Spotify", "Family", -25, 1, 2500, [[2500, -25, "Orange Money"]]); // paid, expiring soon
  await sell(david.id, "Canva", "Pro", -33, 1, 2500, []); // due today-ish / overdue
  await sell(estelle.id, "Netflix", "Premium, 1 profile", -60, 3, 12000, [[6000, -60, "Bank Transfer"], [6000, -20, "MTN MoMo"]]); // paid, long
  await sell(fabrice.id, "YouTube Premium", "Individual", -5, 2, 5000, [[2500, -5, "Cash"]]); // partial, due in 55 days

  // ---- provider subscriptions ----
  await prisma.providerSubscription.createMany({
    data: [
      { platform: "Netflix", accountIdentifier: "netflix-acc-1", purchaseDate: day(-20), renewalDate: day(10), cost: 20000, billingMonths: 1, capacity: 5, occupiedSeats: 4, notes: "Premium plan, 5 profiles" },
      { platform: "Netflix", accountIdentifier: "netflix-acc-2", purchaseDate: day(-27), renewalDate: day(3), cost: 20000, billingMonths: 1, capacity: 5, occupiedSeats: 5 },
      { platform: "Spotify", accountIdentifier: "family-plan", purchaseDate: day(-45), renewalDate: day(-2), cost: 9000, billingMonths: 1, capacity: 6, occupiedSeats: 3 },
      { platform: "Canva", accountIdentifier: "canva-team", purchaseDate: day(-100), renewalDate: day(80), cost: 30000, billingMonths: 6, capacity: 10, occupiedSeats: 2 },
    ],
  });

  // ---- expenses (some this month, some last month) ----
  await prisma.expense.createMany({
    data: [
      { name: "Netflix purchase (acc 1)", amount: 20000, spentAt: day(-20), category: "Subscription purchase" },
      { name: "Netflix purchase (acc 2)", amount: 20000, spentAt: day(-27), category: "Subscription purchase" },
      { name: "Internet bundle", amount: 10000, spentAt: day(-12), category: "Internet" },
      { name: "Facebook ads", amount: 5000, spentAt: day(-8), category: "Advertising", notes: "Boost for the Netflix offer" },
      { name: "Spotify Family purchase", amount: 9000, spentAt: day(-45), category: "Subscription purchase" },
    ],
  });

  console.log("Demo data created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
