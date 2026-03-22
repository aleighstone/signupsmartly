'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  comment: z.string().max(500).optional(),
  reminder_opt_in: z.boolean(),
  reminder_offset: z.enum(['1_day', 'morning_of']),
});

export type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  slotRoleName: string;
  slotDetails?: string | null;
  showReminders: boolean;
  modalTitleId?: string;
  onSubmit: (data: SignupFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  primaryColor?: string;
}

export function SignupForm({
  slotRoleName,
  slotDetails,
  showReminders,
  modalTitleId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error = null,
  primaryColor,
}: SignupFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
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
          Comment <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="comment"
          rows={2}
          {...register('comment')}
          className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body resize-none disabled:opacity-60"
          placeholder="Any notes for the organizer?"
          disabled={isSubmitting}
        />
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
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-body ${!primaryColor ? 'bg-sage hover:bg-sage-hover focus:ring-sage' : 'hover:opacity-90 focus:ring-sage'}`}
          style={primaryColor ? { backgroundColor: primaryColor } : undefined}
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
