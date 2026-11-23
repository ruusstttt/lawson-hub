# Contexto — Lawson Hub

## 23/11/2026 — criação

- Pedido: reunir exportador NFL atualizado com Polymarket azul e gerador de thumbnails em uma pasta e transformar em site com abas extensíveis, hospedado no GitHub do usuário.
- Fontes locais consolidados em `originals/`; aplicações anteriores preservadas. Exportador Windows 4.1.2.0 e biblioteca thumbnail de 55 fotos/35 logos.
- Site estático em `site/`, sem dependências npm ou backend. Interface em inglês para John. Abas definidas em `site/tools.mjs`, carregadas sob demanda e mantidas abertas.
- Exportador portado para Canvas com seis estilos, edição da rodada, PNG/ZIP, agenda ESPN/fallback nflverse, modo manual e persistência local/JSON. Dez anúncios copiados sem re-encode.
- Thumbnails mantém o renderizador anterior. Alterados título, apresentação da interface e download com link reutilizável; não persiste uploads após recarregar.
- Testes e limitações em `VERIFICATION.md`. Publicação deve incluir somente site, testes, ferramentas e documentação deste Hub; o arquivo de originais não entra no Git.
- Repositório público criado: https://github.com/ruusstttt/lawson-hub. Site: https://ruusstttt.github.io/lawson-hub/.
- Publicação inicial `e36acf62f1c37a6f521da1951d6852bab7b53fd8`, execução Actions `45255690461` concluída com sucesso. Abas, anúncio azul e biblioteca thumbnail carregados no endereço público; layout verificado a 390 px de largura.
