type TableNavbarProps = {
  isMuted: boolean;
  showMenu: boolean;
  onToggleMenu: () => void;
  onHome: () => void;
  onJoinFocus: () => void;
  onToggleMute: () => void;
  statusText: string;
  onCloseMenu: () => void;
};

export function TableNavbar({
  isMuted,
  showMenu,
  onToggleMenu,
  onHome,
  onJoinFocus,
  onToggleMute,
  statusText,
  onCloseMenu,
}: TableNavbarProps) {
  return (
    <nav className="pointer-events-none fixed right-3 top-3 z-50 sm:right-5 sm:top-5">
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={onToggleMenu}
          className="grid h-9 w-9 place-items-center rounded-full border border-red-700/90 bg-black/85 text-lg font-black text-red-500/95 hover:border-red-600/95 hover:text-red-400"
          aria-label="Open menu"
        >
          ≡
        </button>

        {showMenu ? (
          <div className="absolute right-0 top-11 z-20 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-red-900/95 bg-[linear-gradient(135deg,rgba(28,5,9,0.96),rgba(8,8,10,0.98))] p-2 shadow-[0_20px_45px_rgba(0,0,0,0.55)] sm:max-w-[26rem]">
            <button
              type="button"
              onClick={() => {
                onHome();
                onCloseMenu();
              }}
              className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-red-500/95 hover:bg-red-950/55"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                onJoinFocus();
                onCloseMenu();
              }}
              className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-red-400 hover:bg-red-950/55"
            >
              Join Table
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="mt-1 w-full rounded-xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-red-500/95 hover:bg-red-950/55"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <div className="mt-2 rounded-xl border border-red-950/90 bg-black/80 px-3 py-2 text-xs text-red-300/90">
              {statusText}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
