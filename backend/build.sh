#!/usr/bin/env bash
# Render build script for Django backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate --no-input

# Seed demo data only if DB is fresh (no users yet)
python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.exists():
    import subprocess
    subprocess.run(['python', 'manage.py', 'seed_data'], check=True)
    print('Seeded demo data.')
else:
    print('DB already has users, skipping seed.')
"
