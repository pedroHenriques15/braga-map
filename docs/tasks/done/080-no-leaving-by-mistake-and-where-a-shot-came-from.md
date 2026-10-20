---
status: done
priority: high
kind: code
repo: party-kart
created: 2026-10-20
depends-on: [079]
roadmap: Games · More tracks and the shooter
---

# 080 · No leaving the game by mistake, and where a shot came from

## Why

The owner, playing the deathmatch (2026-10-20): "Sometimes some combination of keys and/or mouse
presses gets me off the page or opens a dialog, can that be fixed? Also, when anyone takes damage, it
should be obvious where the damage comes from."

What was letting them out: only the game's own keys were kept from the browser, so Alt (the
browser's menu), F1, F3, F5, F7 (caret browsing's dialog), / and ' (Firefox's quick find), and Ctrl
with S, D, F, P or R (save, bookmark, find, print, reload) all did theirs; the mouse's side buttons
went back a page, the middle one started scrolling, and the right one opened the page's menu
whenever the pointer wasn't locked (choosing a kit). And a hit drew nothing where it struck: a shot's
pellets a fighter stopped had no tracer, no mark and no puff, so someone else being hit showed only
the shooter's flash, and being hit yourself only the screen's red edge, the same all round.

## What

In party-kart:

- **Keys** (`src/input.ts`'s `Keyboard`): while you drive, fly or walk (no menu up), every key but F11
  and F12 has its default prevented, down and up; a button still focused from a click loses the focus
  at the next key, so Space or Enter doesn't press it again.
- **The mouse** (`Mouse`): its side buttons (3 and 4) and the middle one (but on a link) prevented on
  mousedown, mouseup and auxclick; the right button's menu prevented but on a link or in a field; Ctrl
  with the wheel doesn't zoom while you play.
- **The page** (`main.ts`): in a room, a race or a round, the page pushes an entry of its own on the
  history for Back to take (`holdPage`), and pushes it again when Back takes it, so Back (a side
  button that got through, Alt+←, a swipe) stays in the game; closing or reloading asks first
  (`beforeunload`), but for the "Recarregar" after the graphics are lost.
- **Full screen on a computer** (`main.ts`'s `wholeScreen`, the bar's "⛶ Ecrã inteiro" in the city,
  a race and a round): in full screen the keyboard is locked (`navigator.keyboard.lock`, Chrome and
  Edge), so Ctrl+W, Ctrl+T, Ctrl+N, Ctrl+Tab and Esc come to the game; Esc is the menu, and held, as
  the browser says, leaves full screen; and Ctrl or Cmd with a key does nothing of the browser's there.
- **Where a shot came from, when it's you** (`hud.ts`'s `FightHud`, `style.css`'s `.from`): a red
  arc round the crosshair for each of the last four who hit you, toward where they fired from,
  turning as you turn, over the scope too; 2.5 s, fading over the last second.
- **Anyone else hit** (`fight.ts`'s `struck`, `main.ts`'s `shotFx`, `render/drivers.ts`'s
  `WalkerModel.hit`): each pellet a fighter stopped, as a browser draws them, struck them at the point
  of its way nearest their middle; there a tracer from the shooter's gun (up to two a shot, before the
  misses'), a brief red flash and a spray blown along the shot's way, and the figure jerked away from
  it (its lean, about its own axes, 10 to 26°, dying away in a fraction of a second). A tracer that hit
  you stops a metre short of your eye, so it streaks past.

## Done when

- [x] While you play, no key but F11 and F12 does the browser's, and the mouse's side, middle and
  right buttons and Ctrl with the wheel don't. *(Played, Playwright: Ctrl with S, D, F, P, R and =,
  F1, F3, F5, F7, Alt, /, ', Tab all prevented, F11 and F12 let through, still in the round; the
  side buttons, the middle one, the menu and Ctrl with the wheel prevented)*
- [x] Back keeps you in the round; closing the page in a round asks first. *(Played: `history.back()`
  twice, still in the round at the same address; closing the guest's page raised `beforeunload`)*
- [x] Full screen locks the keyboard where it can; Esc is the menu there. *(Played: the bar's button,
  full screen, the Keyboard Lock API there; Ctrl+W then Esc: still in full screen, the menu up, the
  pointer let go)*
- [x] Shot, an arc points at the shooter. *(Played: looking at a bot, 40° to its left and away from
  it, the arc at 0°, 41° and 180°; the host 22 m off a guest's left, at −92°)*
- [x] Anyone else hit is plain to see, and from where. *(Played: a third player 6 m to the side saw
  the red spray blown out the far side of the one hit and their figure lean away from the shooter;
  the shooter, a red flash on them)*
- [x] `npm test` and `npm run check` in party-kart. *(97 tests, one new in `test/fight.test.ts` for
  `struck`)*

## Out of scope

- Ctrl+W, Ctrl+T and Ctrl+N outside full screen, and Alt+Tab or the Windows key: a page can't have
  them. Windows' Sticky Keys dialog (Shift five times, the run key on foot and the item in a race) is
  Windows', turned off in Settings › Accessibility › Keyboard.
- A shooter's arc while you're down sits under the kits to choose from; "Eliminado por" names them.

## Notes

Drafted and done 2026-10-20 at the owner's word, as 079 was. Not verified: a real mouse's side
buttons in Chrome and Firefox (Playwright can't press them; the events are prevented, and Back keeps
you anyway), the keyboard lock with a real Ctrl+W, and a phone (nothing changed for touch but the
arcs and the hits, drawn as on a computer).
