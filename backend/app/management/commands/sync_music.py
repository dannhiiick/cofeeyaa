from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = "Compatibility command to sync and seed Coffee Shop data"

    def handle(self, *args, **options):
        self.stdout.write("Routing music sync command to Coffee Shop database seeder...")
        call_command("seed_data")
        self.stdout.write(self.style.SUCCESS("Coffee Shop database synced successfully."))
