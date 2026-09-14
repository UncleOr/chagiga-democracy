"use client";

export function ConfirmSubmit({
  confirmText,
  className,
  children,
  formAction,
}: {
  confirmText: string;
  className?: string;
  children: React.ReactNode;
  /** Optional server action to submit this button to (overrides the form's action). */
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <button
      type="submit"
      className={className}
      formAction={formAction}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
