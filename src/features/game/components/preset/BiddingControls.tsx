import { Button } from "@/components/ui/Button";
import type { BidValue } from "@/features/game";

type BiddingControlsProps = {
  allowedBids: BidValue[];
  canPass: boolean;
  pending?: boolean;
  onBid: (bid: BidValue) => void;
  onPass: () => void;
};

export function BiddingControls({ allowedBids, canPass, pending = false, onBid, onPass }: BiddingControlsProps) {
  return (
    <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 rounded-lg bg-black/60 p-3 sm:inset-x-4 sm:bottom-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300 sm:text-xs">Your Bid</p>
      <div className="flex flex-wrap gap-2">
        {[7, 9, 11, 13].map((bidValue) => (
          <Button
            key={bidValue}
            variant="primary"
            className="min-w-10 bg-red-700 text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-500"
            disabled={!allowedBids.includes(bidValue as BidValue) || pending}
            onClick={() => onBid(bidValue as BidValue)}
          >
            {bidValue}
          </Button>
        ))}
        <Button
          variant="secondary"
          className="border-red-900/95 bg-black/70 text-red-300 hover:bg-red-950/40"
          disabled={!canPass || pending}
          onClick={onPass}
        >
          Pass
        </Button>
      </div>
    </div>
  );
}
