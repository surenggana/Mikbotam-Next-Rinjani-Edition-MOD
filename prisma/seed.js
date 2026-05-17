const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.admin.upsert({
    where: { u_user: "admin" },
    update: {
      role: "SUPERADMIN",
      status: "active"
    },
    create: {
      u_user: "admin",
      u_pass: hashedPassword,
      role: "SUPERADMIN",
      status: "active",
      token: "default_token",
      enct: "default_enct",
      lastlogin: new Date().toISOString(),
      ip: "127.0.0.1",
      user: "System",
    },
  });

  console.log("✅ Seed database success: User 'admin' is now SUPERADMIN");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
