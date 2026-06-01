import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import {
  AuditTargetType,
  LicenseApplicationStatus,
  MatchRequestStatus,
  PrismaClient,
  ResourceStatus,
  ResourceType,
  ReviewStatus,
  UserRole,
  VerificationType,
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

function contact(user, suffix) {
  return {
    contactName: user.name,
    contactEmail: user.email,
    contactPhone: user.phone,
    contactTelegram: user.telegram,
    contactWhatsapp: user.whatsapp,
    contactWechat: `${user.wechat}_${suffix}`
  };
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
      passwordHash: hashPassword("Admin123456"),
      role: UserRole.ADMIN,
      verifyStatus: VerifyStatus.VERIFIED,
      phone: "+86 138 0000 0000",
      telegram: "@uzchina_admin",
      wechat: "uzchina_admin"
    }
  });

  const buyer = await prisma.user.create({
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
      whatsapp: "+7 701 000 0000",
      wechat: "ca_partner"
    }
  });

  const serviceProvider = await prisma.user.create({
    data: {
      name: "Compliance Service Desk",
      email: "service@uzchina-connect.com",
      passwordHash: hashPassword("service123456"),
      role: UserRole.SERVICE_PROVIDER,
      verifyStatus: VerifyStatus.NEEDS_MORE_INFO,
      country: "Kyrgyzstan",
      city: "Bishkek",
      companyName: "Bishkek Trade Services",
      phone: "+996 550 000 000",
      telegram: "@kg_service",
      whatsapp: "+996 550 000 000",
      wechat: "kg_service"
    }
  });

  const approvedResourceData = [
    {
      userId: supplier.id,
      type: ResourceType.QUALIFICATION,
      title: "塔什干酒烟许可证与区域代理合作资源",
      description: "具备本地合规渠道、许可证资源和供货网络，开放区域代理、分销和合规服务合作。",
      country: "Uzbekistan",
      city: "Tashkent",
      category: "许可证 / 合规",
      cooperationMode: "区域代理 / 分销 / 合规服务",
      budgetRange: "USD 30,000+",
      status: ResourceStatus.FEATURED,
      isFeatured: true,
      viewCount: 238,
      matchCount: 18,
      ...contact(supplier, "license")
    },
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
      viewCount: 426,
      matchCount: 41,
      ...contact(supplier, "customs")
    },
    {
      userId: serviceProvider.id,
      type: ResourceType.SUPPLIER,
      title: "比什凯克仓储与本地分拨合作",
      description: "适合中国商品进入吉尔吉斯市场后的短仓、分拨和本地合作伙伴对接。",
      country: "Kyrgyzstan",
      city: "Bishkek",
      category: "仓储分拨",
      cooperationMode: "仓配合作 / 海外仓",
      budgetRange: "按面积和订单量报价",
      viewCount: 191,
      matchCount: 12,
      ...contact(serviceProvider, "warehouse")
    },
    {
      userId: supplier.id,
      type: ResourceType.CHANNEL,
      title: "杜尚别工程项目本地合规与翻译团队",
      description: "服务工程承包、建材进口、当地手续和双语沟通。",
      country: "Tajikistan",
      city: "Dushanbe",
      category: "工程服务",
      cooperationMode: "项目制 / 顾问服务",
      budgetRange: "USD 3,000 - 8,000",
      viewCount: 160,
      matchCount: 9,
      ...contact(supplier, "build")
    },
    {
      userId: serviceProvider.id,
      type: ResourceType.SUPPLIER,
      title: "阿什哈巴德贸易展会渠道合作",
      description: "可协助中国品牌参加本地展会、对接采购商和渠道商。",
      country: "Turkmenistan",
      city: "Ashgabat",
      category: "展会渠道",
      cooperationMode: "渠道合作 / 展会服务",
      budgetRange: "USD 5,000+",
      viewCount: 96,
      matchCount: 5,
      ...contact(serviceProvider, "expo")
    },
    {
      userId: supplier.id,
      type: ResourceType.SUPPLIER,
      title: "塔什干食品进口分销渠道",
      description: "覆盖商超、批发市场和社区零售，适合食品与快消品。",
      country: "Uzbekistan",
      city: "Tashkent",
      category: "食品分销",
      cooperationMode: "代理 / 分销",
      budgetRange: "面议",
      viewCount: 205,
      matchCount: 14,
      ...contact(supplier, "food")
    },
    {
      userId: serviceProvider.id,
      type: ResourceType.CHANNEL,
      title: "中亚本地招聘与劳务合规服务",
      description: "面向仓储、零售、工程团队提供招聘、合同和合规咨询。",
      country: "Kazakhstan",
      city: "Astana",
      category: "人力合规",
      cooperationMode: "长期服务",
      budgetRange: "按月报价",
      viewCount: 83,
      matchCount: 6,
      ...contact(serviceProvider, "hr")
    },
    {
      userId: supplier.id,
      type: ResourceType.QUALIFICATION,
      title: "哈萨克斯坦医疗器械注册顾问资源",
      description: "协助资料准备、注册流程沟通和本地代理对接。",
      country: "Kazakhstan",
      city: "Almaty",
      category: "医疗器械注册",
      cooperationMode: "顾问服务 / 代理合作",
      budgetRange: "USD 8,000+",
      viewCount: 142,
      matchCount: 11,
      ...contact(supplier, "med")
    }
  ];

  const approvedResources = [];
  for (const data of approvedResourceData) {
    approvedResources.push(
      await prisma.resource.create({
        data: {
          ...data,
          status: data.status ?? ResourceStatus.APPROVED,
          isFeatured: data.isFeatured ?? false,
          longTerm: true,
          hasBusinessLicense: true,
          hasQualification: data.type === ResourceType.QUALIFICATION
        }
      })
    );
  }

  const pendingResourceData = [
    ["撒马尔罕线下零售渠道合作", buyer.id, "Uzbekistan", "Samarkand", "零售渠道"],
    ["奥什市边境仓配合作资源", serviceProvider.id, "Kyrgyzstan", "Osh", "边境仓配"],
    ["阿拉木图本地会计与税务服务", buyer.id, "Kazakhstan", "Almaty", "财税服务"],
    ["塔什干建材批发客户资源", buyer.id, "Uzbekistan", "Tashkent", "建材渠道"]
  ];

  for (const [title, userId, country, city, category] of pendingResourceData) {
    const owner = userId === buyer.id ? buyer : serviceProvider;
    await prisma.resource.create({
      data: {
        userId,
        type: ResourceType.CHANNEL,
        title,
        description: `${title}，资料正在提交平台审核。`,
        country,
        city,
        category,
        cooperationMode: "合作洽谈",
        budgetRange: "面议",
        longTerm: true,
        hasBusinessLicense: false,
        hasQualification: false,
        status: ResourceStatus.PENDING,
        ...contact(owner, "pending")
      }
    });
  }

  await prisma.demand.createMany({
    data: [
      {
        userId: buyer.id,
        title: "寻找阿拉木图稳定清关服务商",
        description: "需要对接有经验的清关与仓配服务商，适合长期合作。",
        country: "Kazakhstan",
        city: "Almaty",
        category: "清关物流",
        budgetRange: "USD 2,000 - 5,000",
        cooperationMode: "月度服务",
        urgency: "normal",
        contactName: buyer.name,
        contactEmail: buyer.email,
        contactPhone: buyer.phone,
        contactTelegram: buyer.telegram,
        contactWhatsapp: buyer.whatsapp,
        contactWechat: buyer.wechat,
        status: ReviewStatus.PENDING
      },
      {
        userId: supplier.id,
        title: "寻找塔什干食品经销商",
        description: "希望找到有终端渠道的食品经销合作方。",
        country: "Uzbekistan",
        city: "Tashkent",
        category: "食品分销",
        budgetRange: "面议",
        cooperationMode: "代理合作",
        urgency: "high",
        contactName: supplier.name,
        contactEmail: supplier.email,
        contactPhone: supplier.phone,
        status: ReviewStatus.PENDING
      },
      {
        userId: serviceProvider.id,
        title: "寻找中亚展会联合推广伙伴",
        description: "计划联合组织中亚市场渠道推广。",
        country: "Turkmenistan",
        city: "Ashgabat",
        category: "展会渠道",
        budgetRange: "USD 5,000+",
        cooperationMode: "联合推广",
        urgency: "normal",
        contactName: serviceProvider.name,
        contactEmail: serviceProvider.email,
        contactPhone: serviceProvider.phone,
        status: ReviewStatus.NEEDS_MORE_INFO,
        adminNote: "请补充展会排期和合作预算。"
      }
    ]
  });

  await prisma.licenseApplication.createMany({
    data: [
      {
        userId: buyer.id,
        name: buyer.name,
        country: "Uzbekistan",
        city: "Tashkent",
        companyName: buyer.companyName,
        channelInfo: "本地零售和批发客户资源",
        capitalAbility: "USD 50,000 - 100,000",
        cooperationType: "区域代理",
        hasStore: true,
        hasTeam: true,
        contactEmail: buyer.email,
        contactPhone: buyer.phone,
        contactTelegram: buyer.telegram,
        contactWhatsapp: buyer.whatsapp,
        contactWechat: buyer.wechat,
        note: "希望优先了解酒烟许可证合作。",
        status: LicenseApplicationStatus.PENDING
      },
      {
        userId: supplier.id,
        name: supplier.name,
        country: "Kazakhstan",
        city: "Almaty",
        companyName: supplier.companyName,
        channelInfo: "清关与合规渠道",
        capitalAbility: "USD 100,000+",
        cooperationType: "合规服务合作",
        hasWarehouse: true,
        hasTeam: true,
        contactEmail: supplier.email,
        contactPhone: supplier.phone,
        contactTelegram: supplier.telegram,
        status: LicenseApplicationStatus.CONTACTED,
        adminNote: "已电话沟通，等待补充营业执照。"
      },
      {
        userId: serviceProvider.id,
        name: serviceProvider.name,
        country: "Kyrgyzstan",
        city: "Bishkek",
        companyName: serviceProvider.companyName,
        channelInfo: "仓储、招聘与本地运营",
        capitalAbility: "USD 30,000 - 50,000",
        cooperationType: "服务商合作",
        hasStore: false,
        hasTeam: true,
        contactEmail: serviceProvider.email,
        contactPhone: serviceProvider.phone,
        contactTelegram: serviceProvider.telegram,
        status: LicenseApplicationStatus.PENDING
      }
    ]
  });

  await prisma.matchRequest.createMany({
    data: [
      {
        resourceId: approvedResources[0].id,
        requesterId: buyer.id,
        message: "我们有零售渠道，希望了解区域代理合作条件。",
        status: MatchRequestStatus.PENDING
      },
      {
        resourceId: approvedResources[1].id,
        requesterId: serviceProvider.id,
        message: "我们有仓配服务，希望与清关团队建立长期合作。",
        status: MatchRequestStatus.APPROVED,
        adminNote: "申请人资料初步匹配，可进一步确认后开放联系方式。",
        reviewedBy: admin.id,
        reviewedAt: new Date()
      },
      {
        resourceId: approvedResources[5].id,
        requesterId: buyer.id,
        message: "希望对接食品分销渠道，了解代理条件。",
        status: MatchRequestStatus.PENDING
      }
    ]
  });

  await prisma.verification.createMany({
    data: [
      {
        userId: buyer.id,
        type: VerificationType.COMPANY,
        documentUrl: "https://example.com/demo-company-license.pdf",
        status: ReviewStatus.PENDING
      },
      {
        userId: supplier.id,
        type: VerificationType.LICENSE,
        documentUrl: "https://example.com/partner-license.pdf",
        status: ReviewStatus.APPROVED,
        adminNote: "许可证资料已核验。",
        reviewedBy: admin.id,
        reviewedAt: new Date()
      },
      {
        userId: serviceProvider.id,
        type: VerificationType.COMPANY,
        documentUrl: "https://example.com/service-company.pdf",
        status: ReviewStatus.NEEDS_MORE_INFO,
        adminNote: "请补充公司注册地址证明。",
        reviewedBy: admin.id,
        reviewedAt: new Date()
      }
    ]
  });

  await prisma.adminAuditLog.createMany({
    data: [
      {
        adminId: admin.id,
        targetType: AuditTargetType.RESOURCE,
        targetId: approvedResources[0].id,
        action: "seed:resource_featured",
        note: "Seed 推荐资源"
      },
      {
        adminId: admin.id,
        targetType: AuditTargetType.MATCH_REQUEST,
        targetId: approvedResources[1].id,
        action: "seed:match_approved",
        note: "Seed 已通过但未开放联系方式的对接申请"
      },
      {
        adminId: admin.id,
        targetType: AuditTargetType.VERIFICATION,
        targetId: supplier.id,
        action: "seed:verification_approved",
        note: "Seed 认证记录"
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
