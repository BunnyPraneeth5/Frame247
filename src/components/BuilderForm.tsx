interface BuilderFormProps {
  name: string;
  role: string;
  title: string;
  onNameChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onReroll: () => void;
}

const ROLE_SUGGESTIONS = ['Full-stack', 'Frontend', 'Backend', 'AI/ML', 'Design', 'Mobile', 'DevOps', 'Founder'];

const inputClass =
  'w-full bg-brand-white/8 border border-brand-accent/35 rounded-md px-3.5 py-2.5 ' +
  'font-body text-brand-white text-sm placeholder:text-brand-offwhite/35 ' +
  'focus:outline-none focus:border-brand-accent focus:bg-brand-white/12 transition-colors';

const labelClass = 'font-body font-bold uppercase tracking-[0.18em] text-brand-accent text-[11px] mb-1.5 block';

export default function BuilderForm({
  name,
  role,
  title,
  onNameChange,
  onRoleChange,
  onReroll,
}: BuilderFormProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div>
        <label htmlFor="builder-name" className={labelClass}>
          Name
        </label>
        <input
          id="builder-name"
          type="text"
          value={name}
          maxLength={28}
          placeholder="Your name"
          onChange={(e) => onNameChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="builder-role" className={labelClass}>
          Stack / Role
        </label>
        <input
          id="builder-role"
          type="text"
          value={role}
          maxLength={30}
          placeholder="e.g. Full-stack, AI/ML, Design"
          onChange={(e) => onRoleChange(e.target.value)}
          className={inputClass}
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {ROLE_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onRoleChange(s)}
              className={`font-body text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border transition-colors ${
                role.toLowerCase() === s.toLowerCase()
                  ? 'border-brand-pink bg-brand-pink text-brand-white'
                  : 'border-brand-offwhite/25 text-brand-offwhite/60 hover:border-brand-accent hover:text-brand-accent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={labelClass}>Builder Title</span>
        <div className="flex items-center gap-2">
          {/* pink left-border callout — one of their doc-design signatures */}
          <div className="flex-1 border-l-[3px] border-brand-pink bg-brand-white/8 rounded-r-md px-3 py-2.5">
            <span
              data-testid="builder-title"
              className="font-body font-bold uppercase tracking-[0.12em] text-brand-white text-sm"
            >
              {title || '—'}
            </span>
          </div>
          <button
            type="button"
            data-testid="reroll-title"
            onClick={onReroll}
            title="Get another title"
            className="shrink-0 font-body text-[10px] uppercase tracking-wider text-brand-accent border border-brand-accent/50 rounded-md px-3 py-2.5 hover:bg-brand-accent hover:text-brand-primary transition-colors"
          >
            Reroll
          </button>
        </div>
        <p className="font-body text-brand-offwhite/40 text-[10px] mt-1.5">
          Auto-generated from your stack. Reroll for another.
        </p>
      </div>
    </div>
  );
}
