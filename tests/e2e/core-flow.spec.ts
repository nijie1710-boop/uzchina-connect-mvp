import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Browser, type Page, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type PublicResource = {
  id: string;
  title: string;
  status: string;
  contact?: Record<string, string>;
};

let prisma: PrismaClient;

function readEnvValue(key: string) {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return undefined;

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));
  if (!line) return undefined;

  const rawValue = line.slice(line.indexOf("=") + 1);
  return rawValue.trim().replace(/^["']|["']$/g, "");
}

function createPrismaClient() {
  const databaseUrl =
    process.env.DATABASE_URL ??
    readEnvValue("DATABASE_URL") ??
    "postgresql://postgres:postgres@localhost:5432/uzchina_connect?schema=public";

  return new PrismaClient({
    adapter: new PrismaPg(databaseUrl)
  });
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("邮箱地址").fill(email);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "用户中心" })).toBeVisible();
}

async function publicResources(request: APIRequestContext) {
  const response = await request.get("/api/resources");
  expect(response.ok()).toBe(true);
  return (await response.json()) as PublicResource[];
}

async function expectResourceStatus(resourceId: string, status: string) {
  await expect
    .poll(async () => {
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
        select: { status: true }
      });
      return resource?.status ?? "MISSING";
    })
    .toBe(status);
}

test.beforeAll(() => {
  execFileSync("pnpm", ["prisma", "db", "seed"], {
    cwd: process.cwd(),
    stdio: "inherit"
  });
  prisma = createPrismaClient();
});

test.afterAll(async () => {
  await prisma?.$disconnect();
});

