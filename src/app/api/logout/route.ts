import { signOut } from "@/lib/auth";

/** خروج آمن (POST فقط) ثم إعادة التوجيه لصفحة الدخول */
export async function POST() {
  await signOut({ redirectTo: "/login" });
}
