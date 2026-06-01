import "dotenv/config";
import { scryptSync, randomBytes } from "node:crypto";
import {
  AuditTargetType,
  LicenseApplicationStatus,
  MatchRequestStatus,
  PrismaClient,
  ResourceStatus,
  ResourceType,
  ReviewStatus,
  UserRole,
  VerifyStatus
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/uzchina_connect?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl)
});

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  await prisma.adminAuditLog.deleteMany();
  await prisma.uploadFile.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.licenseApplication.deleteMany();
  await prisma.matchRequest.deleteMany();
  await prisma.demand.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "UzChina Admin",
      email: "admin@uzchina-connect.com",
      passwordHash: hashPassword("admin123456"),
      role: UserRole.ADMIN,
      verifyStatus: VerifyStatus.VERIFIED,
      phone: "+86 138 0000 0000",
      telegram: "@uzchina_admin",
      wechat: "uzchina_admin"
    }
  });

  const demo = await prisma.user.create({
    data: {
      name: "Demo Buyer",
      email: "demo@uzchina-connect.com",
      passwordHash: hashPassword("demo123456"),
      role: UserRole.BUYER,
      verifyStatus: VerifyStatus.PENDING,
      country: "Uzbekistan",
      city: "Tashkent",
      companyName: "Silk Road Retail Group",
      phone: "+998 90 000 0000",
      telegram: "@uzchina_demo",
      whatsapp: "+998 90 000 0000",
      wechat: "uzchina_demo"
    }
  });

  const supplier = await prisma.user.create({
    data: {
      name: "Central Asia Partner",
      email: "partner@uzchina-connect.com",
      passwordHash: hashPassword("partner123456"),
      role: UserRole.SUPPLIER,
      verifyStatus: VerifyStatus.VERIFIED,
      country: "Kazakhstan",
      city: "Almaty",
      companyName: "CA Compliance & Logistics",
      phone: "+7 701 000 0000",
      telegram: "@ca_partner",
      whatsapp: "+7 701 000 0000"
    }
  });

  const licenseResource = await prisma.resource.create({
    data: {
      userId: supplier.id,
      type: ResourceType.QUALIFICATION,
      title: "塔什干酒烟许可证与区域代理合作资源",
      description: "具备本地合规渠道、许可证资源和供货网络，开放区域代理、分销和合规服务合作。",
      country: "Uzbekistan",
      city: "Tashkent",
      category: "许可证 / 合规",
      cooperationMode: "区域代理 / 分销 / 合规服务",
      budgetRange: "USD 30,000+",
      longTerm: true,
      hasBusinessLicense: true,
      hasQualification: true,
      contactName: "Mr. Karim",
      contactEmail: "license-partner@uzchina-connect.com",
      contactPhone: "+998 91 123 4567",
      contactTelegram: "@uz_license_partner",
      contactWhatsapp: "+998 91 123 4567",
      contactWechat: "uzchina_license",
      status: ResourceStatus.FEATURED,
      isFeatured: true,
      viewCount: 238,
      matchCount: 18
    }
  });

  await prisma.resource.createMany({
    data: [
      {
        userId: supplier.id,
        type: ResourceType.CHANNEL,
        title: "阿拉木图清关与跨境物流服务团队",
        description: "覆盖中哈跨境物流、仓储、清关协助和本地派送，可为贸易商提供月度服务。",
        country: "Kazakhstan",
        city: "Almaty",
        category: "清关物流",
        cooperationMode: "月度服务 / 项目制",
        budgetRange: "USD 2,000 - 5,000",
        longTerm: true,
        hasBusinessLicense: true,
        hasQualification: true,
        contactName: "Logistics Desk",
        contactEmail: "customs@uzchina-connect.com",
        contactPhone: "+7 701 000 0000",
        contactTelegram: "@kz_customs",
        status: ResourceStatus.APPROVED,
        viewCount: 426,
        matchCount: 41
      },
      {
        userId: supplier.id,
        type: ResourceType.SUPPLIER,
        title: "比什凯克仓储与本地分拨合作",
        description: "适合中国商品进入吉尔吉斯市场后的短仓、分拨和本地合作伙伴对接。",
        country: "Kyrgyzstan",
        city: "Bishkek",
        category: "仓储分拨",
        cooperationMode: "仓配合作",
        budgetRange: "按面积和订单量报价",
        longTerm: true,
        hasBusinessLicense: true,
        hasQualification: false,
        contactName: "Warehouse Team",
        contactEmail: "warehouse@uzchina-connect.com",
        contactPhone: "+996 550 000 000",
        contactWechat: "bishkek_wh",
        status: ResourceStatus.APPROVED,
        viewCount: 191,
        matchCount: 12
      },
      {
        userId: demo.id,
        type: ResourceType.CHANNEL,
        title: "撒马尔罕线下零售渠道合作",
        description: "拥有本地零售门店资源，正在补充营业执照和渠道证明，提交平台审核。",
        country: "Uzbekistan",
        city: "Samarkand",
        category: "零售渠道",
        cooperationMode: "分销 / 代理",
        budgetRange: "面议",
        longTerm: true,
        hasBusinessLicense: false,
        hasQualification: false,
        contactName: "Demo Buyer",
        contactEmail: "trade@uzchina-connect.com",
        contactPhone: "+998 93 000 0000",
        contactWechat: "samarkand_trade",
        status: ResourceStatus.PENDING
      }
    ]
  });

  await prisma.demand.create({
    data: {
      userId: demo.id,
      title: "寻找阿拉木图稳定清关服务商",
      description: "需要对接有经验的清关与仓配服务商，适合长期合作。",
      country: "Kazakhstan",
      city: "Almaty",
      category: "清关物流",
      budgetRange: "USD 2,000 - 5,000",
      cooperationMode: "月度服务",
      urgency: "normal",
      contactName: "Demo Buyer",
      contactEmail: demo.email,
      contactPhone: demo.phone,
      contactTelegram: demo.telegram,
      contactWhatsapp: demo.whatsapp,
      contactWechat: demo.wechat,
      status: ReviewStatus.PENDING
    }
  });

  const match = await prisma.matchRequest.create({
    data: {
      resourceId: licenseResource.id,
      requesterId: demo.id,
      message: "我们有零售渠道，希望了解区域代理合作条件。",
      status: MatchRequestStatus.PENDING
    }
  });

  await prisma.licenseApplication.create({
    data: {
      userId: demo.id,
      name: "Demo Buyer",
      country: "Uzbekistan",
      city: "Tashkent",
      companyName: "Silk Road Retail Group",
      channelInfo: "本地零售和批发客户资源",
      capitalAbility: "USD 50,000 - 100,000",
      cooperationType: "区域代理",
      hasWarehouse: false,
      hasStore: true,
      hasTeam: true,
      contactEmail: demo.email,
      contactPhone: demo.phone,
      contactTelegram: demo.telegram,
      contactWhatsapp: demo.whatsapp,
      contactWechat: demo.wechat,
      note: "希望优先了解酒烟许可证合作。",
      status: LicenseApplicationStatus.PENDING
    }
  });

  await prisma.adminAuditLog.createMany({
    data: [
      {
        adminId: admin.id,
        targetType: AuditTargetType.RESOURCE,
        targetId: licenseResource.id,
        action: "seed:resource_featured",
        note: "Seed 推荐资源"
      },
      {
        adminId: admin.id,
        targetType: AuditTargetType.MATCH_REQUEST,
        targetId: match.id,
        action: "seed:match_pending",
        note: "Seed 待审核对接申请"
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
