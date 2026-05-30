FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --upgrade pip \
  && pip install -r backend/requirements.txt

COPY front/package.json front/package-lock.json front/
RUN cd front && npm ci

COPY . .

RUN cd front && npm run build
RUN cd backend && python manage.py collectstatic --no-input

CMD sh -c "cd backend && python manage.py migrate --no-input && python manage.py shell -c \"from django.contrib.auth.models import User; User.objects.exists() or __import__('subprocess').run(['python','manage.py','seed_data'],check=True)\" && gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"
