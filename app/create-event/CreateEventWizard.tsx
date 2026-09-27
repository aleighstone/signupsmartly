'use client';

import { useState, useRef, useEffect } from 'react';
import { usePostHog } from '@posthog/react';
import { useRouter } from 'next/navigation';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Copy,
  Eye,
  MapPin,
  Plus,
  Send,
  Users,
} from 'lucide-react';
import { CustomizeAppearanceSection } from '@/components/EventThemePickers';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { SlotCardActions } from '@/components/SlotCardActions';
import { DEFAULT_COLOR_KEY, DEFAULT_FONT_KEY } from '@/data/themes';
import { buildAvailabilitySlotLabel } from '@/lib/slot-label';
import {
  createAvailabilityEvent,
  createScheduledEvent,
  createSimpleEvent,
  updateDraftAvailabilityEvent,
  updateDraftScheduledEvent,
  updateDraftSimpleEvent,
} from '@/app/actions/event-actions';

// ---------------------------------------------------------------------------
// Zod schemas (same shapes as CreateEventForm)
// ---------------------------------------------------------------------------

const scheduledSlotSchema = z.object({
  spot_date: z.string().min(1, 'Date required'),
  role_name: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  capacity: z.number().min(1, 'At least 1'),
  instructions: z.string().max(800).optional(),
  comment_label: z.string().max(60).optional(),
  comment_required: z.boolean().optional(),
});

const simpleSlotSchema = z.object({
  role_name: z.string().min(1, 'Item name required'),
  role_description: z.string().max(800).optional(),
  capacity: z.number().min(1, 'At least 1'),
  comment_label: z.string().max(60).optional(),
  comment_required: z.boolean().optional(),
});

const availabilitySlotSchema = z.object({
  spot_date: z.string().min(1, 'Date required'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  instructions: z.string().max(800).optional(),
});

function availabilitySlotUniqueKey(slot: {
  spot_date?: string;
  start_time?: string;
  end_time?: string;
}): string {
  return [slot.spot_date?.trim() ?? '', slot.start_time?.trim() ?? '', slot.end_time?.trim() ?? ''].join('|');
}

const scheduledFormSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location required'),
  show_signups: z.boolean().optional(),
  slots: z.array(scheduledSlotSchema).min(1, 'Add at least one spot'),
});

const simpleFormSchema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  show_signups: z.boolean().optional(),
  slots: z.array(simpleSlotSchema).min(1, 'Add at least one item'),
});

const availabilityFormSchema = z
  .object({
    title: z.string().min(1, 'Title required'),
    description: z.string().optional(),
    location: z.string().optional(),
    show_signups: z.boolean().optional(),
    slots: z.array(availabilitySlotSchema).min(1, 'Add at least one date'),
  })
  .superRefine((data, ctx) => {
    const seen = new Map<string, number>();
    data.slots.forEach((slot, index) => {
      const key = availabilitySlotUniqueKey(slot);
      if (!slot.spot_date || !key.trim()) return;
      const firstIndex = seen.get(key);
      if (firstIndex !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each date/time option must be unique',
          path: ['slots', index, 'spot_date'],
        });
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each date/time option must be unique',
          path: ['slots', firstIndex, 'spot_date'],
        });
      } else {
        seen.set(key, index);
      }
    });
  });

type ScheduledFormData = z.infer<typeof scheduledFormSchema>;
type SimpleFormData = z.infer<typeof simpleFormSchema>;
type AvailabilityFormData = z.infer<typeof availabilityFormSchema>;

type SignupType = 'simple' | 'scheduled' | 'availability';
type ScheduledMode = 'named' | 'date-only';

// ---------------------------------------------------------------------------
// Save as template modal (inline, matches original behaviour)
// ---------------------------------------------------------------------------