test("resource review and contact unlock flow", async ({ page, request, browser }) => {
  const runId = Date.now();
  const ownerEmail = `e2e-owner-${runId}@example.com`;
  const ownerPassword = "E2ePass123456";
  const resourceTitle = `E2E Resource ${runId}`;
  const contactEmail = `resource-contact-${runId}@example.com`;
  const contactPhone = `+998 90 ${String(runId).slice(-3)} 4567`;
  const contactWechat = `e2e_wechat_${String(runId).slice(-5)}`;

  await page.goto("/register");
  await page.getByLabel("邮箱地址").fill(ownerEmail);
  await page.getByLabel("手机号（含国家区号）").fill("+998 90 111 2233");
  await page.getByLabel("Telegram / WhatsApp / WeChat").fill(`@e2e_owner_${runId}`);
  await page.getByLabel("设置密码").fill(ownerPassword);
  await page.getByRole("button", { name: "注册并进入认证", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(ownerEmail)).toBeVisible();

  const createdUser = await prisma.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true, role: true }
  });
  expect(createdUser?.role).toBe("SUPPLIER");

  await login(page, ownerEmail, ownerPassword);

  await page.goto("/submit-resource");
  await page.getByLabel("资源标题").fill(resourceTitle);
  await page.getByLabel("行业分类").fill("E2E 渠道测试");
  await page.getByLabel("国家 / 城市").fill("Uzbekistan");
  await page.getByLabel("城市", { exact: true }).fill("Tashkent");
  await page.getByLabel("合作方式", { exact: true }).fill("E2E distribution");
  await page.getByLabel("联系人", { exact: true }).fill("E2E Owner");
  await page.getByLabel("资源详细描述").fill("E2E resource created by Playwright for production-readiness verification.");
  await page.getByLabel("微信", { exact: true }).fill(contactWechat);
  await page.getByLabel("电话", { exact: true }).fill(contactPhone);
  await page.getByLabel("邮箱", { exact: true }).fill(contactEmail);
  await page.getByLabel("Telegram", { exact: true }).fill(`@${contactWechat}`);
  await page.getByLabel("WhatsApp", { exact: true }).fill(contactPhone);
  await page.getByRole("button", { name: "提交审核", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(resourceTitle)).toBeVisible();

  await expect
    .poll(async () => {
      const resource = await prisma.resource.findFirst({
        where: { title: resourceTitle },
        select: { id: true, status: true, userId: true }
      });
      return resource?.status ?? "MISSING";
    })
    .toBe("PENDING");

  const pendingResource = await prisma.resource.findFirstOrThrow({
    where: { title: resourceTitle },
    select: { id: true }
  });

  const resourcesBeforeApproval = await publicResources(request);
  expect(resourcesBeforeApproval.some((resource) => resource.id === pendingResource.id)).toBe(false);

  await login(page, "admin@uzchina-connect.com", "Admin123456");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "管理员后台" })).toBeVisible();
  await page.locator("main main").getByRole("button", { name: "资源审核", exact: true }).click();
  const resourceReviewRow = page
    .getByText(resourceTitle, { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'border-t')][1]");
  await resourceReviewRow.getByRole("button", { name: "通过", exact: true }).click();
  await expectResourceStatus(pendingResource.id, "APPROVED");

  const resourcesAfterApproval = await publicResources(request);
  const approvedResource = resourcesAfterApproval.find((resource) => resource.id === pendingResource.id);
  expect(approvedResource?.status).toBe("approved");
  expect(approvedResource?.contact ?? {}).toEqual({});

  await login(page, "demo@uzchina-connect.com", "demo123456");
  await page.goto(`/resources/${pendingResource.id}`);
  await expect(page.getByText("电话：审核通过后开放")).toBeVisible();
  await expect(page.getByText(contactEmail)).toHaveCount(0);
  await page.getByPlaceholder("请说明你的资源、渠道、合作意向").fill("E2E buyer wants to connect with this resource.");
  await page.getByRole("button", { name: "申请对接", exact: true }).click();
  await expect(page.getByRole("button", { name: "匹配中", exact: true })).toBeVisible();

  const applicant = await prisma.user.findUniqueOrThrow({
    where: { email: "demo@uzchina-connect.com" },
    select: { id: true }
  });

  await expect
    .poll(async () => {
      const matchRequest = await prisma.matchRequest.findUnique({
        where: {
          resourceId_requesterId: {
            resourceId: pendingResource.id,
            requesterId: applicant.id
          }
        },
        select: { status: true }
      });
      return matchRequest?.status ?? "MISSING";
    })
    .toBe("PENDING");

  await login(page, "admin@uzchina-connect.com", "Admin123456");
  await page.goto("/admin");
  await page.locator("main main").getByRole("button", { name: "对接申请", exact: true }).click();
  const matchReviewRow = page
    .getByText(resourceTitle, { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'border-t')][1]");
  await matchReviewRow.getByRole("button", { name: "开放联系方式", exact: true }).click();

  await expect
    .poll(async () => {
      const matchRequest = await prisma.matchRequest.findUnique({
        where: {
          resourceId_requesterId: {
            resourceId: pendingResource.id,
            requesterId: applicant.id
          }
        },
        select: { status: true }
      });
      return matchRequest?.status ?? "MISSING";
    })
    .toBe("CONTACT_UNLOCKED");

  await login(page, "demo@uzchina-connect.com", "demo123456");
  await page.goto(`/resources/${pendingResource.id}`);
  await expect(page.getByText("联系方式已开放")).toBeVisible();
  await expect(page.getByText(contactEmail)).toBeVisible();
  await expect(page.getByText(contactPhone)).toBeVisible();
  await expect(page.getByText(contactWechat)).toBeVisible();

  await login(page, "service@uzchina-connect.com", "service123456");
  await page.goto(`/resources/${pendingResource.id}`);
  await expect(page.getByText("电话：审核通过后开放")).toBeVisible();
  await expect(page.getByText(contactEmail)).toHaveCount(0);
  await expect(page.getByText(contactPhone)).toHaveCount(0);

  await assertAnonymousCannotSeeContact(browser, pendingResource.id, contactEmail, contactPhone);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);

  await login(page, "admin@uzchina-connect.com", "Admin123456");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "管理员后台" })).toBeVisible();
});

async function assertAnonymousCannotSeeContact(browser: Browser, resourceId: string, email: string, phone: string) {
  const context = await browser.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
  });
  const anonymousPage = await context.newPage();

  try {
    await anonymousPage.goto(`/resources/${resourceId}`);
    await expect(anonymousPage.getByText("电话：审核通过后开放")).toBeVisible();
    await expect(anonymousPage.getByText(email)).toHaveCount(0);
    await expect(anonymousPage.getByText(phone)).toHaveCount(0);
  } finally {
    await context.close();
  }
}
