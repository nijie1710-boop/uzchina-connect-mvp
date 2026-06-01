export type ActionResult<T = undefined> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export function actionError(error: unknown): ActionResult<never> {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return { ok: false, error: "请先登录后再操作。" };
    if (error.message === "FORBIDDEN") return { ok: false, error: "当前账号没有权限执行该操作。" };
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "操作失败，请稍后重试。" };
}
