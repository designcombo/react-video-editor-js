import { Button } from "@/components/ui/button";
import { dispatch } from "@designcombo/events";
import { HISTORY_UNDO, HISTORY_REDO } from "@designcombo/state";

import { MenuIcon, ShareIcon } from "lucide-react";
import { UndoIcon } from "lucide-react";
import { RedoIcon } from "lucide-react";

export default function Navbar() {
  const handleUndo = () => {
    dispatch(HISTORY_UNDO);
  };

  const handleRedo = () => {
    dispatch(HISTORY_REDO);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr 320px",
      }}
      className="bg-sidebar pointer-events-none flex h-[58px] items-center border-b border-border/80 px-2"
    >
      <div className="flex items-center gap-2">
        <div className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-md text-zinc-200">
          <div className="hover:bg-background-subtle flex h-8 w-8 items-center justify-center">
            <MenuIcon className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-sidebar pointer-events-auto flex h-12 items-center px-1.5">
          <Button
            onClick={handleUndo}
            className="text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <UndoIcon width={20} />
          </Button>
          <Button
            onClick={handleRedo}
            className="text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <RedoIcon width={20} />
          </Button>
        </div>
      </div>

      <div className="flex h-14 items-center justify-center gap-2">
        <div className="bg-sidebar pointer-events-auto flex h-12 items-center gap-2 rounded-md px-2.5 text-muted-foreground"></div>
      </div>

      <div className="flex h-14 items-center justify-end gap-2">
        <div className="bg-sidebar pointer-events-auto flex h-12 items-center gap-2 rounded-md px-2.5">
          <Button
            className="flex h-8 gap-1 border border-border"
            variant="outline"
          >
            <ShareIcon width={18} /> Share
          </Button>
          <Button
            className="flex h-8 gap-1 border border-border"
            variant="default"
            onClick={() => {
              window.open("https://discord.gg/jrZs3wZyM5", "_blank");
            }}
          >
            Discord
          </Button>
        </div>
      </div>
    </div>
  );
}
