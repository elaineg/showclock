"use client";

import Planner from "@/components/Planner";
import PreRoll from "@/components/PreRoll";
import Presenter from "@/components/Presenter";
import { itemsOf, parseAgenda } from "@/lib/agenda";
import { isOwner, useHashState, useNow } from "@/lib/store";

export default function Home() {
  const { session, ro } = useHashState();
  const now = useNow();

  const items = session ? itemsOf(parseAgenda(session.t)) : [];
  const running = !!session && session.a.length > 0 && items.length > 0;
  // Pre-roll: session has a planned future start (pr field) but has not yet begun (a is empty)
  const preRoll = !!session && session.a.length === 0 && typeof session.pr === "number" && items.length > 0;

  if (running) {
    return <Presenter session={session!} items={items} readOnly={ro || !isOwner(session!)} />;
  }
  if (preRoll) {
    return <PreRoll session={session!} />;
  }
  return <Planner session={session} now={now} />;
}
