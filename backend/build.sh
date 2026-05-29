#!/usr/bin/env bash
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate --no-input

python manage.py shell -c "
from django.contrib.auth.models import User
if not User.objects.exists():
    import subprocess, sys
    subprocess.run([sys.executable, 'manage.py', 'seed_data'], check=True)
    print('Seeded demo data.')
else:
    print('DB already seeded, skipping.')
"
