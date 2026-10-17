import { ViewTransition } from "react";

/** A template remounts on every navigation, so each page fades in over the last one (see globals.css). */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
