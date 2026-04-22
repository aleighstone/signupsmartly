'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DEFAULT_COMMENT_LABEL, normalizeCommentLabel } from '@/lib/slot-comment';
import { volunteerReminderOffsetZod } from '@/lib/reminder-offset';

function disclosureFieldWord(commentLabel: string | undefined): string {
  const n = normalizeCommentLabel(commentLabel ?? '');
  return n === DEFAULT_COMMENT_LABEL ? 'comment' : n;
}

const baseSignupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  comment: z.string().max(500).optional(),
  reminder_opt_in: z.boolean(),
  reminder_offset: volunteerReminderOffsetZod,
});

function buildSignupSchema(commentRequired: boolean) {
  return baseSignupSchema.superRefine((data, ctx) => {
    if (commentRequired && !(data.comment ?? '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'This field is required for this spot.',
        path: ['comment'],
      });
    }
  });
}

export type SignupFormData = z.infer<typeof baseSignupSchema>;

interface SignupFormProps {
  slotRoleName: string;
  /** Date + time for scheduled slots (shown under title). */
  slotWhen?: string | null;
  slotDetails?: string | null;
  /** Label for the comment/notes field (from organizer). */
  commentLabel?: string;
  /** When true, comment must be non-empty after trim. */
  commentRequired?: boolean;
  /** When true, show privacy note about name (and comment if public) on the signup page. */
  showSignupsPublic?: boolean;
  commentShowPublicly?: boolean;
  showReminders: boolean;
  modalTitleId?: string;
  onSubmit: (data: SignupFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  primaryColor?: string;
  /** Public event page: primary button uses --theme-primary / --theme-btn-text */
  volunteerPageThemed?: boolean;
}

export function SignupForm({
  slotRoleName,
  slotWhen,
  slotDetails,
  commentLabel = DEFAULT_COMMENT_LABEL,
  commentRequired = false,
  showSignupsPublic = false,
  commentShowPublicly = false,
  showReminders,
  modalTitleId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
  primaryColor,
  volunteerPageThemed = false,
}: SignupFormProps) {
  const schema = useMemo(
    () => buildSignupSchema(commentRequired),
    [commentRequired]
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      comment: '',
      reminder_opt_in: true,
      reminder_offset: '1_day',
    },
  });

  const reminderOptIn = watch('reminder_opt_in');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <p className="rounded-xl bg-coral p-3 text-sm text-white font-body">
          {error}
        </p>
      )}
      <div className="mb-4">
        <h2
          id={modalTitleId}
          className="text-lg font-semibold text-charcoal font-heading"
        >
          Sign up for {slotRoleName}
        </h2>
        {slotWhen && (
          <p className="mt-1 text-sm font-medium text-charcoal font-body">
            {slotWhen}
          </p>
        )}
        {slotDetails && (
          <p className="mt-1 text-sm text-muted font-body">{slotDetails}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-charcoal mb-1 font-body"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          {...register('name')}
          className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60"
          placeholder="Your name"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-coral font-body">{errors.name.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-charcoal mb-1 font-body"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60"
          placeholder="you@example.com"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-coral font-body">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-charcoal mb-1 font-body"
        >
          {commentLabel}
          {commentRequired ? (
            <span className="text-coral"> *</span>
          ) : (
            <span className="text-muted font-normal"> (optional)</span>
          )}
        </label>
        <textarea
          id="comment"
          rows={2}
          {...register('comment')}
          className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body resize-none disabled:opacity-60"
          placeholder={
            commentLabel === DEFAULT_COMMENT_LABEL
              ? 'Any notes for the organizer?'
              : `Enter ${commentLabel.toLowerCase()}`
          }
          disabled={isSubmitting}
          aria-required={commentRequired}
        />
        {errors.comment && (
          <p className="mt-1 text-sm text-coral font-body">{errors.comment.message}</p>
        )}
        {showSignupsPublic && (
          <p className="mt-3 text-xs text-muted font-body">
            Your name
            {commentShowPublicly
              ? ` and ${disclosureFieldWord(commentLabel)}`
              : ''}{' '}
            will be visible to others viewing this signup page.
          </p>
        )}
      </div>
      {showReminders && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-charcoal font-body">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-charcoal/30 text-sage focus:ring-sage/40"
              disabled={isSubmitting}
              {...register('reminder_opt_in')}
            />
            <span>Send a reminder</span>
          </label>
          {reminderOptIn && (
            <div className="sm:min-w-[200px]">
              <label htmlFor="reminder_offset" className="sr-only">
                Reminder timing
              </label>
              <select
                id="reminder_offset"
                className="w-full appearance-none rounded-xl border border-charcoal/20 bg-white bg-no-repeat bg-[length:14px_14px] pl-3 pr-11 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
                  backgroundPosition: 'right 0.75rem center',
                }}
                disabled={isSubmitting}
                {...register('reminder_offset')}
              >
                <option value="1_week">1 week before</option>
                <option value="3_days">3 days before</option>
                <option value="1_day">1 day before</option>
                <option value="morning_of">Morning of the event</option>
              </select>
            </div>
          )}
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity font-body ${
            volunteerPageThemed
              ? 'hover:opacity-90 focus:ring-charcoal/30'
              : primaryColor
                ? 'text-white hover:opacity-90 focus:ring-sage'
                : 'bg-sage hover:bg-sage-hover text-white focus:ring-sage'
          }`}
          style={
            volunteerPageThemed
              ? {
                  backgroundColor: 'var(--theme-primary)',
                  color: 'var(--theme-btn-text)',
                }
              : primaryColor
                ? { backgroundColor: primaryColor, color: '#fff' }
                : undefined
          }
        >
          {isSubmitting ? 'Signing up…' : 'Confirm Signup'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl border-2 border-charcoal bg-transparent px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-charcoal/5 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-2 disabled:opacity-60 transition-colors font-body"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
