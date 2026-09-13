# moderacion-ml

El LLM/modelo propio de moderación de contenido de **El Aula Informa**.
Es un servicio de **Python** aparte del backend (Cloudflare Workers no
corre Python) — el backend le pregunta por HTTP cada vez que alguien
publica o comenta, como una capa más de moderación automática.

## Qué modelo es y por qué

[RoBERTuito](https://github.com/pysentimiento/pysentimiento) — un modelo
de lenguaje tipo transformer (BERT), preentrenado y afinado sobre tuits en
**español latinoamericano** para detectar discurso de odio, agresividad y
contenido dirigido a una persona o grupo.

Un LLM generativo grande (GPT, Llama) necesitaría GPU y hosting de paga
para responder rápido. Este modelo corre en CPU gratis y es el mismo tipo
de herramienta que usan en producción Perspective API (Google) o el
endpoint de moderación de OpenAI: un modelo de lenguaje afinado para
**clasificar**, no para generar texto.

Ver `notebook_demo.ipynb` para un demo con ejemplos y explicación de cómo
se decide si un texto se rechaza.

## Correrlo en tu máquina

```bash
cd moderacion-ml
python -m venv venv
venv\Scripts\activate          # en Windows (en Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

La primera vez tarda un poco: descarga el modelo (~500 MB) de Hugging Face.

Probarlo:

```bash
curl -X POST http://localhost:8000/moderar \
  -H "Content-Type: application/json" \
  -d "{\"texto\": \"Eres un inútil, no sirves para nada\"}"
```

Debe responder algo como `{"ofensivo": true, "motivo": "lenguaje_ofensivo", "confianza": 0.87}`.

## Conectarlo con el backend

En `student-community-platform-api/.dev.vars` (local) o como secreto en
producción (`wrangler secret put MODELO_ML_URL`):

```
MODELO_ML_URL="http://localhost:8000/moderar"
MODELO_ML_TOKEN=""
```

Si defines `MODELO_ML_TOKEN` aquí, el servicio de Python solo aceptará
peticiones con ese mismo token en el header `Authorization: Bearer …`
(pon el mismo valor en ambos lados). Sin él, cualquiera que sepa la URL
podría usar el modelo — recomendado ponerlo antes de desplegar en público.

Si `MODELO_ML_URL` no está definida, el backend simplemente se salta esta
capa (igual que ya pasa con OpenAI y Hugging Face si faltan sus llaves) —
nunca truena por no tenerla.

## Desplegarlo (para que funcione en producción, no solo en tu máquina)

La forma más simple y gratis es un **Space de Hugging Face** con SDK
Docker:

1. Crea una cuenta en [huggingface.co](https://huggingface.co) si no
   tienes.
2. "New Space" → SDK: **Docker** → visibilidad pública o privada, como
   prefieran.
3. Sube (o conecta por git) los 3 archivos de esta carpeta: `app.py`,
   `requirements.txt`, `Dockerfile`. (El notebook y este README no hacen
   falta para que funcione, pero no estorban.)
4. En el Space, ve a Settings → Variables and secrets → agrega
   `MODELO_ML_TOKEN` con un valor secreto que inventes (una cadena
   larga aleatoria).
5. Espera a que compile (unos minutos la primera vez, descarga el
   modelo). Cuando esté "Running", la URL del servicio es:
   `https://<tu-usuario>-<nombre-del-space>.hf.space/moderar`
6. En el backend, pon esa URL en `MODELO_ML_URL` y el mismo valor del
   paso 4 en `MODELO_ML_TOKEN` (con `wrangler secret put` en producción).

Los Spaces gratuitos "duermen" si nadie los usa un rato y tardan unos
segundos en despertar en la siguiente petición — por eso el backend tiene
un timeout de 8 segundos y, si no responde a tiempo, **no bloquea la
publicación** (falla abierto, igual que las otras dos capas de
moderación). No es crítico que este servicio esté siempre despierto.

## Formato de la API

**Petición** — `POST /moderar`

```json
{ "texto": "el contenido a revisar" }
```

**Respuesta**

```json
{ "ofensivo": true, "motivo": "lenguaje_ofensivo", "confianza": 0.87 }
```

`motivo` es uno de: `discurso_de_odio`, `lenguaje_ofensivo`,
`acoso_u_ofensa` (el backend ya sabe traducir estos motivos a un mensaje
para el usuario — ver `mensajeRechazo` en
`student-community-platform-api/src/modules/moderacion/core/moderar.ts`).
