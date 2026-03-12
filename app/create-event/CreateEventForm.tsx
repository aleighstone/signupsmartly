'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const slotSchema = z.object({
  role_name: z.string().min(1, 'Role name required'),
  role_description: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  capacity: z.number().min(1, 'At least 1'),
  instructions: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location required'),
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().optional(),
  slots: z.array(slotSchema).min(1, 'Add at least one role'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateEventFormProps {
  organizationId: string;
  createdBy: string;
}

export function CreateEventForm({
  organizationId,
  createdBy,
}: CreateEventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      start_date: '',
      end_date: '',
      slots: [
        {
          role_name: '',
          role_description: '',
          start_time: '',
          end_time: '',
          capacity: 1,
          instructions: '',
        },
      ],
    },
  });

  const slots = watch('slots');
  const [showEndDate, setShowEndDate] = useState(false);

  const addSlot = () => {
    setValue('slots', [
      ...slots,
      {
        role_name: '',
        role_description: '',
        start_time: '',
        end_time: '',
        capacity: 1,
        instructions: '',
      },
    ]);
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) return;
    setValue(
      'slots',
      slots.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const eventDate = data.start_date.split('T')[0];
      const endDateVal = data.end_date?.trim().split('T')[0];
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          created_by: createdBy,
          title: data.title,
          description: data.description || null,
          location: data.location || null,
          start_date: `${eventDate}T00:00:00Z`,
          end_date: endDateVal ? `${endDateVal}T23:59:59Z` : null,
          published: true,
          slots: data.slots.map((s) => ({
            role_name: s.role_name,
            role_description: s.role_description || null,
            start_time: s.start_time?.trim()
              ? `${eventDate}T${s.start_time}:00Z`
              : null,
            end_time: s.end_time?.trim()
              ? `${eventDate}T${s.end_time}:00Z`
              : null,
            capacity: s.capacity,
            instructions: s.instructions || null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create event');
      router.push(`/dashboard`);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-8">
      <section className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-charcoal mb-4 font-heading">
          Event Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1 font-body">
              Title <span className="text-coral">*</span>
            </label>
            <input
              {...register('title')}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              placeholder="Spring Track Meet #3"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-coral font-body">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1 font-body">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1 font-body">
              Location <span className="text-coral">*</span>
            </label>
            <input
              {...register('location')}
              className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              placeholder="Arcadia High School Track"
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                Start Date <span className="text-coral">*</span>
              </label>
              <input
                {...register('start_date')}
                type="date"
                className="w-full max-w-xs rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-coral font-body">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            {showEndDate ? (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                  End Date
                </label>
                <input
                  {...register('end_date')}
                  type="date"
                  className="w-full max-w-xs rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-coral font-body">
                    {errors.end_date.message}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowEndDate(false);
                    setValue('end_date', '');
                  }}
                  className="mt-1 text-sm text-muted hover:text-charcoal hover:underline font-body"
                >
                  Remove end date
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowEndDate(true)}
                className="text-sm text-muted hover:text-charcoal hover:underline font-body"
              >
                + Add end date
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-charcoal font-heading">
            Volunteer Roles
          </h2>
          <button
            type="button"
            onClick={addSlot}
            className="text-sm font-medium text-charcoal hover:text-muted transition-colors"
          >
            + Add Slot
          </button>
        </div>
        <div className="space-y-6">
          {slots.map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-charcoal/10 p-4 space-y-4 bg-sand/30"
            >
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted font-body">
                  Role {index + 1}
                </span>
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="text-sm text-coral hover:text-coral/80 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    Role name <span className="text-coral">*</span>
                  </label>
                  <input
                    {...register(`slots.${index}.role_name`)}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                    placeholder="Timer"
                  />
                  {errors.slots?.[index]?.role_name && (
                    <p className="mt-1 text-sm text-coral font-body">
                      {errors.slots[index]?.role_name?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    Capacity <span className="text-coral">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    {...register(`slots.${index}.capacity`, { valueAsNumber: true })}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    Start time <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <input
                    type="time"
                    {...register(`slots.${index}.start_time`)}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    End time <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <input
                    type="time"
                    {...register(`slots.${index}.end_time`)}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                  Instructions (optional)
                </label>
                <textarea
                  {...register(`slots.${index}.instructions`)}
                  rows={2}
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-charcoal placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                  placeholder="Any notes for volunteers"
                />
              </div>
            </div>
          ))}
        </div>
        {errors.slots?.root && (
          <p className="mt-2 text-sm text-coral font-body">{errors.slots.root.message}</p>
        )}
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-sage px-6 py-3 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60 transition-colors font-body"
      >
        {isSubmitting ? 'Creating…' : 'Create Event'}
      </button>
    </form>
  );
}
