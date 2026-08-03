import { z } from 'zod';

export const formSubmissionSchema = z.object({
  data: z.record(z.any()),
  fieldOrder: z.array(z.string()).optional()
});

export function validateFormData(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedData = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

export function transformFormDataToRow(formData, fieldOrder) {
  if (fieldOrder) {
    return fieldOrder.map(field => formData[field] || '');
  }
  return Object.values(formData);
}
