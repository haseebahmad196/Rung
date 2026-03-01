import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type JoinGateCardProps = {
  tableId: string;
  nameInput: string;
  canEnterLobby: boolean;
  onNameChange: (value: string) => void;
  onEnterLobby: () => void;
};

export function JoinGateCard({
  tableId,
  nameInput,
  canEnterLobby,
  onNameChange,
  onEnterLobby,
}: JoinGateCardProps) {
  return (
    <Card className="mx-auto mt-10 max-w-md space-y-5 border-red-500/40 bg-black/80 p-5 sm:p-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300/80">
          Court Piece (Web)
        </p>
        <h1 className="text-2xl font-black sm:text-3xl">Join the live lobby</h1>
        <p className="text-sm text-red-100/80">
          Enter your first name to join table {tableId} from host link.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          id="join-name-input"
          value={nameInput}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="First name"
          maxLength={20}
          className="border-red-400/40 bg-red-950/40"
        />
        <Button
          variant="primary"
          className="w-full bg-red-500 py-2.5 text-white hover:bg-red-400"
          onClick={onEnterLobby}
          disabled={!canEnterLobby}
        >
          Join Table
        </Button>
      </div>
    </Card>
  );
}
