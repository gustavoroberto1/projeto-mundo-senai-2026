// =====================================================
// 5. TECLADO
// =====================================================
window.addEventListener("keydown", (e) => {
  teclas[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();   // evita a página rolar
  }
   if (e.code === "KeyR" && !noMenu()) reiniciar();
  if (e.code.startsWith("Digit") && !noMenu() && PALETAS[Number(e.code[5]) - 1]) {
    paleta = PALETAS[Number(e.code[5]) - 1];
  }

  if (e.code === "KeyH") depurar = !depurar;
});
window.addEventListener("keyup", (e) => { teclas[e.code] = false; });
window.addEventListener("blur", () => { for (const t in teclas) teclas[t] = false; });

