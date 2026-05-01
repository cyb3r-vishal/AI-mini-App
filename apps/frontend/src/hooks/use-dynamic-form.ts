'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Entity } from '@ai-gen/shared';
import { applyDefaults, buildCreateSchema, buildUpdateSchema } from '@ai-gen/shared';

export type FormValues = Record<string, unknown>;
export type FieldErrors = Record<string, string>;

/**
 * Client-side top-level error shape produced by a submit handler.
 * We accept the shape emitted by our backend's HttpError → 400 response.
 */
export interface SubmitError {
  message: string;
  /** Map of `fieldKey -> message` for field-level errors. */
  fieldErrors?: FieldErrors;
}

export interface UseDynamicFormOptions<TResult> {
  entity: Entity;
  /** Initial values (for edit mode). */
  initialValues?: FormValues;
  /** Create or update — switches required-field behavior. */
  mode?: 'create' | 'update';
  /** Called with the validated payload. Throw (or return a rejected promise) to surface errors. */
  onSubmit: (values: FormValues) => Promise<TResult>;
  /** Called after successful submit. Use for toasts, redirects, etc. */
  onSuccess?: (result: TResult) => void;
}

export interface UseDynamicFormReturn<TResult> {
  values: FormValues;
  setValue: (key: string, next: unknown) => void;
  setValues: (next: FormValues | ((prev: FormValues) => FormValues)) => void;
  reset: (next?: FormValues) => void;
  errors: FieldErrors;
  /** Top-level error (not tied to a specific field). */
  formError: string | null;
  /** Mark a field as "touched" to start showing its error. */
  touch: (key: string) => void;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  /** Attach to <form onSubmit={handleSubmit}>. */
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  /** Latest successful result — useful for optimistic UI. */
  lastResult: TResult | null;
}

/**
 * Config-driven form state hook.
 *
 * Responsibilities:
 *   - hold values, touched, errors
 *   - validate on-the-fly using the shared Zod builder
 *   - convert backend field-error responses into field-level errors
 *   - loading + dirty state
 *
 * Rendering is the caller's responsibility (via <DynamicForm /> or custom UI).
 */
export function useDynamicForm<TResult = unknown>(
  opts: UseDynamicFormOptions<TResult>,
): UseDynamicFormReturn<TResult> {
  const { entity, initialValues, mode = 'create', onSubmit, onSuccess } = opts;

  const initialRef = useRef<FormValues>(initialValues ?? {});
  const [values, setValuesState] = useState<FormValues>(() => initialRef.current);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<TResult | null>(null);

  const schema = useMemo(
    () => (mode === 'create' ? buildCreateSchema(entity) : buildUpdateSchema(entity)),
    [entity, mode],
  );

  const validate = useCallback(
    (next: FormValues): { ok: true } | { ok: false; errors: FieldErrors } => {
      const payload = mode === 'create' ? applyDefaults(entity, next) : next;
      const res = schema.safeParse(payload);
      if (res.success) return { ok: true };
      const flat = res.error.flatten().fieldErrors;
      const mapped: FieldErrors = {};
      for (const [key, msgs] of Object.entries(flat)) {
        if (msgs && msgs.length > 0) mapped[key] = msgs[0]!;
      }
      return { ok: false, errors: mapped };
    },
    [schema, mode, entity],
  );

  const setValue = useCallback(
    (key: string, next: unknown) => {
      setValuesState((prev) => ({ ...prev, [key]: next }));
      // Clear the error for that key as the user types (live validation only
      // re-asserts on submit / blur to avoid spamming red).
      setErrors((prev) => {
        if (!(key in prev)) return prev;
        const { [key]: _drop, ...rest } = prev;
        return rest;
      });
    },
    [],
  );

  const setValues = useCallback(
    (next: FormValues | ((prev: FormValues) => FormValues)) => {
      setValuesState((prev) => (typeof next === 'function' ? next(prev) : next));
    },
    [],
  );

  const reset = useCallback((next?: FormValues) => {
    const target = next ?? initialRef.current;
    initialRef.current = target;
    setValuesState(target);
    setErrors({});
    setTouched({});
    setFormError(null);
  }, []);

  const touch = useCallback((key: string) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const isDirty = useMemo(() => {
    const ref = initialRef.current;
    const keys = new Set([...Object.keys(ref), ...Object.keys(values)]);
    for (const k of keys) {
      if (!Object.is(ref[k], values[k])) return true;
    }
    return false;
  }, [values]);

  const isValid = useMemo(() => validate(values).ok, [validate, values]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault?.();
      if (isSubmitting) return;

      setFormError(null);
      const result = validate(values);
      if (!result.ok) {
        setErrors(result.errors);
        // Touch every errored field so the error is visible.
        setTouched((prev) => ({
          ...prev,
          ...Object.fromEntries(Object.keys(result.errors).map((k) => [k, true])),
        }));
        return;
      }

      setErrors({});
      setIsSubmitting(true);
      try {
        const payload =
          mode === 'create' ? applyDefaults(entity, values) : values;
        const res = await onSubmit(payload);
        setLastResult(res);
        onSuccess?.(res);
      } catch (err) {
        const mapped = extractSubmitError(err);
        setFormError(mapped.message);
        if (mapped.fieldErrors) {
          setErrors(mapped.fieldErrors);
          setTouched((prev) => ({
            ...prev,
            ...Object.fromEntries(Object.keys(mapped.fieldErrors!).map((k) => [k, true])),
          }));
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [entity, isSubmitting, mode, onSubmit, onSuccess, validate, values],
  );

  return {
    values,
    setValue,
    setValues,
    reset,
    errors,
    formError,
    touch,
    touched,
    isSubmitting,
    isDirty,
    isValid,
    handleSubmit,
    lastResult,
  };
}

/**
 * Translate backend or network errors into a structured { message, fieldErrors }.
 * Backend responses use { code, message, details: { field: [msg, ...] } }.
 */
function extractSubmitError(err: unknown): SubmitError {
  if (!err || typeof err !== 'object') return { message: 'Something went wrong' };

  const maybe = err as {
    message?: string;
    details?: unknown;
    status?: number;
  };

  const message = typeof maybe.message === 'string' ? maybe.message : 'Request failed';

  // Handle { details: { field: [msg] } } from backend HttpError flatten.
  const d = maybe.details;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const fieldErrors: FieldErrors = {};
    for (const [key, value] of Object.entries(d)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        fieldErrors[key] = value[0];
      } else if (typeof value === 'string') {
        fieldErrors[key] = value;
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      return { message, fieldErrors };
    }
  }

  return { message };
}
