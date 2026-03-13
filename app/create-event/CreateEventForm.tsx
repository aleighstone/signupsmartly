'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type SignupType = 'scheduled' | 'simple';

const scheduledSlotSchema = z.object({
  spot_date: z.string().min(1, 'Date required'),
  role_name: z.string().min(1, 'Spot name required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  capacity: z.number().min(1, 'At least 1'),
  instructions: z.string().optional(),
});

const simpleSlotSchema = z.object({
  role_name: z.string().min(1, 'Item name required'),
  role_description: z.string().optional(),
  capacity: z.number().min(1, 'At least 1'),
});

const scheduledFormSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location required'),
  slots: z.array(scheduledSlotSchema).min(1, 'Add at least one spot'),
});

const simpleFormSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  slots: z.array(simpleSlotSchema).min(1, 'Add at least one item'),
});

type ScheduledFormData = z.infer<typeof scheduledFormSchema>;
type SimpleFormData = z.infer<typeof simpleFormSchema>;

function SignupTypeHelpModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-xl bg-surface p-6 shadow-soft-md">
        <div className="flex items-start justify-between gap-4">
          <h2 id="help-modal-title" className="text-lg font-semibold text-charcoal font-heading">
            Signup Types
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-muted hover:text-charcoal hover:bg-charcoal/5 transition-colors"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-charcoal font-body leading-relaxed">
          <p>
            <strong>Choose organize by schedule</strong> if you need people to sign up for days
            and/or time slots for a scheduled event. e.g. team snack duty by game date, teacher
            conferences by day and time, track meet volunteers for events by shift.
          </p>
          <p>
            <strong>Choose simple list</strong> if you need people to sign up for items that
            aren&apos;t bound by date or time. There can still be an optional date associated
            with a simple list, but this list will be sorted by item name, not date or time. e.g.
            request potluck items by type, request donations, request chaperones for a field trip.
          </p>
        </div>
      </div>
    </div>
  );
}

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
  const [signupType, setSignupType] = useState<SignupType>('scheduled');
  const [helpOpen, setHelpOpen] = useState(false);

  const scheduledForm = useForm<ScheduledFormData>({
    resolver: zodResolver(scheduledFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      slots: [
        { spot_date: '', role_name: '', start_time: '', end_time: '', capacity: 1, instructions: '' },
      ],
    },
  });

  const simpleForm = useForm<SimpleFormData>({
    resolver: zodResolver(simpleFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      start_date: '',
      slots: [{ role_name: '', role_description: '', capacity: 1 }],
    },
  });

  const scheduledSlots = scheduledForm.watch('slots');
  const simpleSlots = simpleForm.watch('slots');

  const addScheduledSlot = () => {
    const prev = scheduledSlots[scheduledSlots.length - 1];
    scheduledForm.setValue('slots', [
      ...scheduledSlots,
      {
        spot_date: prev?.spot_date || '',
        role_name: '',
        start_time: '',
        end_time: '',
        capacity: 1,
        instructions: '',
      },
    ]);
  };

  const addSimpleSlot = () => {
    simpleForm.setValue('slots', [
      ...simpleSlots,
      { role_name: '', role_description: '', capacity: 1 },
    ]);
  };

  const removeScheduledSlot = (index: number) => {
    if (scheduledSlots.length <= 1) return;
    scheduledForm.setValue('slots', scheduledSlots.filter((_, i) => i !== index));
  };

  const removeSimpleSlot = (index: number) => {
    if (simpleSlots.length <= 1) return;
    simpleForm.setValue('slots', simpleSlots.filter((_, i) => i !== index));
  };

  const onSubmitScheduled = async (data: ScheduledFormData) => {
    setIsSubmitting(true);
    try {
      const dates = data.slots.map((s) => s.spot_date).filter(Boolean);
      const startDate = dates.length ? dates[0] : null;
      const endDate = dates.length
        ? (dates.length === 1 ? dates[0] : dates.reduce((a, b) => (a > b ? a : b)))
        : null;
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          created_by: createdBy,
          signup_type: 'scheduled',
          title: data.title,
          description: data.description || null,
          location: data.location || null,
          start_date: startDate ? `${startDate}T00:00:00Z` : null,
          end_date: endDate ? `${endDate}T23:59:59Z` : null,
          published: true,
          slots: data.slots.map((s) => ({
            role_name: s.role_name,
            role_description: s.instructions || null,
            start_time: s.spot_date
              ? `${s.spot_date}T${s.start_time?.trim() || '00:00'}:00Z`
              : null,
            end_time: s.spot_date
              ? `${s.spot_date}T${s.end_time?.trim() || '23:59'}:00Z`
              : null,
            capacity: s.capacity,
            instructions: null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitSimple = async (data: SimpleFormData) => {
    setIsSubmitting(true);
    try {
      const dateVal = data.start_date?.trim();
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          created_by: createdBy,
          signup_type: 'simple',
          title: data.title,
          description: data.description || null,
          location: data.location || null,
          start_date: dateVal ? `${dateVal}T00:00:00Z` : null,
          end_date: dateVal ? `${dateVal}T23:59:59Z` : null,
          published: true,
          slots: data.slots.map((s) => ({
            role_name: s.role_name,
            role_description: s.role_description || null,
            start_time: null,
            end_time: null,
            capacity: s.capacity,
            instructions: null,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.error || 'Failed to create';
        const extra = json.details || json.code ? ` — ${JSON.stringify({ details: json.details, code: json.code })}` : '';
        throw new Error(`${msg}${extra}`);
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SignupTypeHelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      <div className="mt-6 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-charcoal font-body">
            I need to
          </span>
          <select
            value={signupType}
            onChange={(e) => setSignupType(e.target.value as SignupType)}
            className="min-w-[220px] appearance-none rounded-xl border border-charcoal/20 bg-surface bg-no-repeat bg-[length:14px_14px] pl-3 pr-11 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
              backgroundPosition: 'right 0.75rem center',
            }}
            aria-label="Signup type"
          >
            <option value="scheduled">organize by schedule</option>
            <option value="simple">request items in a simple list</option>
          </select>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="group flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full p-2.5 font-body"
            aria-label="Help"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-charcoal text-xs font-medium leading-none text-white transition-opacity group-hover:opacity-90">
              ?
            </span>
          </button>
        </div>

        {signupType === 'scheduled' ? (
          <form
            onSubmit={scheduledForm.handleSubmit(onSubmitScheduled)}
            className="space-y-8"
          >
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
                    {...scheduledForm.register('title')}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                    placeholder="Falcons track meet #2"
                  />
                  {scheduledForm.formState.errors.title && (
                    <p className="mt-1 text-sm text-coral font-body">
                      {scheduledForm.formState.errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    Description
                  </label>
                  <textarea
                    {...scheduledForm.register('description')}
                    rows={3}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    Location <span className="text-coral">*</span>
                  </label>
                  <input
                    {...scheduledForm.register('location')}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                    placeholder="Sunny High School track"
                  />
                  {scheduledForm.formState.errors.location && (
                    <p className="mt-1 text-sm text-coral font-body">
                      {scheduledForm.formState.errors.location.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-charcoal font-heading">
                  Scheduled spots
                </h2>
                <button
                  type="button"
                  onClick={addScheduledSlot}
                  className="text-sm font-medium text-charcoal hover:text-muted transition-colors"
                >
                  + Add spot
                </button>
              </div>
              <div className="space-y-6">
                {scheduledSlots.map((_, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-charcoal/10 p-4 space-y-4 bg-sand/30"
                  >
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted font-body">
                        Spot {index + 1}
                      </span>
                      {scheduledSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduledSlot(index)}
                          className="text-sm text-coral hover:text-coral/80"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                        Date <span className="text-coral">*</span>
                      </label>
                      <input
                        type="date"
                        {...scheduledForm.register(`slots.${index}.spot_date`)}
                        className="w-full max-w-xs rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                      />
                      {scheduledForm.formState.errors.slots?.[index]?.spot_date && (
                        <p className="mt-1 text-sm text-coral font-body">
                          {scheduledForm.formState.errors.slots?.[index]?.spot_date?.message}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                          Start time <span className="text-muted font-normal">(optional)</span>
                        </label>
                        <input
                          type="time"
                          {...scheduledForm.register(`slots.${index}.start_time`)}
                          className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                          End time <span className="text-muted font-normal">(optional)</span>
                        </label>
                        <input
                          type="time"
                          {...scheduledForm.register(`slots.${index}.end_time`)}
                          className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                          Spot name <span className="text-coral">*</span>
                        </label>
                        <input
                        {...scheduledForm.register(`slots.${index}.role_name`)}
                          className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                        placeholder="Announcer"
                        />
                        {scheduledForm.formState.errors.slots?.[index]?.role_name && (
                          <p className="mt-1 text-sm text-coral font-body">
                            {scheduledForm.formState.errors.slots?.[index]?.role_name?.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                          Need <span className="text-coral">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          {...scheduledForm.register(`slots.${index}.capacity`, {
                            valueAsNumber: true,
                          })}
                          className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                        Instructions <span className="text-muted font-normal">(optional)</span>
                      </label>
                      <textarea
                        {...scheduledForm.register(`slots.${index}.instructions`)}
                        rows={2}
                        className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                        placeholder="Any notes for volunteers"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-sage px-6 py-3 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60 transition-colors font-body"
            >
              {isSubmitting ? 'Creating…' : 'Create Signup'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={simpleForm.handleSubmit(onSubmitSimple)}
            className="space-y-8"
          >
            <section className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-charcoal mb-4 font-heading">
                Signup Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    Title <span className="text-coral">*</span>
                  </label>
                  <input
                    {...simpleForm.register('title')}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                    placeholder="Potluck items"
                  />
                  {simpleForm.formState.errors.title && (
                    <p className="mt-1 text-sm text-coral font-body">
                      {simpleForm.formState.errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    Description
                  </label>
                  <textarea
                    {...simpleForm.register('description')}
                    rows={3}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    Location
                  </label>
                  <input
                    {...simpleForm.register('location')}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                    Date <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    {...simpleForm.register('start_date')}
                    className="w-full max-w-xs rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-charcoal font-heading">
                  Items
                </h2>
                <button
                  type="button"
                  onClick={addSimpleSlot}
                  className="text-sm font-medium text-charcoal hover:text-muted transition-colors"
                >
                  + Add item
                </button>
              </div>
              <div className="space-y-6">
                {simpleSlots.map((_, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-charcoal/10 p-4 space-y-4 bg-sand/30"
                  >
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted font-body">
                        Item {index + 1}
                      </span>
                      {simpleSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSimpleSlot(index)}
                          className="text-sm text-coral hover:text-coral/80"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                        Item name <span className="text-coral">*</span>
                      </label>
                      <input
                        {...simpleForm.register(`slots.${index}.role_name`)}
                        className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                        placeholder="Entree"
                      />
                      {simpleForm.formState.errors.slots?.[index]?.role_name && (
                        <p className="mt-1 text-sm text-coral font-body">
                          {simpleForm.formState.errors.slots?.[index]?.role_name?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                        Description <span className="text-muted font-normal">(optional)</span>
                      </label>
                      <textarea
                        {...simpleForm.register(`slots.${index}.role_description`)}
                        rows={2}
                        className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body placeholder:text-muted/70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                        Need <span className="text-coral">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        {...simpleForm.register(`slots.${index}.capacity`, {
                          valueAsNumber: true,
                        })}
                        className="w-full max-w-[100px] rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-sage px-6 py-3 text-sm font-medium text-white hover:bg-sage-hover disabled:opacity-60 transition-colors font-body"
            >
              {isSubmitting ? 'Creating…' : 'Create Signup'}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
