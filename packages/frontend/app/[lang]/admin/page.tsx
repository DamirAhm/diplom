"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = getDictionary(lang);
  const router = useRouter();

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await api.auth.login(data.username, data.password);
      router.push(`/${lang}/admin/researchers`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: dictionary.admin.loginError,
        description:
          error.status === 401
            ? dictionary.admin.invalidCredentials
            : dictionary.admin.serverError,
      });
    }
  };

  return (
    <div className="flex h-[65vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-lg">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{dictionary.admin.signIn}</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">{dictionary.admin.username}</Label>
              <Input
                id="username"
                {...register("username")}
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={
                  errors.username ? "username-error" : undefined
                }
              />
              {errors.username && (
                <p
                  id="username-error"
                  className="mt-1 text-sm text-destructive"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">{dictionary.admin.password}</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1 text-sm text-destructive"
                >
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? dictionary.common.loading : dictionary.admin.signIn}
          </Button>
        </form>
      </div>
    </div>
  );
}
