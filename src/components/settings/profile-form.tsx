"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { profileSchema, type ProfileFormValues } from "@/lib/validations/profile";
import { updateDisplayNameAction } from "@/lib/actions/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileForm({ initialDisplayName }: { initialDisplayName: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: initialDisplayName },
  });

  async function onSubmit(values: ProfileFormValues) {
    const result = await updateDisplayNameAction(values);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível atualizar seu nome.");
      return;
    }
    toast.success("Nome atualizado.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nome de exibição</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <Label htmlFor="displayName">Como devemos te chamar</Label>
          <Input id="displayName" invalid={!!errors.displayName} {...register("displayName")} />
          <FieldError message={errors.displayName?.message} />
        </div>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          Salvar nome
        </Button>
      </form>
    </Card>
  );
}
