// sicurezza.js — svuotamento automatico degli appunti e blocco automatico del vault.
(function(){
  'use strict';
  const CLIPBOARD_MS  = 60 * 1000;      // appunti svuotati 1 minuto dopo una copia
  const INACTIVITY_MS = 5 * 60 * 1000;  // blocco dopo 5 minuti senza toccare lo schermo
  const BACKGROUND_MS = 60 * 1000;      // blocco se l'app resta in secondo piano più di 1 minuto

  // ---------- appunti ----------
  let clipTimer = null, clipDirty = false;
  async function clearClipboardNow(){
    clearTimeout(clipTimer); clipTimer = null;
    if (!clipDirty) return;
    // Il browser permette di scrivere negli appunti solo con la pagina in primo piano:
    // se ora non è possibile, si riprova appena si torna nell'app.
    try { await navigator.clipboard.writeText(''); clipDirty = false; } catch (e) {}
  }
  function clipboardCopied(){
    clipDirty = true;
    clearTimeout(clipTimer);
    clipTimer = setTimeout(clearClipboardNow, CLIPBOARD_MS);
  }

  // Anche la copia fatta a mano (pressione lunga → "Copia", oppure Ctrl+C sul PC)
  // fa partire lo svuotamento degli appunti dopo 1 minuto.
  document.addEventListener('copy', clipboardCopied, true);
  document.addEventListener('cut', clipboardCopied, true);

  // ---------- blocco automatico ----------
  let lastActivity = Date.now(), hiddenAt = null, onLock = null, canLock = null, timer = null;
  const touch = () => { lastActivity = Date.now(); };
  ['pointerdown', 'keydown', 'input', 'touchstart', 'wheel'].forEach(ev => document.addEventListener(ev, touch, { capture: true, passive: true }));
  document.addEventListener('scroll', touch, { capture: true, passive: true });

  function fire(reason){
    if (!onLock || (canLock && !canLock())) return;
    clearClipboardNow();
    onLock(reason);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){ hiddenAt = Date.now(); return; }
    // di nuovo in primo piano
    if (clipDirty && !clipTimer) clearClipboardNow();
    if (hiddenAt && Date.now() - hiddenAt > BACKGROUND_MS) fire('sfondo');
    else if (Date.now() - lastActivity > INACTIVITY_MS) fire('inattivita');
    hiddenAt = null;
    touch();
  });
  function check(){
    if (!document.hidden && Date.now() - lastActivity > INACTIVITY_MS) fire('inattivita');
  }

  // onLockFn(reason): chiamata quando bisogna bloccare; canLockFn(): false se ora non si deve bloccare
  function startAutoLock(onLockFn, canLockFn){
    onLock = onLockFn; canLock = canLockFn || null;
    touch();
    clearInterval(timer); timer = setInterval(check, 5000);
  }

  window.VaultSafety = Object.freeze({ clipboardCopied, clearClipboardNow, startAutoLock,
    CLIPBOARD_SECONDS: CLIPBOARD_MS / 1000, INACTIVITY_MINUTES: INACTIVITY_MS / 60000 });
})();
