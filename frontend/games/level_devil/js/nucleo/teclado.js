// =====================================================================
//  TECLADO
// =====================================================================
// Registra as teclas pressionadas para que o loop de jogo possa consultá-las.
window.addEventListener('keydown', function (evento) {
  const tecla = evento.key.toLowerCase();              // normaliza letras e nomes como ArrowUp

  if (evento.ctrlKey && tecla === 'f2') {
    evento.preventDefault();
    if (!evento.repeat) MOSTRAR_HITBOX = !MOSTRAR_HITBOX;
    return;
  }

  if (document.activeElement.id === 'nick') return;   // está digitando o nickname

  // Atalho de desenvolvimento (do seu commit "Inimigos"): Ctrl+F1 passa de fase
  if (evento.ctrlKey && tecla === 'f1') {
    evento.preventDefault();
    if (!evento.repeat && jogando && !jogador.morto) passarDeFase();
    return;
  }

  if (tecla === 'r' && !evento.repeat) reiniciarFase();

  // Impede a página de rolar com espaço e setas
  if (tecla === ' ' || tecla.startsWith('arrow')) evento.preventDefault();

  teclas[tecla] = true;
});

// Marca a tecla como solta quando o navegador recebe o evento keyup.
window.addEventListener('keyup', function (evento) {
  teclas[evento.key.toLowerCase()] = false;
});
// Se a janela perder o foco, libera todas as teclas para evitar movimento
// contínuo quando o usuário retorna ao jogo.
window.addEventListener('blur', function () {
  for (const tecla in teclas) {
    teclas[tecla] = false;
  }
});