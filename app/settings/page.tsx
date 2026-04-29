import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { SettingsForm } from "./ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Profil Ayarları
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Kişisel bilgilerinizi ve şifrenizi buradan güncelleyebilirsiniz.
        </p>
      </header>

      <SettingsForm user={{ name: user.name || "", username: user.username }} />
    </div>
  );
}
