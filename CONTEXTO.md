# Contexto — Lawson Hub

## 24/11/2026 — gerador simples de thumbnails

- A aba **Thumbnails** abre em **Simple generator**, com semana regular de 1 a 18, escolha dos dois times e galeria visual das 55 fotos existentes. O exemplo inicial é Week 5, Bills vs Rams. O layout 1280 × 720 usa amarelo dos Chargers, retrato à esquerda, molduras VS no alto, BEST BETS à direita e a faixa Money Pick.
- O gerador carrega a foto selecionada em resolução original. As imagens menores da galeria são produzidas por `tools/build-photo-previews.ps1`. As referências anexadas orientam o layout. O placar de temporada é configurável no **Editor mode**.
- O editor completo e o gerador retêm seus próprios controles ao alternar no mesmo carregamento. Verificados localmente a troca de modos por clique e teclado, seleção de fotos, validação da semana, logo dos times, geração do link PNG e layout a 390 px e 1280 px.

## 24/11/2026 — logos das thumbnails

- A Logo Library apresenta os 35 logos incluídos nos dois seletores e uma prévia de cada seleção. O Logo A segue o preset ou o nome do time no início do palpite. O Logo B começa vazio e pode receber o adversário no modo VS. A opção de correspondência automática pode ser desativada. O upload continua disponível em **Add or replace logo files**.
- Testados no navegador o carregamento sem upload, o palpite inicial Chiefs, a correspondência Buccaneers/Bucs, a troca de preset, a seleção manual e a prévia no modo VS. Os 15 testes existentes passaram.

## 23/11/2026 — criação

- Pedido: reunir exportador NFL atualizado com Polymarket azul e gerador de thumbnails em uma pasta e transformar em site com abas extensíveis, hospedado no GitHub do usuário.
- Fontes locais consolidados em `originals/`; aplicações anteriores preservadas. Exportador Windows 4.1.2.0 e biblioteca thumbnail de 55 fotos/35 logos.
- Site estático em `site/`, sem dependências npm ou backend. Interface em inglês para John. Abas definidas em `site/tools.mjs`, carregadas sob demanda e mantidas abertas.
- Exportador portado para Canvas com seis estilos, edição da rodada, PNG/ZIP, agenda ESPN/fallback nflverse, modo manual e persistência local/JSON. Dez anúncios copiados sem re-encode.
- Thumbnails mantém o renderizador anterior. Alterados título, apresentação da interface e download com link reutilizável; não persiste uploads após recarregar.
- Testes e limitações em `VERIFICATION.md`. Publicação deve incluir somente site, testes, ferramentas e documentação deste Hub; o arquivo de originais não entra no Git.
- Repositório público criado: https://github.com/ruusstttt/lawson-hub. Site: https://ruusstttt.github.io/lawson-hub/.
- Publicação inicial `e36acf62f1c37a6f521da1951d6852bab7b53fd8`, execução Actions `45255690461` concluída com sucesso. Abas, anúncio azul e biblioteca thumbnail carregados no endereço público; layout verificado a 390 px de largura.
