FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Descarga el modelo durante el build para que el primer arranque no tarde
# (y para que no truene si el contenedor no tiene salida a internet luego).
RUN python -c "from pysentimiento import create_analyzer; create_analyzer(task='hate_speech', lang='es')"

# Render (y la mayoría de PaaS) asignan el puerto en la variable $PORT;
# Hugging Face Spaces no la define, así que usamos 7860 como respaldo.
# Forma "shell" del CMD (no la de lista) para que $PORT se expanda.
EXPOSE 7860
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}
