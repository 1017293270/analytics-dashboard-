import { z } from 'zod'
import { roleCodeValidator, userStatusValidator } from './auth.js'

const accountUsernameValidator = z.string().trim().min(1).max(80)
const accountDisplayNameValidator = z.string().trim().min(1).max(80)
const accountPhoneValidator = z.string().trim().max(40)
const accountPasswordValidator = z.string().min(1).max(200)
const accountRoleCodesValidator = z.array(roleCodeValidator).min(1)

export const accountRowValidator = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().min(1),
  phone: z.string(),
  status: userStatusValidator,
  roleCodes: accountRoleCodesValidator,
  lastLoginAt: z.string().datetime().nullable(),
})

export type AccountRow = z.infer<typeof accountRowValidator>

export const createAccountInputValidator = z.object({
  username: accountUsernameValidator,
  displayName: accountDisplayNameValidator,
  phone: accountPhoneValidator.optional().default(''),
  password: accountPasswordValidator,
  roleCodes: accountRoleCodesValidator,
})

export type CreateAccountInput = z.infer<typeof createAccountInputValidator>

export const updateAccountInputValidator = z.object({
  displayName: accountDisplayNameValidator.optional(),
  phone: accountPhoneValidator.optional(),
  status: userStatusValidator.optional(),
  roleCodes: accountRoleCodesValidator.optional(),
})

export type UpdateAccountInput = z.infer<typeof updateAccountInputValidator>

export const resetPasswordInputValidator = z.object({
  password: accountPasswordValidator,
})

export type ResetPasswordInput = z.infer<typeof resetPasswordInputValidator>
