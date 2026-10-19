// The prompt ID prefix catches tokens accidentally paired with a different
// prompt. This is not a signature, expiry check, authorization, or anti-cheat
// credential; the game has no server-side run/session store.
export function isDealTicketFor(ticket, promptId) {
  return typeof ticket === "string"
    && ticket.length <= 160
    && ticket.startsWith(`${promptId}.`)
    && ticket.length > promptId.length + 1;
}
