const saida = document.getElementById('saida');

let curso = window.location.href.split('/')[4];
curso = curso.replace(/-/g, ' ');

saida.innerHTML = `O seu curso ideal é: ${curso}`;
