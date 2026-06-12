"use client";

import Planner from "@/components/Planner";
import Presenter from "@/components/Presenter";
import { itemsOf, parseAgenda } from "@/lib/agenda";
import { isOwner, useHashState, useNow } from "@/lib/store";

export default function Home() {
  const { session, ro } = useHashState();
  const now = useNow();

  const items = session ? itemsOf(parseAgenda(session.t)) : [];
  const running = !!session && session.a.length > 0 && items.length > 0;

  if (!running) {
    return <Planner session={session} now={now} />;
  }
  return <Presenter session={session!} items={items} readOnly={ro || !isOwner(session!)} />;
}
