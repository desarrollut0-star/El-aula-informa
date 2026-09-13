"""
Modelo propio de moderación — El Aula Informa · Comunidad UTHH.

Por qué este modelo: usa RoBERTuito, un modelo de lenguaje tipo transformer
(la misma familia de arquitectura que usan los LLM grandes como GPT o
Llama, solo que mucho más chico) preentrenado y afinado sobre tuits en
español latinoamericano para detectar discurso de odio, agresividad y
contenido dirigido a una persona o grupo. Un LLM generativo grande (GPT,
Llama) necesitaría GPU y hosting de paga para responder rápido; este
modelo corre en CPU gratis y es justo el tipo de herramienta que se usa
en la práctica para moderación de contenido (es lo mismo que hacen por
dentro Perspective API de Google o el moderation endpoint de OpenAI).

Referencia: Pérez, J.M. et al. "pysentimiento: A Python Toolkit for
Opinion Mining and Social NLP tasks". https://github.com/pysentimiento/pysentimiento

Este servicio se ejecuta APARTE del backend (Cloudflare Workers no corre
Python) y el Worker le pregunta por HTTP — ver `moderar.ts` en
student-community-platform-api. Ver README.md para correrlo local o
desplegarlo en Hugging Face Spaces.
"""

import os
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from pysentimiento import create_analyzer

app = FastAPI(title="Moderación ML — El Aula Informa")

# Si se define, solo se acepta la petición con este token (evita que
# cualquiera en internet use el modelo; el Worker lo manda como Bearer).
TOKEN = os.environ.get("MODELO_ML_TOKEN", "")

# Qué tan segura debe estar el modelo antes de rechazar un texto (0-1).
# Más alto = menos falsos positivos, pero deja pasar más casos dudosos.
UMBRAL = float(os.environ.get("UMBRAL", "0.5"))

# Se carga una sola vez al arrancar el proceso (no en cada petición).
analizador = create_analyzer(task="hate_speech", lang="es")

MOTIVO_POR_ETIQUETA = {
    "hateful": "discurso_de_odio",
    "aggressive": "lenguaje_ofensivo",
    "targeted": "acoso_u_ofensa",
}


class Peticion(BaseModel):
    texto: str


class Respuesta(BaseModel):
    ofensivo: bool
    motivo: Optional[str] = None
    confianza: float


@app.post("/moderar", response_model=Respuesta)
def moderar(peticion: Peticion, authorization: Optional[str] = Header(default=None)):
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="Token inválido")

    texto = peticion.texto.strip()
    if not texto:
        return Respuesta(ofensivo=False, confianza=0.0)

    resultado = analizador.predict(texto)
    etiqueta, confianza = max(resultado.probas.items(), key=lambda kv: kv[1])

    if confianza < UMBRAL:
        return Respuesta(ofensivo=False, confianza=confianza)

    return Respuesta(ofensivo=True, motivo=MOTIVO_POR_ETIQUETA.get(etiqueta), confianza=confianza)


@app.get("/salud")
def salud():
    return {"ok": True}
