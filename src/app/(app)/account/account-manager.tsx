"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changePassword } from "@/server/account";
import { colorForName } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { LogoutButton } from "@/components/logout-button";

export function AccountManager({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [savingPassword, startSavePassword] = useTransition();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleChangePassword() {
    startSavePassword(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (result.ok) {
        toast.success("Password diperbarui.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <ParticipantAvatar
          name={name || email}
          color={colorForName(name || email)}
          className="size-12"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">{name || "Akun"}</p>
          <p className="text-muted-foreground truncate text-sm">{email}</p>
        </div>
      </div>

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
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Konfirmasi password baru</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword.length > 0 && confirmPassword !== newPassword && (
              <p className="text-destructive text-xs">
                Konfirmasi password tidak cocok.
              </p>
            )}
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={
              savingPassword ||
              currentPassword.length === 0 ||
              newPassword.length < 8 ||
              confirmPassword !== newPassword
            }
            className="w-full"
          >
            {savingPassword ? "Menyimpan..." : "Ganti password"}
          </Button>
        </CardContent>
      </Card>

      <LogoutButton />
    </div>
  );
}
