# Slot Card Grid — Community Visualization para Looker Studio

## Como publicar no GitHub Pages (5 minutos)

### Passo 1 — Criar repositório no GitHub
1. Acesse github.com e faça login
2. Clique em **New repository**
3. Nome: `slot-viz`
4. Marque **Public**
5. Clique **Create repository**

### Passo 2 — Fazer upload dos arquivos
1. Na página do repositório, clique **uploading an existing file**
2. Arraste os 3 arquivos: `index.js`, `manifest.json`, `config.json`
3. Clique **Commit changes**

### Passo 3 — Ativar GitHub Pages
1. Clique em **Settings** (no repositório)
2. No menu lateral, clique **Pages**
3. Em "Source", selecione **Deploy from a branch**
4. Branch: **main** / Pasta: **/ (root)**
5. Clique **Save**
6. Aguarde ~2 minutos. Sua URL será:
   `https://SEU_USUARIO.github.io/slot-viz/`

### Passo 4 — Atualizar a URL no manifest.json
Substitua `SEU_USUARIO` pelo seu usuário do GitHub em `manifest.json`:
- `"packageUrl": "https://SEU_USUARIO.github.io/slot-viz/"`
- `"js": "https://SEU_USUARIO.github.io/slot-viz/index.js"`
- `"config": "https://SEU_USUARIO.github.io/slot-viz/config.json"`

Depois faça upload do manifest.json atualizado.

### Passo 5 — Adicionar no Looker Studio
1. No Looker Studio, clique **Adicionar um gráfico**
2. Role até o final → **Criar visualização**
3. Cole a URL do seu manifest.json:
   `https://SEU_USUARIO.github.io/slot-viz/manifest.json`
4. Clique **Enviar**

### Passo 6 — Mapear os campos
No painel de dados da visualização, arraste:
- **Dimensões:** `date` → Data | `horario` → Horário | `campaing_name` → Campanha
- **Métricas:** `delivered` → Volume | `open` → Opens | `click` → Clicks | `rpc` → RPC (opcional)

Pronto! Os cards aparecem automaticamente agrupados por slot e dia da semana.
