from django.core.management.base import BaseCommand, CommandError

from apps.analysis.refresh_tasks import refresh_put_call_ratios, refresh_retail_sentiment


class Command(BaseCommand):
    help = (
        "Run the automatic market-data refreshes once. By default refreshes "
        "retail sentiment (usually run every 30 minutes by the in-process "
        "scheduler) and put/call ratios (usually run weekdays at 16:00 ET). "
        "Use --retail or --putcall to run only one."
    )

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group()
        group.add_argument("--retail", action="store_true", help="Refresh retail sentiment only")
        group.add_argument("--putcall", action="store_true", help="Refresh put/call ratios only")

    def handle(self, *args, **options):
        run_retail = options["retail"] or not options["putcall"]
        run_putcall = options["putcall"] or not options["retail"]

        if run_retail:
            self.stdout.write("Refreshing retail sentiment...")
            ok = refresh_retail_sentiment()
            if not ok:
                raise CommandError("Retail sentiment refresh failed")

        if run_putcall:
            self.stdout.write("Refreshing put/call ratios...")
            ok = refresh_put_call_ratios()
            if not ok:
                raise CommandError("One or more put/call refreshes failed")

        self.stdout.write(self.style.SUCCESS("Auto refresh complete"))
