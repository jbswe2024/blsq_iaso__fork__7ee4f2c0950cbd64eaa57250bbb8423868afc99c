# Generated by Django 3.2.13 on 2022-06-03 12:37

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("iaso", "0142_merge_20220530_0856"),
        ("polio", "0054_alter_round_options"),
    ]

    operations = [
        migrations.CreateModel(
            name="BudgetEvent",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                (
                    "type",
                    models.CharField(
                        choices=[("submission", "Budget Submission"), ("comments", "Comments")], max_length=200
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("author", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
                ("campaign", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="polio.campaign")),
                ("target_teams", models.ManyToManyField(to="iaso.Team")),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="BudgetFiles",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(upload_to="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("cc_emails", models.CharField(blank=True, max_length=200, null=True)),
                ("event", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="polio.budgetevent")),
            ],
        ),
    ]
