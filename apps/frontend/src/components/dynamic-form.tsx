'use client';

import { useMemo } from 'react';
import type { Entity, Field } from '@ai-gen/shared';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormRow,
} from '@/components/ui';
import { FieldRenderer } from '@/registry';
import { useDynamicForm, type FormValues } from '@/hooks/use-dynamic-form';
import { cn } from '@/lib/cn';

/**
 * <DynamicForm />
 *
 * A production-ready, config-driven form.
 *
 *   <DynamicForm
 *     entity={entity}
 *     fields={page.fields}             // optional — explicit order/subset
 *     mode="create"                    // or "update"
 *     initialValues={values}
 *     submitLabel="Create customer"
 *     layout="grid"
 *     onSubmit={(values) => api.records.create(appId, entity.key, values)}
 *     onSuccess={(record) => router.push(...)}
 *   />
 *
 * Handles:
 *   - Missing entity     → visible error card (no crash).
 *   - Missing fields     → skipped silently.
 *   - Unknown field type → renders via the registry's UnknownField fallback.
 *   - Loading, validation, error, success (reset vs stay) states.
 *   - Backend field-level errors mapped to the correct field.
 */

export interface DynamicFormProps<TResult = unknown> {
  entity: Entity | undefined;
  /** Optional explicit list of field keys (order + subset). */
  fields?: string[];
  mode?: 'create' | 'update';
  initialValues?: FormValues;

  layout?: 'vertical' | 'grid' | 'horizontal';
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;

  /** Called with the validated payload. Throw to surface errors. */
  onSubmit: (values: FormValues) => Promise<TResult>;
  /** Called after successful submit. Defaults: resets in create mode. */
  onSuccess?: (result: TResult) => void;

  /** Wrap form in a <Card>. Defaults to true. */
  card?: boolean;
  title?: React.ReactNode;
  className?: string;

  /** Disable the whole form (e.g. during a parent fetch). */
  disabled?: boolean;
  /** Override the default "reset on create success" behavior. */
  resetOnSuccess?: boolean;
}

export function DynamicForm<TResult = unknown>({
  entity,
  fields,
  mode = 'create',
  initialValues,
  layout = 'vertical',
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  onSubmit,
  onSuccess,
  card = true,
  title,
  className,
  disabled,
  resetOnSuccess,
}: DynamicFormProps<TResult>) {
  // Resolve field list from entity + optional explicit order.
  const resolvedFields = useMemo<Field[]>(() => {
    if (!entity) return [];
    if (!fields || fields.length === 0) return entity.fields;
    return fields
      .map((k) => entity.fields.find((f) => f.key === k))
      .filter((f): f is Field => !!f);
  }, [entity, fields]);

  // Stable entity reference for the hook — avoid "undefined entity" issues.
  const safeEntity: Entity = useMemo(
    () =>
      entity ?? {
        key: '__missing__',
        name: 'Missing entity',
        fields: [],
        timestamps: true,
      },
    [entity],
  );

  const form = useDynamicForm<TResult>({
    entity: safeEntity,
    mode,
    initialValues,
    onSubmit: async (v) => {
      const result = await onSubmit(v);
      return result;
    },
    onSuccess: (result) => {
      onSuccess?.(result);
      const shouldReset = resetOnSuccess ?? mode === 'create';
      if (shouldReset) form.reset({});
    },
  });

  // ---------- Guard rails -------------------------------------------------
  if (!entity) {
    return (
      <Card tone="ember">
        <CardBody>
          <p className="text-sm text-paper-700">
            This form references an entity that no longer exists in the app config.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (resolvedFields.length === 0) {
    return (
      <Card tone="sun">
        <CardBody>
          <p className="text-sm text-paper-700">
            Entity <code>{entity.key}</code> has no fields to render.
          </p>
        </CardBody>
      </Card>
    );
  }

  // ---------- Render ------------------------------------------------------
  const cols = layout === 'grid' ? 2 : 1;

  const body = (
    <Form
      onSubmit={form.handleSubmit}
      aria-busy={form.isSubmitting || undefined}
      className={cn('relative', className)}
    >
      {form.formError && (
        <div
          role="alert"
          className="rounded-block border-3 border-ember-300 bg-ember-50 px-4 py-3 text-sm text-ember-600"
        >
          {form.formError}
        </div>
      )}

      <FormRow cols={cols as 1 | 2}>
        {resolvedFields.map((field, idx) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={form.values[field.key]}
            onChange={(next) => form.setValue(field.key, next)}
            onBlur={() => form.touch(field.key)}
            error={form.touched[field.key] ? form.errors[field.key] : undefined}
            disabled={disabled || form.isSubmitting}
            autoFocus={idx === 0}
          />
        ))}
      </FormRow>

      <div className="flex flex-col-reverse items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={form.isSubmitting}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          loading={form.isSubmitting}
          disabled={disabled || form.isSubmitting || (mode === 'update' && !form.isDirty)}
        >
          {submitLabel}
        </Button>
      </div>
    </Form>
  );

  if (!card) return body;

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardBody>{body}</CardBody>
      {mode === 'update' && form.lastResult !== null && (
        <CardFooter>
          <p className="text-xs text-paper-500">Saved ✓</p>
        </CardFooter>
      )}
    </Card>
  );
}
