/** Simple dialog box (HTML on top of the game, so text stays sharp and readable). */
export class Dialog {
  private box = document.getElementById('dialog')!;
  private who = document.getElementById('dialog-who')!;
  private text = document.getElementById('dialog-text')!;
  private lines: string[] = [];
  private index = 0;
  private then?: () => void;

  get isOpen() {
    return !this.box.hidden;
  }

  /** `then` runs once the last line has been read (or the box is closed). */
  open(who: string, lines: string[], then?: () => void) {
    this.then = then;
    this.lines = lines;
    this.index = 0;
    this.who.textContent = who;
    this.show();
    this.box.hidden = false;
  }

  /** Shows the next line, or closes when there are no more. */
  advance() {
    this.index++;
    if (this.index >= this.lines.length) this.close();
    else this.show();
  }

  close() {
    this.box.hidden = true;
    const then = this.then;
    this.then = undefined;
    then?.();
  }

  private show() {
    this.text.textContent = this.lines[this.index];
  }
}
