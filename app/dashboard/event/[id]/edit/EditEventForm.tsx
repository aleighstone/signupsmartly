'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePostHog } from '@posthog/react';
import { Controller, useFieldArray, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { slotTimestampsToFormFields } from '@/lib/calendar';
import { DEFAULT_COMMENT_LABEL } from '@/lib/slot-comment';
import type { EventWithSlots, SlotWithSignups } from '@/types/database';
import { CustomizeAppearanceSection } from '@/components/EventThemePickers';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { SlotCardActions } from '@/components/SlotCardActions';
import { DEFAULT_COLOR_KEY, DEFAULT_FONT_KEY } from '@/data/themes';

interface EditEventFormProps {
  event: EventWithSlots;
}

const isSimple = (e: EventWithSlots) => e.signup_type === 'simple';
const slotLabel = (e: EventWithSlots) => (isSimple(e) ? 'Item' : 'Spot');
const slotsLabel = (e: EventWithSlots) => (isSimple(e) ? 'Items' : 'Spots');

function seedThemeKeys(ev: EventWithSlots): { colorKey: string; fontKey: string } {
  const raw = ev.theme;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    return {
      colorKey: typeof o.colorKey === 'string' ? o.colorKey : DEFAULT_COLOR_KEY,
      fontKey: typeof o.fontKey === 'string' ? o.fontKey : DEFAULT_FONT_KEY,
    };
  }
  return { colorKey: DEFAULT_COLOR_KEY, fontKey: DEFAULT_FONT_KEY };
}

const scheduledSlotSchema = z.object({
  id: z.string().uuid().optional(),
  spot_date: z.string().optional(),
  role_name: z.string().min(1),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  capacity: z.number().min(1),
  instructions: z.string().max(800, 'Max 800 characters').optional(),
  comment_label: z.string().max(60, 'Max 60 characters').optional(),
  comment_required: z.boolean().optional(),
});

const simpleSlotSchema = z.object({
  id: z.string().uuid().optional(),
  role_name: z.string().min(1),
  capacity: z.number().min(1),
  role_description: z.string().max(800, 'Max 800 characters').optional(),
  comment_label: z.string().max(60, 'Max 60 characters').optional(),
  comment_required: z.boolean().optional(),
});

const scheduledFormSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  show_signups: z.boolean().optional(),
  slots: z.array(scheduledSlotSchema).min(1),
});

const simpleFormSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  show_signups: z.boolean().optional(),
  slots: z.array(simpleSlotSchema).min(1),
});

type ScheduledFormData = z.infer<typeof scheduledFormSchema>;
type SimpleFormData = z.infer<typeof simpleFormSchema>;

function toLiteralIso(dateStr: string, timeStr: string): string {
  const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10) || 0);
  const padded = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  return `${dateStr}T${padded}:00.000Z`;
}

