async function salvarPontuacao(pontos, tempo) {
  var nickname = document.getElementById("nickname").value;

  var player = JSON.parse(localStorage.getItem("player"));
  if (!player || !jogador.id) {
    alert("COLOCA AS INFO DIREITO ANIMULA");
    return;
  }
  const dados = {
    gameId: "LIMBO",
    Id: player.id,
    score: pontos,
    duration: tempo,
  };

  var response = await fetch("http://10.1.136.170:3000/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });
}


if(respone.ok){
  alert("Pontuação salva com sucesso!");
}