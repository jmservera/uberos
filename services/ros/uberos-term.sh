#!/usr/bin/env bash
# UbeROS terminal launcher.
#
# ttyd is started with --url-arg, so the client-supplied ?arg= value from the
# panel URL (e.g. /terminal/?arg=t1a2b3c4) arrives here as $1. We use it as a
# tmux session id: `tmux new-session -A` attaches an existing session or creates
# it. Because every reconnect for the same id reattaches the SAME shell, a
# terminal keeps its full scrollback and running processes when it is popped out
# into its own browser window, docked elsewhere in the layout, or restored after
# a page reload. Independent terminals use different ids, so they stay separate
# PTYs (BR-003).
set -euo pipefail

# The id is untrusted client input. Never pass it to a shell — restrict it to a
# safe tmux session-name charset and cap the length. Fall back to a unique
# per-process id when it is absent or empty after sanitising.
raw="${1:-}"
sid="$(printf '%s' "${raw}" | tr -cd 'a-zA-Z0-9_-' | cut -c1-64)"
[ -n "${sid}" ] || sid="anon-$$"

# -A: attach if the session exists, otherwise create it. -s: session name.
exec tmux new-session -A -s "uberos-${sid}"
