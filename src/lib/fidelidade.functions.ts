import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertGestor,
  buildDriverPayload,
  buildManagerPayload,
  generateTokenCode,
  redeemTokenAndRecordFueling,
  toggleGestorRole,
  updateProfileData,
  validateTokenForPump,
} from "./fidelidade.server";

export const getDriverData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => buildDriverPayload(context.supabase, context.userId));

export const getManagerData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertGestor(context.supabase, context.userId);
    return buildManagerPayload(context.supabase);
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw error;
    const roles = (data ?? []).map((r) => r.role as string);
    return { roles, isGestor: roles.includes("gestor") };
  });

export const issueFuelToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const code = generateTokenCode();
    const expiresAt = new Date(Date.now() + 120_000).toISOString();
    const { data, error } = await context.supabase
      .from("fuel_tokens")
      .insert({ user_id: context.userId, code, expires_at: expiresAt })
      .select("id, code, expires_at")
      .single();
    if (error) throw error;
    return data;
  });

export const updateTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        min_liters: z.number().min(0).max(999999),
        max_liters: z.number().min(0).max(999999),
        discount_per_liter: z.number().min(0).max(10),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertGestor(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("tiers")
      .update({
        min_liters: data.min_liters,
        max_liters: data.max_liters,
        discount_per_liter: data.discount_per_liter,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const updateDriverProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        fullName: z.string().optional(),
        cpf: z.string().optional(),
        phone: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    return updateProfileData(context.supabase, context.userId, data);
  });

export const validateTokenCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        codeOrCpf: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertGestor(context.supabase, context.userId);
    return validateTokenForPump(context.supabase, data.codeOrCpf);
  });

export const redeemTokenAndFuel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        code: z.string().min(1),
        liters: z.number().positive(),
        fuelType: z.string().min(1),
        unitPrice: z.number().positive(),
        stationId: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    return redeemTokenAndRecordFueling(context.supabase, context.userId, data);
  });

export const enableGestorRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return toggleGestorRole(context.supabase, context.userId);
  });

