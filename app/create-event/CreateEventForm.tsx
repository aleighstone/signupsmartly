'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const slotSchema = z.object({
  role_name: z.string().min(1, 'Role name required'),
  role_description: z.string().optional(),
  start_time: z.string().min(1, 'Start time required'),
  end_time: z.string().min(1, 'End time required'),
  capacity: z.number().min(1, 'At least 1'),
  instructions: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().min(1, 'End date required'),
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
          end_date: `${data.end_date.split('T')[0] || eventDate}T23:59:59Z`,
          published: true,
          slots: data.slots.map((s) => ({
            role_name: s.role_name,
            role_description: s.role_description || null,
            start_time: `${eventDate}T${s.start_time}:00Z`,
            end_time: `${eventDate}T${s.end_time}:00Z`,
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
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Event Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Title
            </label>
            <input
              {...register('title')}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="Spring Track Meet #3"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Location
            </label>
            <input
              {...register('location')}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="Arcadia High School Track"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Start Date
              </label>
              <input
                {...register('start_date')}
                type="date"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                End Date
              </label>
              <input
                {...register('end_date')}
                type="date"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              />
              {errors.end_date && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.end_date.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Volunteer Roles
          </h2>
          <button
            type="button"
            onClick={addSlot}
            className="text-sm font-medium text-neutral-900 hover:text-neutral-600"
          >
            + Add Slot
          </button>
        </div>
        <div className="space-y-6">
          {slots.map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-neutral-200 p-4 space-y-4"
            >
              <div className="flex justify-between">
                <span className="text-sm font-medium text-neutral-500">
                  Role {index + 1}
                </span>
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Role name
                  </label>
                  <input
                    {...register(`slots.${index}.role_name`)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                    placeholder="Timer"
                  />
                  {errors.slots?.[index]?.role_name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.slots[index]?.role_name?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    {...register(`slots.${index}.capacity`, { valueAsNumber: true })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Start time
                  </label>
                  <input
                    type="time"
                    {...register(`slots.${index}.start_time`)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                  {errors.slots?.[index]?.start_time && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.slots[index]?.start_time?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    End time
                  </label>
                  <input
                    type="time"
                    {...register(`slots.${index}.end_time`)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  />
                  {errors.slots?.[index]?.end_time && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.slots[index]?.end_time?.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Instructions (optional)
                </label>
                <textarea
                  {...register(`slots.${index}.instructions`)}
                  rows={2}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                  placeholder="Any notes for volunteers"
                />
              </div>
            </div>
          ))}
        </div>
        {errors.slots?.root && (
          <p className="mt-2 text-sm text-red-600">{errors.slots.root.message}</p>
        )}
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {isSubmitting ? 'Creating…' : 'Create Event'}
      </button>
    </form>
  );
}