function SaveAsTemplateModal({
  isOpen,
  onClose,
  signupTitle,
  signupType,
  description,
  location,
  slots,
  organizationId,
  published = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  signupTitle: string;
  signupType: 'scheduled' | 'simple';
  description: string | null;
  location: string | null;
  slots: Array<{
    role_name: string;
    capacity: number;
    start_time?: string;
    end_time?: string;
    instructions?: string | null;
  }>;
  organizationId: string;
  published?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [templateName, setTemplateName] = useState(`${signupTitle} Template`);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTemplateName(`${signupTitle} Template`);
    }
  }, [isOpen, signupTitle]);

  const handleClose = () => {
    onClose();
    router.push('/dashboard');
  };

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          name: templateName.trim(),
          signup_type: signupType,
          description: description || null,
          location: location || null,
          slots: slots.map((s) => ({
            slot_name: s.role_name,
            capacity: s.capacity,
            start_time: signupType === 'scheduled' ? (s.start_time || null) : null,
            end_time: signupType === 'scheduled' ? (s.end_time || null) : null,
            instructions: s.instructions || null,
          })),
        }),
      });
      if (!res.ok) throw new Error('Failed to save template');
      setStep(3);
    } catch {
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-surface p-6 shadow-soft-md">
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-charcoal font-heading">
              {published ? `${signupTitle} published!` : `${signupTitle} saved as draft`}
            </h2>
            <p className="mt-2 text-sm text-charcoal/70 font-body">
              {published
                ? 'Want to save this as a template to reuse later?'
                : 'Your draft is saved. Want to save it as a template too?'}
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-primary">
                Save as template
              </button>
              <button type="button" onClick={handleClose} className="btn-secondary">
                No thanks
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-charcoal font-heading">Name your template</h2>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mt-4 w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body"
              placeholder="Template name"
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSaving || !templateName.trim()}
                className="btn-primary"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                Back
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-charcoal font-heading">
              {templateName} saved!
            </h2>
            <p className="mt-2 text-sm text-charcoal/70 font-body">
              You can pick this template the next time you create a signup.
            </p>
            <div className="mt-6">
              <button type="button" onClick={handleClose} className="btn-primary">
                Go to dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared label / input styles
// ---------------------------------------------------------------------------

const labelClass = 'block text-sm font-medium text-charcoal font-body';
const inputClass =
  'mt-1 w-full rounded-xl border border-charcoal/20 px-3 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 font-body disabled:opacity-60';
const errorClass = 'mt-1 text-xs text-coral font-body';

// ---------------------------------------------------------------------------
// Step progress indicator
// ---------------------------------------------------------------------------

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i + 1 <= current ? 'bg-sage' : 'bg-charcoal/15'
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Type selector
// ---------------------------------------------------------------------------

const TYPE_OPTIONS: {
  type: SignupType;
  icon: React.ReactNode;
  label: string;
  description: string;
  examples: string;
}[] = [
  {
    type: 'simple',
    icon: <ClipboardList className="h-6 w-6" strokeWidth={1.5} />,
    label: 'Simple list signup',
    description: 'A list of spots people can sign up for — no dates required.',
    examples: 'e.g. potluck dishes, donation drives, field trip chaperones',
  },
  {
    type: 'scheduled',
    icon: <CalendarDays className="h-6 w-6" strokeWidth={1.5} />,
    label: 'Scheduled signup',
    description: 'Spots tied to specific dates and optional times.',
    examples: 'e.g. volunteer shifts, teacher conferences, game-day snack duty',
  },
  {
    type: 'availability',
    icon: <Users className="h-6 w-6" strokeWidth={1.5} />,
    label: 'Availability poll',
    description: "Ask your group which dates work before anything is scheduled.",
    examples: 'e.g. game nights, book club meetings',
  },
];

