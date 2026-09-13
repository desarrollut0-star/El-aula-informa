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
capa (igual que ya pasa con Hugging Face si falta su llave) — nunca
truena por no tenerla.

## Desplegarlo (para que funcione en producción, no solo en tu máquina)

Se despliega en **Render** (plan gratis, no pide tarjeta) como servicio
Docker:

1. Crea una cuenta en [render.com](https://render.com) (puedes entrar con
   tu cuenta de GitHub).
2. **New +** → **Web Service**.
3. Conecta el repositorio `El-aula-informa` (dale acceso si te lo pide).
4. **Root Directory:** `moderacion-ml` (importante — si no, Render busca
   el Dockerfile en la raíz del repo y no lo va a encontrar).
5. **Runtime:** Render detecta el `Dockerfile` solo; si te pregunta,
   elige **Docker**.
6. **Instance Type:** **Free**.
7. En **Environment Variables**, agrega `MODELO_ML_TOKEN` con un valor
   secreto que inventes (una cadena larga aleatoria — genera una con
   `openssl rand -hex 32` si tienes Git Bash, o cualquier generador de
   contraseñas).
8. **Create Web Service**. La primera vez tarda varios minutos (instala
   `torch`, descarga el modelo). Cuando termine, Render te da una URL como
   `https://el-aula-informa-moderacion.onrender.com`.
9. En el backend, pon `MODELO_ML_URL="https://<esa-url>/moderar"` y el
   mismo valor del paso 7 en `MODELO_ML_TOKEN` (con `wrangler secret put`
   en producción).

El plan gratis de Render "duerme" el servicio tras ~15 minutos sin
tráfico y tarda cerca de un minuto en despertar en la siguiente petición
— por eso el backend tiene un timeout de 8 segundos y, si no responde a
tiempo, **no bloquea la publicación** (falla abierto, igual que la capa
de Hugging Face). No es crítico que este servicio esté siempre despierto.

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
