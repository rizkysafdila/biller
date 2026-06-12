"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { changePassword, updateProfile } from "@/server/account";
import { colorForName } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";

export function AccountManager({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [savingProfile, startSaveProfile] = useTransition();
  const [savingPassword, startSavePassword] = useTransition();

  const [nameValue, setNameValue] = useState(name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const nameChanged = nameValue.trim() !== name && nameValue.trim().length > 0;

  function handleSaveProfile() {
    startSaveProfile(async () => {
      const result = await updateProfile({ name: nameValue });
      if (result.ok) {
        toast.success("Profil tersimpan.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleChangePassword() {
    startSavePassword(async () => {
      const result = await changePassword({ currentPassword, newPassword });
      if (result.ok) {
        toast.success("Password diperbarui.");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <ParticipantAvatar
          name={nameValue || email}
          color={colorForName(nameValue || email)}
          className="size-12"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">{nameValue || "Akun"}</p>
          <p className="text-muted-foreground truncate text-sm">{email}</p>
        </div>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              maxLength={40}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} disabled readOnly />
            <p className="text-muted-foreground text-xs">
              Email tidak bisa diubah.
            </p>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={!nameChanged || savingProfile}
            className="w-full"
          >
            {savingProfile ? "Menyimpan..." : "Simpan"}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Ganti password</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Password saat ini</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">Password baru</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={
              savingPassword ||
              currentPassword.length === 0 ||
              newPassword.length < 8
            }
            className="w-full"
          >
            {savingPassword ? "Menyimpan..." : "Ganti password"}
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Tema</p>
            <p className="text-muted-foreground text-sm">
              Mode terang atau gelap.
            </p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <LogoutButton />
    </div>
  );
}
