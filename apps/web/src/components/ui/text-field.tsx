"use client";

import {
  FieldError,
  Input,
  Label,
  Text,
  TextField as AriaTextField,
  type TextFieldProps,
} from "react-aria-components";

/**
 * Campo de texto.
 *
 * `etiqueta` es obligatoria en el tipo: un campo sin `<label>` asociado no
 * compila. Es la respuesta al hallazgo de la auditoría — 159 campos de
 * formulario y 22 `label for=` — y el motivo de que este componente exista en
 * lugar de usar `<Input>` suelto.
 *
 * React Aria enlaza por su cuenta el `id` de la etiqueta, el
 * `aria-describedby` de la descripción y del error, y `aria-invalid`
 * (WCAG 2.2 · 1.3.1, 3.3.1, 3.3.2).
 */
interface Props extends Omit<TextFieldProps, "children"> {
  /** Texto de la etiqueta. Nunca un placeholder: desaparece al escribir. */
  etiqueta: string;
  /** Ayuda permanente bajo el campo. Se asocia con aria-describedby. */
  descripcion?: string;
  /** Mensaje de error. Su presencia marca el campo como inválido. */
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}

export function TextField({
  etiqueta,
  descripcion,
  error,
  placeholder,
  autoComplete,
  ...props
}: Props) {
  return (
    <AriaTextField
      {...props}
      isInvalid={Boolean(error) || props.isInvalid}
      className="flex flex-col gap-1.5"
    >
      <Label className="text-sm font-semibold text-ink">{etiqueta}</Label>

      <Input
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={[
          "rounded-xs border bg-surface px-3 py-2.5",
          "text-ink placeholder:text-ink-soft",
          "data-[invalid]:border-danger-text",
          "border-border",
        ].join(" ")}
      />

      {descripcion ? (
        <Text slot="description" className="text-sm text-ink-soft">
          {descripcion}
        </Text>
      ) : null}

      {/* El error se anuncia por su asociación con el campo; no necesita una
          región en vivo propia, que duplicaría el aviso. */}
      <FieldError className="text-sm font-medium text-danger-text">
        {error}
      </FieldError>
    </AriaTextField>
  );
}
