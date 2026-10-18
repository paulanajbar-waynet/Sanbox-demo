"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { z } from "zod";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ApiError } from "../api/apiCall";
import type { FieldErrors } from "../api/types";

type FormSchema = z.ZodObject;

export interface CrudFormField<S extends FormSchema> {
  name: keyof z.input<S> & string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "textarea";
  placeholder?: string;
  description?: string;
}

export interface CrudFormProps<S extends FormSchema> {
  /** The same Zod schema the API route validates with. */
  schema: S;
  fields: CrudFormField<S>[];
  initialValues?: Partial<Record<keyof z.input<S> & string, string>>;
  /** Throw `ApiError` (e.g. via `apiCallOrThrow`) to show server field errors. */
  onSubmit: (values: z.output<S>) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

type Values = Record<string, string>;

/**
 * Empty optional inputs become `undefined`; empty required ones stay `""` so the schema's own
 * message ("Name is required") is shown. Number inputs become numbers.
 */
function toInput<S extends FormSchema>(schema: S, fields: CrudFormField<S>[], values: Values): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = values[field.name] ?? "";
    if (raw === "") {
      const acceptsMissing = schema.shape[field.name]?.safeParse(undefined).success ?? true;
      if (!acceptsMissing && field.type !== "number") input[field.name] = "";
      continue;
    }
    input[field.name] = field.type === "number" ? Number(raw) : raw;
  }
  return input;
}

function zodFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

export function CrudForm<S extends FormSchema>({
  schema,
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
}: CrudFormProps<S>) {
  const [values, setValues] = useState<Values>(initialValues as Values);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError(null);

    const parsed = schema.safeParse(toInput(schema, fields, values));
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(parsed.data as z.output<S>);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setFieldErrors(error.fieldErrors ?? {});
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    } else if (event.key === "Escape" && onCancel) {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
      {fields.map((field) => {
        const id = `crud-form-${field.name}`;
        const errors = fieldErrors[field.name];
        const describedBy = [field.description && `${id}-description`, errors && `${id}-error`].filter(Boolean).join(" ");
        const common = {
          id,
          name: field.name,
          value: values[field.name] ?? "",
          placeholder: field.placeholder,
          disabled: isSubmitting,
          "aria-invalid": errors ? true : undefined,
          "aria-describedby": describedBy || undefined,
        };
        const update = (value: string) => setValues((prev) => ({ ...prev, [field.name]: value }));

        return (
          <div key={field.name} className="flex flex-col gap-2">
            <Label htmlFor={id}>{field.label}</Label>
            {field.type === "textarea" ? (
              <textarea
                {...common}
                onChange={(e) => update(e.target.value)}
                className="min-h-24 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs"
              />
            ) : (
              <Input {...common} type={field.type ?? "text"} onChange={(e) => update(e.target.value)} />
            )}
            {field.description && (
              <p id={`${id}-description`} className="text-sm text-muted-foreground">
                {field.description}
              </p>
            )}
            {errors && (
              <p id={`${id}-error`} className="text-sm text-destructive">
                {errors.join(" ")}
              </p>
            )}
          </div>
        );
      })}

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
