import { z } from "zod";

export const familyMemberSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  date_of_birth: z.string().nullable().optional(),
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .nullable()
    .optional(),
});

export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;

export const familyMemberUpdateSchema = familyMemberSchema.extend({
  id: z.string().uuid("Invalid member ID"),
});

export type FamilyMemberUpdateInput = z.infer<typeof familyMemberUpdateSchema>;
