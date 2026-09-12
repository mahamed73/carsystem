import { EmptyState } from "@/components/ui";
import UserForm from "@/components/admin/UserForm";
import ResetPasswordForm from "@/components/admin/ResetPasswordForm";
import SubmitButton from "@/components/admin/SubmitButton";
import { toggleUserAction } from "@/app/actions/admin";
import { listStaff } from "@/lib/queries";
import { currentUser } from "@/lib/auth";
import { formatDateAr } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "المستخدمون" };

export default async function UsersPage() {
  const me = await currentUser();
  const users = await listStaff().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">المستخدمون</h1>
        <p className="mt-1 text-sm text-slate-500">
          حسابات الموظفين والفنيين التي يمكنها الدخول للوحة التحكم.
        </p>
      </div>

      {me?.role !== "admin" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-900">
          ⚠️ إدارة المستخدمين متاحة لمدير النظام فقط — يمكنك العرض فقط.
        </div>
      ) : (
        <details className="card-pad">
          <summary className="cursor-pointer font-extrabold text-slate-900">
            ➕ إضافة مستخدم جديد
          </summary>
          <div className="mt-5">
            <UserForm />
          </div>
        </details>
      )}

      {users.length === 0 ? (
        <div className="card">
          <EmptyState icon="🧑‍💼" title="لا يوجد مستخدمون" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="card flex flex-wrap items-center gap-4 p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg font-extrabold text-slate-600">
                {u.name.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold text-slate-900">{u.name}</h2>
                  <span
                    className={`badge ${
                      u.role === "admin"
                        ? "bg-violet-100 text-violet-800 ring-violet-200"
                        : "bg-slate-100 text-slate-700 ring-slate-200"
                    }`}
                  >
                    {u.role === "admin" ? "مدير نظام" : "موظف"}
                  </span>
                  {!u.is_active ? (
                    <span className="badge bg-rose-100 text-rose-800 ring-rose-200">معطّل</span>
                  ) : null}
                  {me?.id === u.id ? (
                    <span className="badge bg-emerald-100 text-emerald-800 ring-emerald-200">
                      أنت
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-slate-500" dir="ltr">
                  {u.email}
                  {u.phone ? ` — ${u.phone}` : ""}
                </p>
                <p className="text-[11px] text-slate-400">
                  مسجّل منذ {formatDateAr(String(u.created_at).slice(0, 10))}
                </p>
              </div>

              {me?.role === "admin" && me.id !== u.id ? (
                <div className="flex flex-wrap items-center gap-3">
                  <ResetPasswordForm userId={u.id} />
                  <form action={toggleUserAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="active" value={String(!u.is_active)} />
                    <SubmitButton
                      className={u.is_active ? "btn-danger" : "btn-ghost"}
                      pendingText="…"
                    >
                      {u.is_active ? "⏸ تعطيل الحساب" : "▶️ تفعيل الحساب"}
                    </SubmitButton>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="card-pad bg-slate-50 text-xs leading-relaxed text-slate-600">
        🔒 <strong>ملاحظة أمنية:</strong> استخدم كلمات مرور قوية (12 حرفاً على الأقل مع أرقام ورموز)،
        ولا تشارك حساب المدير بين أكثر من شخص. يمكنك تعطيل حساب أي موظف فوراً من هنا دون حذفه.
      </div>
    </div>
  );
}