export function EditEventForm({ event }: EditEventFormProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const simple = isSimple(event);
  const slot = slotLabel(event);
  const slots = slotsLabel(event);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    index: number;
    slotId: string;
    roleName: string;
    signups: { name: string }[];
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletedSlotIds, setDeletedSlotIds] = useState<Array<{ id: string; reason: string | null }>>([]);
  const seededTheme = seedThemeKeys(event);
  const [colorKey, setColorKey] = useState(seededTheme.colorKey);
  const [fontKey, setFontKey] = useState(seededTheme.fontKey);

  const scheduledForm = useForm<ScheduledFormData>({
    resolver: zodResolver(scheduledFormSchema),
    defaultValues: {
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      start_date: event.start_date ? event.start_date.slice(0, 10) : '',
      end_date:
        event.signup_type === 'scheduled' && event.end_date
          ? event.end_date.slice(0, 10)
          : '',
      show_signups: event.show_signups ?? true,
      slots: event.slots.map((s) => {
        const { spot_date, start_time, end_time } = slotTimestampsToFormFields(
          s.start_time,
          s.end_time,
          event.start_date
        );
        return {
          id: s.id,
          spot_date,
          role_name: s.role_name,
          start_time,
          end_time,
          capacity: s.capacity,
          instructions: s.instructions || '',
          comment_label:
            !s.comment_label || s.comment_label === DEFAULT_COMMENT_LABEL
              ? ''
              : s.comment_label,
          comment_required: s.comment_required ?? false,
        };
      }),
    },
  });

  const simpleForm = useForm<SimpleFormData>({
    resolver: zodResolver(simpleFormSchema),
    defaultValues: {
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      start_date: event.start_date ? event.start_date.slice(0, 10) : '',
      show_signups: event.show_signups ?? true,
      slots: event.slots.map((s) => ({
        id: s.id,
        role_name: s.role_name,
        capacity: s.capacity,
        role_description: s.role_description || '',
        comment_label:
          !s.comment_label || s.comment_label === DEFAULT_COMMENT_LABEL
            ? ''
            : s.comment_label,
        comment_required: s.comment_required ?? false,
      })),
    },
  });

  const scheduledSlots = scheduledForm.watch('slots');
  const simpleSlots = simpleForm.watch('slots');

  const {
    fields: scheduledSlotFields,
    append: appendScheduledSlot,
    remove: removeScheduledSlotField,
    swap: swapScheduledSlots,
  } = useFieldArray({ control: scheduledForm.control, name: 'slots' });

  const {
    fields: simpleSlotFields,
    append: appendSimpleSlot,
    remove: removeSimpleSlotField,
    swap: swapSimpleSlots,
  } = useFieldArray({ control: simpleForm.control, name: 'slots' });

  /** Original server slot for this form row (by id), for signup counts / delete modal. */
  const getEventSlotForFormIndex = (index: number): SlotWithSignups | undefined => {
    const row = simple ? simpleSlots[index] : scheduledSlots[index];
    const id = row?.id;
    if (!id) return undefined;
    return event.slots.find((s) => s.id === id);
  };

  const getSignupCount = (index: number) =>
    getEventSlotForFormIndex(index)?.signups?.length ?? 0;

  const hasCapacityError = (index: number, capacity: number) => {
    const n = getSignupCount(index);
    return n > 0 && capacity < n;
  };

  const anyCapacityError = () => {
    if (simple) {
      return simpleSlots.some((s, i) => hasCapacityError(i, s.capacity));
    }
    return scheduledSlots.some((s, i) => hasCapacityError(i, s.capacity));
  };

  const addSlot = () => {
    if (simple) {
      appendSimpleSlot({
        role_name: '',
        capacity: 1,
        role_description: '',
        comment_label: '',
        comment_required: false,
      });
    } else {
      const last = scheduledSlots[scheduledSlots.length - 1];
      appendScheduledSlot({
        id: undefined,
        spot_date: last?.spot_date || event.start_date?.slice(0, 10) || '',
        role_name: '',
        start_time: '',
        end_time: '',
        capacity: 1,
        instructions: '',
        comment_label: '',
        comment_required: false,
      });
    }
  };

  const removeSlot = (index: number) => {
    const slotData = getEventSlotForFormIndex(index);
    const currentSlots = simple ? simpleSlots : scheduledSlots;
    const slotInForm = currentSlots[index];
    const slotId = slotInForm?.id ?? slotData?.id;
    const signups = slotData?.signups ?? [];
    if (signups.length > 0 && slotId) {
      setDeleteModal({
        index,
        slotId,
        roleName: slotData!.role_name,
        signups: signups.map((s) => ({ name: s.name })),
      });
      setDeleteReason('');
    } else {
      doRemoveSlot(index, slotId);
    }
  };

  const doRemoveSlot = (index: number, slotId?: string, reason?: string | null) => {
    if (slotId) {
      setDeletedSlotIds((prev) => [...prev, { id: slotId, reason: reason ?? null }]);
    }
    if (simple) {
      if (simpleSlotFields.length <= 1) return;
      removeSimpleSlotField(index);
    } else {
      if (scheduledSlotFields.length <= 1) return;
      removeScheduledSlotField(index);
    }
    setDeleteModal(null);
    setDeleteReason('');
  };

  const buildPayload = () => {

    if (simple) {
      const data = simpleForm.getValues();
      const showSignups = data.show_signups ?? true;
      const slotsPayload = simpleSlots.map((s) => ({
          id: s.id,
          role_name: s.role_name,
          capacity: s.capacity,
          role_description: s.role_description?.trim() || null,
          start_time: null as string | null,
          end_time: null as string | null,
          comment_label: s.comment_label?.trim() || undefined,
          comment_required: s.comment_required ?? false,
        }));
      return {
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        start_date: data.start_date ? `${data.start_date}T00:00:00Z` : null,
        end_date: data.start_date ? `${data.start_date}T23:59:59Z` : null,
        show_signups: showSignups,
        theme: { colorKey, fontKey },
        slots: slotsPayload,
        deleted_slot_ids: deletedSlotIds,
      };
    }

    const data = scheduledForm.getValues();
    const showSignups = data.show_signups ?? true;
    const dates = scheduledSlots.map((s) => s.spot_date).filter(Boolean) as string[];
    const startDate = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
    const endDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;

    const slotsPayload = scheduledSlots.map((s) => {
        const date = s.spot_date || startDate || '';
        const startTimeStr = s.start_time?.trim();
        const endTimeStr = s.end_time?.trim();
        return {
          id: s.id,
          role_name: s.role_name,
          capacity: s.capacity,
          instructions: s.instructions?.trim() || null,
          start_time:
            date && startTimeStr
              ? toLiteralIso(date, startTimeStr)
              : date
                ? `${date}T00:00:00.000Z`
                : null,
          end_time: date && endTimeStr ? toLiteralIso(date, endTimeStr) : null,
          comment_label: s.comment_label?.trim() || undefined,
          comment_required: s.comment_required ?? false,
        };
      });

    return {
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      start_date: startDate ? `${startDate}T00:00:00Z` : null,
      end_date: endDate ? `${endDate}T23:59:59Z` : null,
      show_signups: showSignups,
      theme: { colorKey, fontKey },
      slots: slotsPayload,
      deleted_slot_ids: deletedSlotIds,
    };
  };

  const onSubmit = async () => {
    if (anyCapacityError()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = buildPayload();
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update');

      const slotsDeleted = (payload.deleted_slot_ids ?? []).length;
      const slotsAdded = payload.slots.filter((s) => !s.id).length;
      const dateChanged =
        payload.start_date !== (event.start_date ?? undefined) ||
        payload.end_date !== (event.end_date ?? undefined);
      const locationChanged = payload.location !== (event.location ?? undefined);

      if (posthog) {
        posthog.capture('event_edited', {
          event_id: event.id,
          date_changed: dateChanged,
          location_changed: locationChanged,
          slots_deleted: slotsDeleted,
          slots_added: slotsAdded,
        });
      }

      router.push(`/dashboard/event/${event.id}/signups`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteWithSignups = () => {
    if (!deleteModal) return;
    doRemoveSlot(deleteModal.index, deleteModal.slotId, deleteReason || null);
  };

  return (
    <>
      {error && (
        <div
          className="mb-6 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-charcoal font-body"
          role="alert"
        >
          {error}
        </div>
      )}

      {simple ? (
        <form
          onSubmit={simpleForm.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <EventDetailsSection
            control={simpleForm.control}
            form={simpleForm as { register: (n: string) => object; formState: { errors: Record<string, unknown> } }}
            showEndDate={false}
            signupTypeLabel="Simple list"
          />
          <SlotsSectionSimple
            control={simpleForm.control}
            slotFields={simpleSlotFields}
            slots={simpleSlots}
            form={simpleForm as { register: (n: string) => object; formState: { errors: Record<string, unknown> } }}
            slotLabel={slot}
            slotsLabel={slots}
            onAdd={addSlot}
            onRemove={removeSlot}
            onSwapSlots={swapSimpleSlots}
            getSignupCount={getSignupCount}
            hasCapacityError={hasCapacityError}
          />
          <CustomizeAppearanceSection
            colorKey={colorKey}
            fontKey={fontKey}
            onColorChange={setColorKey}
            onFontChange={setFontKey}
          />
          <button
            type="submit"
            disabled={isSubmitting || anyCapacityError()}
            className="btn-primary"
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </form>
      ) : (
        <form
          onSubmit={scheduledForm.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <EventDetailsSection
            control={scheduledForm.control}
            form={scheduledForm as { register: (n: string, o?: { valueAsNumber?: boolean }) => object; formState: { errors: Record<string, unknown> } }}
            showEndDate
            signupTypeLabel="Scheduled"
          />
          <SlotsSectionScheduled
            control={scheduledForm.control}
            slotFields={scheduledSlotFields}
            slots={scheduledSlots}
            form={scheduledForm as { register: (n: string, o?: { valueAsNumber?: boolean }) => object; formState: { errors: Record<string, unknown> } }}
            slotLabel={slot}
            slotsLabel={slots}
            onAdd={addSlot}
            onRemove={removeSlot}
            onSwapSlots={swapScheduledSlots}
            getSignupCount={getSignupCount}
            hasCapacityError={hasCapacityError}
          />
          <CustomizeAppearanceSection
            colorKey={colorKey}
            fontKey={fontKey}
            onColorChange={setColorKey}
            onFontChange={setFontKey}
          />
          <button
            type="submit"
            disabled={isSubmitting || anyCapacityError()}
            className="btn-primary"
          >
            {isSubmitting ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm"
            onClick={() => setDeleteModal(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-soft-md">
            <h2
              id="delete-modal-title"
              className="text-lg font-semibold text-charcoal font-heading"
            >
              Remove this {slot.toLowerCase()}?
            </h2>
            <p className="mt-2 text-sm text-charcoal font-body">
              The following volunteers will have their signup cancelled and will
              be notified by email:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-charcoal font-body">
              {deleteModal.signups.map((s) => (
                <li key={s.name}>{s.name}</li>
              ))}
            </ul>
            <div className="mt-4">
              <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                Reason for removal (optional — included in notification email)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
                placeholder="Reason for removal (optional)"
                className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteWithSignups}
                className="rounded-xl bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral/90 font-body"
              >
                Remove {slot} and notify volunteers
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EventDetailsSection({
  control,
  form,
  showEndDate,
  signupTypeLabel,
}: {
   control: Control<ScheduledFormData> | Control<SimpleFormData>;
  form: { register: (n: string, opts?: { valueAsNumber?: boolean }) => object; formState: { errors: Record<string, unknown> } };
  showEndDate: boolean;
  signupTypeLabel: string;
}) {
  return (
    <section className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-charcoal font-heading mb-4">
        Event details
      </h2>
      <div className="space-y-4">
        <p className="text-sm text-muted font-body">
          Signup type: <span className="font-medium text-charcoal">{signupTypeLabel}</span> — cannot be changed after creation.
        </p>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1 font-body">
            Title <span className="text-coral">*</span>
          </label>
          <input
            {...form.register('title')}
            className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
          />
          {(form.formState.errors.title as { message?: string } | undefined) && (
            <p className="mt-1 text-sm text-coral font-body">
              {(form.formState.errors.title as { message?: string }).message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="signupsmartly-event-desc"
            className="block text-sm font-medium text-charcoal mb-1 font-body"
          >
            Description
          </label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <MarkdownEditor
                ref={field.ref}
                id="signupsmartly-event-desc"
                name="signupsmartly-event-description"
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                rows={3}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1 font-body">
            Location
          </label>
          <input
            {...form.register('location')}
            className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal mb-1 font-body">
            Start date
          </label>
          <input
            type="date"
            {...form.register('start_date')}
            className="w-full max-w-xs rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
          />
        </div>
        {showEndDate && (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1 font-body">
              End date
            </label>
            <input
              type="date"
              {...form.register('end_date')}
              className="w-full max-w-xs rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
            />
          </div>
        )}
        <div className="border-t border-charcoal/10 pt-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              {...form.register('show_signups')}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-charcoal/30 text-sage focus:ring-2 focus:ring-sage/30"
            />
            <span>
              <span className="block text-sm font-medium text-charcoal font-body">
                Display signup names and comments.
              </span>
              <span className="mt-0.5 block text-xs text-muted font-body">
                Turn off for anonymous signups.
              </span>
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}

function SlotsSectionSimple({
  control,
  slotFields,
  slots,
  form,
  slotLabel,
  slotsLabel,
  onAdd,
  onRemove,
  onSwapSlots,
  getSignupCount,
  hasCapacityError,
}: {
  control: Control<SimpleFormData>;
  slotFields: { id: string }[];
  slots: {
    id?: string;
    role_name: string;
    capacity: number;
    role_description?: string;
    comment_label?: string;
    comment_required?: boolean;
  }[];
  form: { register: (n: string, opts?: { valueAsNumber?: boolean }) => object; setValue?: (n: string, v: unknown) => void; formState: { errors: Record<string, unknown> } };
  slotLabel: string;
  slotsLabel: string;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onSwapSlots: (indexA: number, indexB: number) => void;
  getSignupCount: (i: number) => number;
  hasCapacityError: (i: number, cap: number) => boolean;
}) {
  return (
    <section className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-charcoal font-heading mb-4">
        {slotsLabel}
      </h2>
      <div className="space-y-6">
        {slotFields.map((field, index) => {
          const capErr = hasCapacityError(index, slots[index].capacity);
          return (
            <div
              key={field.id}
              className="rounded-xl border border-charcoal/10 p-4 space-y-4 bg-sand/30"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-muted font-body">
                  {slotLabel} {index + 1}
                </span>
                <SlotCardActions
                  listLength={slotFields.length}
                  index={index}
                  onMoveUp={() => index > 0 && onSwapSlots(index, index - 1)}
                  onMoveDown={() =>
                    index < slotFields.length - 1 && onSwapSlots(index, index + 1)
                  }
                  onRemove={() => onRemove(index)}
                  removeAriaLabel={`Remove ${slotLabel.toLowerCase()}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                  {slotLabel} name <span className="text-coral">*</span>
                </label>
                <input
                  {...form.register(`slots.${index}.role_name`)}
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                  Capacity <span className="text-coral">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  {...form.register(`slots.${index}.capacity`, { valueAsNumber: true })}
                  className="w-full max-w-[100px] rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                />
                {capErr && (
                  <p className="mt-1 text-sm text-coral font-body">
                    This {slotLabel.toLowerCase()} has {getSignupCount(index)} volunteer(s) signed up. Capacity cannot be below {getSignupCount(index)}.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                  Instructions <span className="text-muted font-normal">(optional)</span>
                </label>
                <Controller
                  control={control}
                  name={`slots.${index}.role_description`}
                  render={({ field }) => (
                    <MarkdownEditor
                      ref={field.ref}
                      name={field.name}
                      value={typeof field.value === 'string' ? field.value : ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Any notes for volunteers"
                      maxLength={800}
                      rows={2}
                    />
                  )}
                />
                {(form.formState.errors.slots as Array<{ role_description?: { message?: string } }> | undefined)?.[index]?.role_description && (
                  <p className="mt-1 text-sm text-coral font-body">
                    {(form.formState.errors.slots as Array<{ role_description?: { message?: string } }>)[index].role_description?.message}
                  </p>
                )}
              </div>
              <div className="border-t border-charcoal/10 pt-4 space-y-4">
                <span className="block text-sm font-medium text-muted font-body">
                  Signup settings for this {slotLabel.toLowerCase()}
                </span>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      {...form.register(`slots.${index}.comment_required`)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-charcoal/30 text-sage focus:ring-2 focus:ring-sage/30"
                    />
                    <span className="text-sm font-medium text-charcoal font-body">
                      Require a comment response when signing up
                    </span>
                  </label>
                </div>
                <div>
                  <label
                    htmlFor={`edit-simple-comment-title-${index}`}
                    className="block text-sm font-medium text-charcoal mb-1 font-body"
                  >
                    Customize the title of the comment field (max 60 characters).
                  </label>
                  <input
                    id={`edit-simple-comment-title-${index}`}
                    type="text"
                    maxLength={60}
                    {...form.register(`slots.${index}.comment_label`)}
                    className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 placeholder:text-muted/70"
                    placeholder="Comment"
                  />
                  {(form.formState.errors.slots as Array<{ comment_label?: { message?: string } }> | undefined)?.[index]?.comment_label && (
                    <p className="mt-1 text-sm text-coral font-body">
                      {(form.formState.errors.slots as Array<{ comment_label?: { message?: string } }>)[index].comment_label?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onAdd} className="btn-secondary mt-4 min-w-0">
        + Add {slotLabel}
      </button>
    </section>
  );
}

function SlotsSectionScheduled({
  control,
  slotFields,
  slots,
  form,
  slotLabel,
  slotsLabel,
  onAdd,
  onRemove,
  onSwapSlots,
  getSignupCount,
  hasCapacityError,
}: {
  control: Control<ScheduledFormData>;
  slotFields: { id: string }[];
  slots: {
    id?: string;
    spot_date?: string;
    role_name: string;
    start_time?: string;
    end_time?: string;
    capacity: number;
    instructions?: string;
    comment_label?: string;
    comment_required?: boolean;
  }[];
  form: { register: (n: string, opts?: { valueAsNumber?: boolean }) => object; formState: { errors: Record<string, unknown> } };
  slotLabel: string;
  slotsLabel: string;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onSwapSlots: (indexA: number, indexB: number) => void;
  getSignupCount: (i: number) => number;
  hasCapacityError: (i: number, cap: number) => boolean;
}) {
  return (
    <section className="rounded-xl border border-charcoal/10 bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold text-charcoal font-heading mb-4">
        {slotsLabel}
      </h2>
      <div className="space-y-6">
        {slotFields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-xl border border-charcoal/10 p-4 space-y-4 bg-sand/30"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted font-body">
                {slotLabel} {index + 1}
              </span>
              <SlotCardActions
                listLength={slotFields.length}
                index={index}
                onMoveUp={() => index > 0 && onSwapSlots(index, index - 1)}
                onMoveDown={() =>
                  index < slotFields.length - 1 && onSwapSlots(index, index + 1)
                }
                onRemove={() => onRemove(index)}
                removeAriaLabel={`Remove ${slotLabel.toLowerCase()}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                Date
              </label>
              <input
                type="date"
                {...form.register(`slots.${index}.spot_date`)}
                className="w-full max-w-xs rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                  Start time
                </label>
                <input
                  type="time"
                  {...form.register(`slots.${index}.start_time`)}
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                  End time
                </label>
                <input
                  type="time"
                  {...form.register(`slots.${index}.end_time`)}
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                  {slotLabel} name <span className="text-coral">*</span>
                </label>
                <input
                  {...form.register(`slots.${index}.role_name`)}
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                  Capacity <span className="text-coral">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  {...form.register(`slots.${index}.capacity`, { valueAsNumber: true })}
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
                />
                {hasCapacityError(index, slots[index].capacity) && (
                  <p className="mt-1 text-sm text-coral font-body">
                    This {slotLabel.toLowerCase()} has {getSignupCount(index)} volunteer(s) signed up. Capacity cannot be below {getSignupCount(index)}.
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1 font-body">
                Instructions <span className="text-muted font-normal">(optional)</span>
              </label>
              <Controller
                control={control}
                name={`slots.${index}.instructions`}
                render={({ field }) => (
                  <MarkdownEditor
                    ref={field.ref}
                    name={field.name}
                    value={typeof field.value === 'string' ? field.value : ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Any notes for volunteers"
                    maxLength={800}
                    rows={2}
                  />
                )}
              />
              {(form.formState.errors.slots as Array<{ instructions?: { message?: string } }> | undefined)?.[index]?.instructions && (
                <p className="mt-1 text-sm text-coral font-body">
                  {(form.formState.errors.slots as Array<{ instructions?: { message?: string } }>)[index].instructions?.message}
                </p>
              )}
            </div>
            <div className="border-t border-charcoal/10 pt-4 space-y-4">
              <span className="block text-sm font-medium text-muted font-body">
                Signup settings for this {slotLabel.toLowerCase()}
              </span>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    {...form.register(`slots.${index}.comment_required`)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-charcoal/30 text-sage focus:ring-2 focus:ring-sage/30"
                  />
                  <span className="text-sm font-medium text-charcoal font-body">
                    Require a comment response when signing up
                  </span>
                </label>
              </div>
              <div>
                <label
                  htmlFor={`edit-scheduled-comment-title-${index}`}
                  className="block text-sm font-medium text-charcoal mb-1 font-body"
                >
                  Customize the title of the comment field (max 60 characters).
                </label>
                <input
                  id={`edit-scheduled-comment-title-${index}`}
                  type="text"
                  maxLength={60}
                  {...form.register(`slots.${index}.comment_label`)}
                  className="w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal font-body focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 placeholder:text-muted/70"
                  placeholder="Comment"
                />
                {(form.formState.errors.slots as Array<{ comment_label?: { message?: string } }> | undefined)?.[index]?.comment_label && (
                  <p className="mt-1 text-sm text-coral font-body">
                    {(form.formState.errors.slots as Array<{ comment_label?: { message?: string } }>)[index].comment_label?.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className="btn-secondary mt-4 min-w-0">
        + Add {slotLabel}
      </button>
    </section>
  );
}