function Step1TypeSelector({
  selected,
  onSelect,
  onNext,
}: {
  selected: SignupType;
  onSelect: (t: SignupType) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-charcoal font-heading mb-6">
        What type of signup do you need?
      </h2>
      <div className="space-y-3">
        {TYPE_OPTIONS.map(({ type, icon, label, description, examples }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
              selected === type
                ? 'border-sage bg-sage/5'
                : 'border-charcoal/15 hover:border-charcoal/30 bg-surface'
            }`}
          >
            <span
              className={`mt-0.5 shrink-0 ${selected === type ? 'text-sage' : 'text-charcoal/50'}`}
            >
              {icon}
            </span>
            <span>
              <span className="block text-sm font-semibold text-charcoal font-heading">{label}</span>
              <span className="block text-sm text-charcoal font-body mt-0.5">{description}</span>
              <span className="block text-sm text-charcoal/60 font-body mt-0.5">{examples}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button type="button" onClick={onNext} className="btn-primary flex items-center gap-2">
          Next <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Basic info
// ---------------------------------------------------------------------------

function Step2InfoScheduled({
  form,
  onBack,
  onNext,
}: {
  form: ReturnType<typeof useForm<ScheduledFormData>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const { register, control, formState: { errors }, trigger } = form;

  const handleNext = async () => {
    const ok = await trigger(['title', 'location']);
    if (ok) onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-charcoal font-heading mb-6">Signup event details</h2>
      <div className="space-y-5">
        <div>
          <label className={labelClass}>
            Title <span className="text-coral">*</span>
          </label>
          <input
            {...register('title')}
            placeholder="e.g. Fall Festival Volunteers"
            className={inputClass}
          />
          {errors.title && <p className={errorClass}>{errors.title.message}</p>}
        </div>
        <div>
          <label className={labelClass}>
            Location <span className="text-coral">*</span>
          </label>
          <input
            {...register('location')}
            placeholder="e.g. Community Center, Room 204"
            className={inputClass}
          />
          {errors.location && <p className={errorClass}>{errors.location.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <p className="text-xs text-charcoal/50 font-body mb-1">
            Shown to volunteers. Markdown supported.
          </p>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name="wizard-scheduled-description"
                placeholder="Any extra details for volunteers…"
              />
            )}
          />
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}

function Step2InfoSimple({
  form,
  onBack,
  onNext,
}: {
  form: ReturnType<typeof useForm<SimpleFormData>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const { register, control, formState: { errors }, trigger } = form;

  const handleNext = async () => {
    const ok = await trigger(['title']);
    if (ok) onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-charcoal font-heading mb-6">Signup event details</h2>
      <div className="space-y-5">
        <div>
          <label className={labelClass}>
            Title <span className="text-coral">*</span>
          </label>
          <input
            {...register('title')}
            placeholder="e.g. Bake Sale Items"
            className={inputClass}
          />
          {errors.title && <p className={errorClass}>{errors.title.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input
            {...register('location')}
            placeholder="Optional"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" {...register('start_date')} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <p className="text-xs text-charcoal/50 font-body mb-1">
            Shown to volunteers. Markdown supported.
          </p>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name="wizard-simple-description"
                placeholder="Any extra details…"
              />
            )}
          />
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}

function Step2InfoAvailability({
  form,
  onBack,
  onNext,
}: {
  form: ReturnType<typeof useForm<AvailabilityFormData>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const { register, control, formState: { errors }, trigger } = form;

  const handleNext = async () => {
    const ok = await trigger(['title']);
    if (ok) onNext();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-charcoal font-heading mb-6">Poll details</h2>
      <div className="space-y-5">
        <div>
          <label className={labelClass}>
            Title <span className="text-coral">*</span>
          </label>
          <input
            {...register('title')}
            placeholder="e.g. Team Retreat Dates"
            className={inputClass}
          />
          {errors.title && <p className={errorClass}>{errors.title.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input {...register('location')} placeholder="Optional" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <p className="text-xs text-charcoal/50 font-body mb-1">
            Shown to respondents. Markdown supported.
          </p>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name="wizard-availability-description"
                placeholder="Any context for respondents…"
              />
            )}
          />
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Slots
// ---------------------------------------------------------------------------

function Step3SlotsSimple({
  form,
  onBack,
  onNext,
}: {
  form: ReturnType<typeof useForm<SimpleFormData>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const { register, control, formState: { errors }, trigger } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'slots' });

  const handleNext = async () => {
    const ok = await trigger(['slots']);
    if (ok) onNext();
  };

  const addSlot = () => append({ role_name: '', role_description: '', capacity: 1, comment_label: '', comment_required: false });
  const duplicate = (index: number) => {
    const src = form.getValues(`slots.${index}`);
    append({ ...src });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-charcoal font-heading mb-1">Add signup spots</h2>
      <p className="text-sm text-charcoal/60 font-body mb-6">Each spot is something people can sign up for.</p>

      {(errors.slots as { message?: string } | undefined)?.message && (
        <p className={errorClass + ' mb-4'}>{(errors.slots as { message?: string }).message}</p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-xl border border-charcoal/15 bg-surface p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-charcoal/50 font-body pt-1">Spot {index + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => duplicate(index)}
                  className="p-1 text-charcoal/50 hover:text-charcoal rounded"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <SlotCardActions
                  listLength={fields.length}
                  index={index}
                  onMoveUp={() => move(index, index - 1)}
                  onMoveDown={() => move(index, index + 1)}
                  onRemove={() => remove(index)}
                  removeAriaLabel={`Remove spot ${index + 1}`}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>
                  Item name <span className="text-coral">*</span>
                </label>
                <input
                  {...register(`slots.${index}.role_name`)}
                  placeholder="e.g. Chocolate chip cookies"
                  className={inputClass}
                />
                {errors.slots?.[index]?.role_name && (
                  <p className={errorClass}>{errors.slots[index]!.role_name!.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Quantity needed</label>
                  <input
                    type="number"
                    min={1}
                    {...register(`slots.${index}.capacity`, { valueAsNumber: true })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <input
                    {...register(`slots.${index}.role_description`)}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSlot}
        className="btn-secondary mt-3 w-full flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Add another spot
      </button>

      <NavButtons onBack={onBack} onNext={handleNext} nextLabel="Next" />
    </div>
  );
}

function Step3SlotsScheduled({
  form,
  mode,
  onModeChange,
  onBack,
  onNext,
}: {
  form: ReturnType<typeof useForm<ScheduledFormData>>;
  mode: ScheduledMode;
  onModeChange: (m: ScheduledMode) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { register, control, formState: { errors }, trigger } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'slots' });

  const handleNext = async () => {
    const ok = await trigger(['slots']);
    if (!ok) return;
    // Extra check: spot name required in named mode
    if (mode === 'named') {
      const slots = form.getValues('slots');
      let hasError = false;
      slots.forEach((s, i) => {
        if (!s.role_name?.trim()) {
          form.setError(`slots.${i}.role_name`, { message: 'Spot name required' });
          hasError = true;
        }
      });
      if (hasError) return;
    }
    onNext();
  };

  const addSlot = () => {
    const lastDate = fields.length ? form.getValues(`slots.${fields.length - 1}.spot_date`) : '';
    append({
      spot_date: lastDate || '',
      role_name: '',
      start_time: '',
      end_time: '',
      capacity: 1,
      instructions: '',
      comment_label: '',
      comment_required: false,
    });
  };

  const duplicate = (index: number) => {
    const src = form.getValues(`slots.${index}`);
    append({ ...src, role_name: src.role_name ?? '' });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-charcoal font-heading mb-1">Add signup spots</h2>
      <p className="text-sm text-charcoal/60 font-body mb-4">Each spot is tied to a date.</p>

      {/* Mode toggle */}
      <div className="space-y-3 mb-6">
        {([
          {
            value: 'date-only' as ScheduledMode,
            icon: <CalendarDays className="h-6 w-6" strokeWidth={1.5} />,
            label: 'Schedule only',
            description: 'Just pick dates and times — spots are named by date automatically.',
          },
          {
            value: 'named' as ScheduledMode,
            icon: <ClipboardList className="h-6 w-6" strokeWidth={1.5} />,
            label: 'Schedule + Spot name',
            description: 'Add a custom name to each spot, like Setup crew or Ticket booth.',
          },
        ]).map(({ value, icon, label, description }) => (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(value)}
            className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
              mode === value
                ? 'border-sage bg-sage/5'
                : 'border-charcoal/15 hover:border-charcoal/30 bg-surface'
            }`}
          >
            <span className={`mt-0.5 shrink-0 ${mode === value ? 'text-sage' : 'text-charcoal/50'}`}>
              {icon}
            </span>
            <span>
              <span className="block text-sm font-semibold text-charcoal font-heading">{label}</span>
              <span className="block text-xs text-charcoal/60 font-body mt-0.5">{description}</span>
            </span>
          </button>
        ))}
      </div>


      {(errors.slots as { message?: string } | undefined)?.message && (
        <p className={errorClass + ' mb-4'}>{(errors.slots as { message?: string }).message}</p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-xl border border-charcoal/15 bg-surface p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-charcoal/50 font-body pt-1">Spot {index + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => duplicate(index)}
                  className="p-1 text-charcoal/50 hover:text-charcoal rounded"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <SlotCardActions
                  listLength={fields.length}
                  index={index}
                  onMoveUp={() => move(index, index - 1)}
                  onMoveDown={() => move(index, index + 1)}
                  onRemove={() => remove(index)}
                  removeAriaLabel={`Remove spot ${index + 1}`}
                />
              </div>
            </div>
            <div className="space-y-3">
              {mode === 'named' && (
                <div>
                  <label className={labelClass}>
                    Spot name <span className="text-coral">*</span>
                  </label>
                  <input
                    {...register(`slots.${index}.role_name`)}
                    placeholder="e.g. Setup crew"
                    className={inputClass}
                  />
                  {errors.slots?.[index]?.role_name && (
                    <p className={errorClass}>{errors.slots[index]!.role_name!.message}</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    Date <span className="text-coral">*</span>
                  </label>
                  <input type="date" {...register(`slots.${index}.spot_date`)} className={inputClass} />
                  {errors.slots?.[index]?.spot_date && (
                    <p className={errorClass}>{errors.slots[index]!.spot_date!.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Spots needed</label>
                  <input
                    type="number"
                    min={1}
                    {...register(`slots.${index}.capacity`, { valueAsNumber: true })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start time</label>
                  <input type="time" {...register(`slots.${index}.start_time`)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>End time</label>
                  <input type="time" {...register(`slots.${index}.end_time`)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSlot}
        className="btn-secondary mt-3 w-full flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Add another spot
      </button>

      <NavButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}

function Step3SlotsAvailability({
  form,
  onBack,
  onNext,
}: {
  form: ReturnType<typeof useForm<AvailabilityFormData>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const { register, control, formState: { errors }, trigger, getValues } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'slots' });

  const handleNext = async () => {
    const ok = await trigger(['slots']);
    if (ok) onNext();
  };

  const addSlot = () => {
    const lastDate = fields.length ? getValues(`slots.${fields.length - 1}.spot_date`) : '';
    append({ spot_date: lastDate || '', start_time: '', end_time: '', instructions: '' });
  };

  const duplicate = (index: number) => {
    const src = getValues(`slots.${index}`);
    append({ ...src });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-charcoal font-heading mb-1">Add date options</h2>
      <p className="text-sm text-charcoal/60 font-body mb-6">
        Respondents will check off which dates work for them.
      </p>

      {(errors.slots as { message?: string } | undefined)?.message && (
        <p className={errorClass + ' mb-4'}>{(errors.slots as { message?: string }).message}</p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-xl border border-charcoal/15 bg-surface p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-charcoal/50 font-body pt-1">Option {index + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => duplicate(index)}
                  className="p-1 text-charcoal/50 hover:text-charcoal rounded"
                  title="Duplicate"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <SlotCardActions
                  listLength={fields.length}
                  index={index}
                  onMoveUp={() => move(index, index - 1)}
                  onMoveDown={() => move(index, index + 1)}
                  onRemove={() => remove(index)}
                  removeAriaLabel={`Remove option ${index + 1}`}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>
                  Date <span className="text-coral">*</span>
                </label>
                <input type="date" {...register(`slots.${index}.spot_date`)} className={inputClass} />
                {errors.slots?.[index]?.spot_date && (
                  <p className={errorClass}>{errors.slots[index]!.spot_date!.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start time</label>
                  <input type="time" {...register(`slots.${index}.start_time`)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>End time</label>
                  <input type="time" {...register(`slots.${index}.end_time`)} className={inputClass} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSlot}
        className="btn-secondary mt-3 w-full flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Add another date
      </button>

      <NavButtons onBack={onBack} onNext={handleNext} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Appearance & publish
// ---------------------------------------------------------------------------

function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(year, month - 1, day),
  );
}

function Step4Publish({
  signupType,
  scheduledForm,
  simpleForm,
  availabilityForm,
  colorKey,
  fontKey,
  onColorChange,
  onFontChange,
  onBack,
  onPublish,
  onDraft,
  onPreview,
  submittingAction,
}: {
  signupType: SignupType;
  scheduledForm: ReturnType<typeof useForm<ScheduledFormData>>;
  simpleForm: ReturnType<typeof useForm<SimpleFormData>>;
  availabilityForm: ReturnType<typeof useForm<AvailabilityFormData>>;
  colorKey: string;
  fontKey: string;
  onColorChange: (key: string) => void;
  onFontChange: (key: string) => void;
  onBack: () => void;
  onPublish: () => void;
  onDraft: () => void;
  onPreview: () => void;
  submittingAction: 'publish' | 'draft' | 'preview' | null;
}) {
  // show_signups toggle lives here
  const showSignupsValue =
    signupType === 'scheduled'
      ? scheduledForm.watch('show_signups') ?? true
      : signupType === 'simple'
        ? simpleForm.watch('show_signups') ?? true
        : availabilityForm.watch('show_signups') ?? true;

  const setShowSignups = (val: boolean) => {
    if (signupType === 'scheduled') scheduledForm.setValue('show_signups', val);
    else if (signupType === 'simple') simpleForm.setValue('show_signups', val);
    else availabilityForm.setValue('show_signups', val);
  };

  // Pull shared fields from whichever form is active
  const activeValues =
    signupType === 'scheduled'
      ? scheduledForm.getValues()
      : signupType === 'simple'
        ? simpleForm.getValues()
        : availabilityForm.getValues();
  const title = activeValues.title;
  const description = (activeValues as { description?: string }).description || null;
  const location = (activeValues as { location?: string }).location || null;
  const isAvailability = signupType === 'availability';

  // Build slot summary
  let slotSummary = '';
  let dateRange = '';
  if (signupType === 'simple') {
    const slots = simpleForm.getValues('slots');
    slotSummary = `${slots.length} ${slots.length === 1 ? 'spot' : 'spots'}`;
    const date = (activeValues as { start_date?: string }).start_date;
    if (date) dateRange = formatShortDate(date);
  } else if (signupType === 'scheduled') {
    const slots = scheduledForm.getValues('slots');
    slotSummary = `${slots.length} ${slots.length === 1 ? 'spot' : 'spots'}`;
    const dates = slots.map((s) => s.spot_date).filter(Boolean);
    const minDate = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
    const maxDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
    if (minDate && maxDate) {
      dateRange = minDate === maxDate
        ? formatShortDate(minDate)
        : `${formatShortDate(minDate)} – ${formatShortDate(maxDate)}`;
    }
  } else {
    const slots = availabilityForm.getValues('slots');
    slotSummary = `${slots.length} date ${slots.length === 1 ? 'option' : 'options'}`;
    const dates = slots.map((s) => s.spot_date).filter(Boolean);
    const minDate = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
    const maxDate = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
    if (minDate && maxDate) {
      dateRange = minDate === maxDate
        ? formatShortDate(minDate)
        : `${formatShortDate(minDate)} – ${formatShortDate(maxDate)}`;
    }
  }

  const typeLabel =
    signupType === 'availability' ? 'Availability poll'
    : signupType === 'scheduled' ? 'Scheduled signup'
    : 'Simple list';

  return (
    <div>
      <h2 className="text-xl font-semibold text-charcoal font-heading mb-6">Finishing touches</h2>

      {/* Appearance */}
      <CustomizeAppearanceSection
        colorKey={colorKey}
        fontKey={fontKey}
        onColorChange={onColorChange}
        onFontChange={onFontChange}
      />

      {/* Visibility toggle */}
      <div className="mt-6 rounded-xl border border-charcoal/15 bg-surface p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-charcoal font-body">
              {isAvailability ? 'Show responders who else is available' : 'Show who has signed up'}
            </p>
            <p className="text-sm text-charcoal/60 font-body mt-0.5">
              {isAvailability
                ? 'Turn off to keep responses private — you will still see the organizer view.'
                : "Volunteers can see each other's names on the signup page."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showSignupsValue}
            onClick={() => setShowSignups(!showSignupsValue)}
            className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${
              showSignupsValue ? 'bg-sage' : 'bg-charcoal/20'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                showSignupsValue ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Review card */}
      <div className="mt-6 rounded-xl border border-charcoal/10 bg-surface overflow-hidden">
        <div className="h-1 bg-sage" />
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-charcoal font-body mb-2">
            {typeLabel}
          </p>
          <h3 className="text-lg font-semibold text-charcoal font-heading leading-snug">{title}</h3>
          {description && (
            <p className="mt-1.5 text-sm text-charcoal font-body line-clamp-2">{description}</p>
          )}
          <div className="mt-3 flex flex-col gap-1">
            {(dateRange || slotSummary) && (
              <div className="flex items-center gap-1.5 text-sm text-charcoal font-body">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-charcoal/50" />
                <span>
                  {dateRange && slotSummary ? `${dateRange} · ${slotSummary}` : dateRange || slotSummary}
                </span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-charcoal font-body">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-charcoal/50" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={onPreview}
          disabled={submittingAction !== null}
          className="btn-secondary flex items-center justify-center gap-2 w-full"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={submittingAction !== null}
          className="btn-primary flex items-center justify-center gap-2 w-full"
        >
          <Send className="h-4 w-4" />
          {submittingAction === 'publish' ? 'Publishing…' : isAvailability ? 'Publish poll' : 'Publish signup'}
        </button>
        <button
          type="button"
          onClick={onDraft}
          disabled={submittingAction !== null}
          className="text-sm text-charcoal/60 hover:text-charcoal underline font-body mx-auto"
        >
          {submittingAction === 'draft' ? 'Saving…' : 'Save as draft'}
        </button>
      </div>

      {/* Back */}
      <div className="mt-4 flex justify-start">
        <button
          type="button"
          onClick={onBack}
          disabled={submittingAction !== null}
          className="flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal font-body"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared nav buttons (Back / Next)
// ---------------------------------------------------------------------------

function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Next',
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-charcoal font-body"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <button type="button" onClick={onNext} className="btn-primary flex items-center gap-2">
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

interface CreateEventWizardProps {
  organizationId: string;
  createdBy: string;
}

export function CreateEventWizard({ organizationId, createdBy }: CreateEventWizardProps) {
  const router = useRouter();
  const posthog = usePostHog();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [signupType, setSignupType] = useState<SignupType>('simple');
  const [scheduledMode, setScheduledMode] = useState<ScheduledMode>('date-only');
  const [colorKey, setColorKey] = useState(DEFAULT_COLOR_KEY);
  const [fontKey, setFontKey] = useState(DEFAULT_FONT_KEY);
  const [submittingAction, setSubmittingAction] = useState<'publish' | 'draft' | 'preview' | null>(null);
  // Track the draft event ID so subsequent previews and publish/draft reuse the
  // same event rather than creating orphaned drafts.
  const draftEventIdRef = useRef<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [lastCreated, setLastCreated] = useState<{
    title: string;
    signupType: 'scheduled' | 'simple';
    description: string | null;
    location: string | null;
    slots: Array<{ role_name: string; capacity: number; start_time?: string; end_time?: string; instructions?: string | null }>;
    published: boolean;
  } | null>(null);
  const submitIntentRef = useRef<'publish' | 'draft'>('publish');

  const simpleForm = useForm<SimpleFormData>({
    resolver: zodResolver(simpleFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      start_date: '',
      show_signups: true,
      slots: [{ role_name: '', role_description: '', capacity: 1, comment_label: '', comment_required: false }],
    },
  });

  const scheduledForm = useForm<ScheduledFormData>({
    resolver: zodResolver(scheduledFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      show_signups: true,
      slots: [{ spot_date: '', role_name: '', start_time: '', end_time: '', capacity: 1, instructions: '', comment_label: '', comment_required: false }],
    },
  });

  const availabilityForm = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      show_signups: true,
      slots: [{ spot_date: '', start_time: '', end_time: '', instructions: '' }],
    },
  });

  // When type changes, sync the shared info fields across forms
  const handleTypeChange = (next: SignupType) => {
    if (next === signupType) return;
    const current =
      signupType === 'simple'
        ? simpleForm.getValues()
        : signupType === 'availability'
          ? availabilityForm.getValues()
          : scheduledForm.getValues();
    const shared = {
      title: current.title || '',
      description: current.description || '',
      location: current.location || '',
      show_signups: current.show_signups ?? true,
    };
    if (next === 'simple') {
      simpleForm.setValue('title', shared.title);
      simpleForm.setValue('description', shared.description);
      simpleForm.setValue('location', shared.location);
      simpleForm.setValue('show_signups', shared.show_signups);
    } else if (next === 'scheduled') {
      scheduledForm.setValue('title', shared.title);
      scheduledForm.setValue('description', shared.description);
      scheduledForm.setValue('location', shared.location);
      scheduledForm.setValue('show_signups', shared.show_signups);
    } else {
      availabilityForm.setValue('title', shared.title);
      availabilityForm.setValue('description', shared.description);
      availabilityForm.setValue('location', shared.location);
      availabilityForm.setValue('show_signups', shared.show_signups);
    }
    setSignupType(next);
  };

  const handlePublish = async () => {
    submitIntentRef.current = 'publish';
    await submit();
  };

  const handleDraft = async () => {
    submitIntentRef.current = 'draft';
    await submit();
  };

  const handlePreview = async () => {
    // Save as draft (create or update) silently and open the public page.
    // Reuses the same draft event ID on repeated previews to avoid orphans.
    setSubmittingAction('preview');
    try {
      if (signupType === 'simple') {
        await simpleForm.handleSubmit(async (data) => {
          const input = {
            organizationId, createdBy, published: false, colorKey, fontKey,
            title: data.title, description: data.description,
            location: data.location, start_date: data.start_date,
            show_signups: data.show_signups,
            slots: data.slots.map((s) => ({
              role_name: s.role_name, role_description: s.role_description,
              capacity: s.capacity, comment_label: s.comment_label,
              comment_required: s.comment_required,
            })),
          };
          const existing = draftEventIdRef.current;
          const { id } = existing
            ? await updateDraftSimpleEvent(existing, input)
            : await createSimpleEvent(input);
          draftEventIdRef.current = id;
          window.open(`/event/${id}`, '_blank');
        })();
      } else if (signupType === 'scheduled') {
        await scheduledForm.handleSubmit(async (data) => {
          const input = {
            organizationId, createdBy, published: false, colorKey, fontKey,
            title: data.title, description: data.description,
            location: data.location, show_signups: data.show_signups,
            slots: data.slots.map((s) => ({
              spot_date: s.spot_date,
              role_name: scheduledMode === 'named' ? (s.role_name ?? '') : '',
              start_time: s.start_time, end_time: s.end_time,
              capacity: s.capacity, instructions: s.instructions,
              comment_label: s.comment_label, comment_required: s.comment_required,
            })),
          };
          const existing = draftEventIdRef.current;
          const { id } = existing
            ? await updateDraftScheduledEvent(existing, input)
            : await createScheduledEvent(input);
          draftEventIdRef.current = id;
          window.open(`/event/${id}`, '_blank');
        })();
      } else {
        await availabilityForm.handleSubmit(async (data) => {
          const input = {
            organizationId, createdBy, published: false, colorKey, fontKey,
            title: data.title, description: data.description,
            location: data.location, show_signups: data.show_signups,
            slots: data.slots.map((s) => ({
              spot_date: s.spot_date, start_time: s.start_time,
              end_time: s.end_time, instructions: s.instructions,
            })),
          };
          const existing = draftEventIdRef.current;
          const { id } = existing
            ? await updateDraftAvailabilityEvent(existing, input)
            : await createAvailabilityEvent(input);
          draftEventIdRef.current = id;
          window.open(`/event/${id}`, '_blank');
        })();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmittingAction(null);
    }
  };

  const submit = async () => {
    setSubmittingAction(submitIntentRef.current as 'publish' | 'draft');
    try {
      if (signupType === 'simple') {
        await simpleForm.handleSubmit(async (data) => {
          const input = {
            organizationId,
            createdBy,
            published: submitIntentRef.current === 'publish',
            colorKey,
            fontKey,
            title: data.title,
            description: data.description,
            location: data.location,
            start_date: data.start_date,
            show_signups: data.show_signups,
            slots: data.slots.map((s) => ({
              role_name: s.role_name,
              role_description: s.role_description,
              capacity: s.capacity,
              comment_label: s.comment_label,
              comment_required: s.comment_required,
            })),
          };
          const existing = draftEventIdRef.current;
          const result = existing
            ? await updateDraftSimpleEvent(existing, input)
            : await createSimpleEvent(input);
          posthog?.capture('signup_created', { signup_type: 'simple', slot_count: data.slots.length });
          setLastCreated({
            title: data.title,
            signupType: 'simple',
            description: data.description || null,
            location: data.location || null,
            slots: data.slots.map((s) => ({ role_name: s.role_name, capacity: s.capacity })),
            published: submitIntentRef.current === 'publish',
          });
          setSaveModalOpen(true);
          void result; // id available if needed for redirect
        })();
      } else if (signupType === 'scheduled') {
        await scheduledForm.handleSubmit(async (data) => {
          const input = {
            organizationId,
            createdBy,
            published: submitIntentRef.current === 'publish',
            colorKey,
            fontKey,
            title: data.title,
            description: data.description,
            location: data.location,
            show_signups: data.show_signups,
            slots: data.slots.map((s) => ({
              spot_date: s.spot_date,
              role_name: scheduledMode === 'named' ? (s.role_name ?? '') : '',
              start_time: s.start_time,
              end_time: s.end_time,
              capacity: s.capacity,
              instructions: s.instructions,
              comment_label: s.comment_label,
              comment_required: s.comment_required,
            })),
          };
          const existing = draftEventIdRef.current;
          const result = existing
            ? await updateDraftScheduledEvent(existing, input)
            : await createScheduledEvent(input);
          posthog?.capture('signup_created', { signup_type: 'scheduled', slot_count: data.slots.length });
          setLastCreated({
            title: data.title,
            signupType: 'scheduled',
            description: data.description || null,
            location: data.location || null,
            slots: data.slots.map((s) => ({
              role_name: scheduledMode === 'named' ? (s.role_name ?? '') : buildAvailabilitySlotLabel({ spot_date: s.spot_date, start_time: s.start_time, end_time: s.end_time }),
              capacity: s.capacity,
              start_time: s.start_time,
              end_time: s.end_time,
              instructions: s.instructions,
            })),
            published: submitIntentRef.current === 'publish',
          });
          setSaveModalOpen(true);
          void result;
        })();
      } else {
        await availabilityForm.handleSubmit(async (data) => {
          const input = {
            organizationId,
            createdBy,
            published: submitIntentRef.current === 'publish',
            colorKey,
            fontKey,
            title: data.title,
            description: data.description,
            location: data.location,
            show_signups: data.show_signups,
            slots: data.slots.map((s) => ({
              spot_date: s.spot_date,
              start_time: s.start_time,
              end_time: s.end_time,
              instructions: s.instructions,
            })),
          };
          const existing = draftEventIdRef.current;
          const { id } = existing
            ? await updateDraftAvailabilityEvent(existing, input)
            : await createAvailabilityEvent(input);
          posthog?.capture('availability_poll_created', { slot_count: data.slots.length });
          router.push(`/dashboard/event/${id}/signups`);
          router.refresh();
        })();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <StepProgress current={step} total={4} />

      {step === 1 && (
        <Step1TypeSelector
          selected={signupType}
          onSelect={handleTypeChange}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && signupType === 'simple' && (
        <Step2InfoSimple
          form={simpleForm}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 2 && signupType === 'scheduled' && (
        <Step2InfoScheduled
          form={scheduledForm}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}
      {step === 2 && signupType === 'availability' && (
        <Step2InfoAvailability
          form={availabilityForm}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && signupType === 'simple' && (
        <Step3SlotsSimple
          form={simpleForm}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}
      {step === 3 && signupType === 'scheduled' && (
        <Step3SlotsScheduled
          form={scheduledForm}
          mode={scheduledMode}
          onModeChange={setScheduledMode}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}
      {step === 3 && signupType === 'availability' && (
        <Step3SlotsAvailability
          form={availabilityForm}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <Step4Publish
          signupType={signupType}
          scheduledForm={scheduledForm}
          simpleForm={simpleForm}
          availabilityForm={availabilityForm}
          colorKey={colorKey}
          fontKey={fontKey}
          onColorChange={setColorKey}
          onFontChange={setFontKey}
          onBack={() => setStep(3)}
          onPublish={handlePublish}
          onDraft={handleDraft}
          onPreview={handlePreview}
          submittingAction={submittingAction}
        />
      )}

      {lastCreated && (
        <SaveAsTemplateModal
          isOpen={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          signupTitle={lastCreated.title}
          signupType={lastCreated.signupType}
          description={lastCreated.description}
          location={lastCreated.location}
          slots={lastCreated.slots}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}
