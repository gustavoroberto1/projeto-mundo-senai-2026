// Pergunta: os dois retângulos estão se tocando?
function colide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}







function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}


function chaoAbaixo(x, yMin) {
  let alvo = ALTURA + 40;
  for (const p of plataformas) {
    if (x >= p.x && x <= p.x + p.w && p.y >= yMin && p.y < alvo) alvo = p.y;
  }
  return alvo;
}


function textoCentral(texto, y, tamanho) {
  ctx.fillStyle = "#fff";
  ctx.font = tamanho + "px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(texto, LARGURA / 2, y);
}

