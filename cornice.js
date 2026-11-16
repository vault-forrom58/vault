// Protezione dal "clickjacking": se Vault viene caricato dentro la pagina di un altro sito
// (iframe), non mostra niente e prova a portarsi in primo piano da solo.
// GitHub Pages non permette di bloccarlo dal server (intestazione frame-ancestors).
(function(){
  'use strict';
  var inFrame;
  try { inFrame = window.top !== window.self; } catch (e) { inFrame = true; }
  if (!inFrame) return;
  document.documentElement.style.display = 'none';
  try { window.top.location = window.self.location.href; } catch (e) {}
})();
