// LOOP PRINCIPAL: atualiza e desenha o jogo a cada quadro.
let ultimo = 0;

function loop(agora) {
  const dt = Math.min((agora - ultimo) / 16.667, 2);
  ultimo = agora;
  atualizar(dt);
  desenhar();
  requestAnimationFrame(loop);
}

voltarAoMenu();


requestAnimationFrame((t) => {
  ultimo = t;
  loop(t);
});
