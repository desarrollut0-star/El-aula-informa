FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# Descarga el modelo durante el build para que el primer arranque no tarde
# (y para que no truene si el contenedor no tiene salida a internet luego).
RUN python -c "from pysentimiento import create_analyzer; create_analyzer(task='hate_speech', lang='es')"

# Hugging Face Spaces (Docker SDK) espera el puerto 7860.
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
