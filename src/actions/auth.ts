"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getCurrentUser as readCurrentUser, setSessionCookie } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { actionError, type ActionResult } from "./types";

type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  messaging?: string;
  role?: "supplier" | "buyer" | "service_provider";
};

type LoginInput = {
  email: string;
  password: string;
};

const roleMap: Record<NonNullable<RegisterInput["role"]>, UserRole> = {
  supplier: UserRole.SUPPLIER,
  buyer: UserRole.BUYER,
  service_provider: UserRole.SERVICE_PROVIDER
};

export async function register(input: RegisterInput): Promise<ActionResult<{ id: string; email: string }>> {
  try {
    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("请输入有效邮箱。");
    if (!input.password || input.password.length < 6) throw new Error("密码至少需要 6 位。");

    const rateLimitKey = `register:${email}`;
    const rateLimit = checkRateLimit(rateLimitKey, { limit: 4, windowMs: 60 * 60 * 1000 });
    if (!rateLimit.ok) throw new Error(`注册尝试过多，请 ${rateLimit.retryAfterSeconds} 秒后再试。`);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("该邮箱已注册，请直接登录。");

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(input.password),
        name: input.name?.trim() || email.split("@")[0],
        phone: input.phone?.trim() || null,
        telegram: input.messaging?.trim() || null,
        role: input.role ? roleMap[input.role] : UserRole.BUYER
      },
      select: { id: true, email: true }
    });

    await setSessionCookie(user.id);
    clearRateLimit(rateLimitKey);
    revalidatePath("/", "layout");
    return { ok: true, data: user };
  } catch (error) {
    return actionError(error);
  }
}

export async function login(input: LoginInput): Promise<ActionResult<{ id: string; email: string }>> {
  try {
    const email = input.email.trim().toLowerCase();
    const rateLimitKey = `login:${email}`;
    const rateLimit = checkRateLimit(rateLimitKey, { limit: 6, windowMs: 10 * 60 * 1000 });
    if (!rateLimit.ok) throw new Error(`登录尝试过多，请 ${rateLimit.retryAfterSeconds} 秒后再试。`);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true }
    });

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new Error("邮箱或密码不正确。");
    }

    await setSessionCookie(user.id);
    clearRateLimit(rateLimitKey);
    revalidatePath("/", "layout");
    return { ok: true, data: { id: user.id, email: user.email } };
  } catch (error) {
    return actionError(error);
  }
}

export async function logout(): Promise<ActionResult<true>> {
  try {
    await clearSessionCookie();
    revalidatePath("/", "layout");
    return { ok: true, data: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function getCurrentUser() {
  return readCurrentUser();
}
