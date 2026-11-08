/**
 * Bali memories: short notes the two of you write on the wall in Casa Umalas.
 * Stored on this device (like the rest of the game until multiplayer arrives).
 */
export type Memory = { name: string; text: string; date: string };
const KEY = 'poopyworld.balimemories.v1';

export function loadMemories(): Memory[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

function saveMemories(list: Memory[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* fine */ }
}

/** Opens a small card to write a memory. `done` runs when it closes. */
export function openMemoryForm(name: string, done: () => void) {
  askText({
    title: 'Herinnering aan Bali', text: 'Schrijf iets op dat je niet wilt vergeten. Het komt aan de muur in Casa Umalas te hangen.',
    placeholder: 'Die ene avond bij...', ok: 'Ophangen', max: 140, rows: 3,
  }, (t) => {
    if (t) saveMemories([...loadMemories(), { name: name || 'Iemand', text: t, date: new Date().toISOString().slice(0, 10) }]);
    done();
  });
}

/** A small card with one text field. `done` gets the text (or '' when cancelled). */
export function askText(o: { title: string; text: string; placeholder: string; ok: string; max: number; rows?: number }, done: (text: string) => void) {
  const game = (window as unknown as { __game?: Phaser.Game }).__game;
  game?.registry.set('started', false);
  if (game?.input.keyboard) game.input.keyboard.enabled = false;

  const wrap = document.createElement('div');
  wrap.id = 'memo';
  wrap.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;background:rgba(20,30,14,.6);padding:16px;z-index:50';
  wrap.innerHTML = `
    <form class="panel hub-card" style="width:min(520px,100%)">
      <div class="hub-box">
        <h3></h3>
        <p class="muted"></p>
        <textarea id="memo-text" rows="${o.rows ?? 1}" maxlength="${o.max}"></textarea>
        <div class="row" style="justify-content:flex-end">
          <button class="btn alt small" type="button" id="memo-cancel">Toch niet</button>
          <button class="btn small" type="submit"></button>
        </div>
      </div>
    </form>`;
  document.body.appendChild(wrap);
  wrap.querySelector('h3')!.textContent = o.title;
  wrap.querySelector('p')!.textContent = o.text;
  wrap.querySelector<HTMLButtonElement>('button[type=submit]')!.textContent = o.ok;
  const text = wrap.querySelector<HTMLTextAreaElement>('#memo-text')!;
  text.placeholder = o.placeholder;
  text.focus();

  const close = (value: string) => {
    wrap.remove();
    if (game?.input.keyboard) game.input.keyboard.enabled = true;
    game?.registry.set('started', true);
    done(value);
  };
  wrap.querySelector('#memo-cancel')!.addEventListener('click', () => close(''));
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close('');
    if (e.key === 'Enter' && (o.rows ?? 1) === 1) { e.preventDefault(); close(text.value.trim()); }
  });
  wrap.querySelector('form')!.addEventListener('submit', (e) => { e.preventDefault(); close(text.value.trim()); });
}

/** A small card with a few buttons. `done` gets the index picked, or -1 when cancelled. */
export function askChoice(title: string, text: string, options: string[], done: (i: number) => void) {
  const game = (window as unknown as { __game?: Phaser.Game }).__game;
  game?.registry.set('started', false);
  if (game?.input.keyboard) game.input.keyboard.enabled = false;
  const wrap = document.createElement('div');
  wrap.id = 'choice';
  wrap.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;background:rgba(20,30,14,.5);padding:16px;z-index:50';
  wrap.innerHTML = `<div class="panel hub-card" style="width:min(460px,100%)"><div class="hub-box"><h3></h3><p class="muted"></p>
    <div class="row" style="flex-wrap:wrap;gap:8px"></div></div></div>`;
  wrap.querySelector('h3')!.textContent = title;
  wrap.querySelector('p')!.textContent = text;
  const row = wrap.querySelector('.row')!;
  const close = (i: number) => {
    wrap.remove();
    document.removeEventListener('keydown', onKey, true);
    if (game?.input.keyboard) game.input.keyboard.enabled = true;
    game?.registry.set('started', true);
    done(i);
  };
  options.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'btn small'; b.type = 'button'; b.textContent = `${i + 1}. ${o}`;
    b.addEventListener('click', () => close(i));
    row.appendChild(b);
  });
  const cancel = document.createElement('button');
  cancel.className = 'btn alt small'; cancel.type = 'button'; cancel.textContent = 'Toch niet';
  cancel.addEventListener('click', () => close(-1));
  row.appendChild(cancel);
  const onKey = (e: KeyboardEvent) => {
    const n = Number(e.key);
    if (n >= 1 && n <= options.length) { e.preventDefault(); e.stopPropagation(); close(n - 1); }
    if (e.key === 'Escape') { e.preventDefault(); close(-1); }
  };
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(wrap);
  (row.firstElementChild as HTMLButtonElement)?.focus();
}
