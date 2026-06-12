import { requireUser } from "@/lib/dal";
import { AccountManager } from "./account-manager";

export default async function AccountPage() {
  const user = await requireUser();

  return <AccountManager name={user.name ?? ""} email={user.email} />;
}
