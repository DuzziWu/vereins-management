import { z } from 'zod'

// Schema for creating a new todo
export const createTodoSchema = z.object({
  content: z
    .string()
    .min(1, 'Aufgabe darf nicht leer sein')
    .max(200, 'Aufgabe darf maximal 200 Zeichen haben')
    .trim()
})

// Schema for updating a todo
export const updateTodoSchema = z.object({
  content: z
    .string()
    .min(1, 'Aufgabe darf nicht leer sein')
    .max(200, 'Aufgabe darf maximal 200 Zeichen haben')
    .trim()
    .optional(),
  is_completed: z.boolean().optional()
}).refine(
  data => data.content !== undefined || data.is_completed !== undefined,
  { message: 'Mindestens ein Feld muss aktualisiert werden' }
)

export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
