'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  comment: z.string().max(500).optional(),
});

export type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  slotRoleName: string;
  onSubmit: (data: SignupFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function SignupForm({
  slotRoleName,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SignupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', comment: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted font-body">
        Signing up for <strong className="text-charcoal">{slotRoleName}</strong>
      </p>
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
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-sage px-4 py-2.5 text-sm font-medium text-white hover:bg-sage-hover focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-body"
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
