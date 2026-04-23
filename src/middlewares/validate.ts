import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    }) as any;
    
    // Update request with parsed/validated data
    req.body = result.body;
    req.query = result.query;
    req.params = result.params;
    
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues;
      console.error('Zod Validation Error:', JSON.stringify(issues, null, 2));
      const firstError = issues[0];
      const path = firstError.path.join('.');
      const message = firstError.message;
      
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${path} - ${message}`,
        issues: issues // Return all issues for easier debugging
      });
    }
    return res.status(500).json({ success: false, error: 'Internal server error during validation' });
  }
};
