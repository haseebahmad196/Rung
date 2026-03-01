import { tableRules } from "@/features/table/constants";

type RulesPanelProps = {
  showRules: boolean;
  onToggleRules: () => void;
};

export function RulesPanel({ showRules, onToggleRules }: RulesPanelProps) {
  return (
    <>
      <div className="absolute right-4 top-4 z-10">
        <button
          type="button"
          onClick={onToggleRules}
          className="grid h-8 w-8 place-items-center rounded-full border border-red-300/60 bg-red-900/55 text-sm font-black text-red-100 shadow-sm hover:bg-red-700/70"
          aria-label="Show rules"
        >
          ?
        </button>
      </div>

      {showRules ? (
        <div className="mb-4 rounded-xl border border-red-500/35 bg-red-950/35 p-3 pr-10 sm:mb-5">
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-100/90">
            {tableRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
