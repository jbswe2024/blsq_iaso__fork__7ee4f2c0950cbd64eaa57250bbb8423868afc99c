# Generated by Django 3.1.13 on 2021-12-03 09:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("polio", "0034_make_readonlyrole"),
    ]

    operations = [
        migrations.CreateModel(
            name="SpreadSheetImport",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("url", models.URLField()),
                ("content", models.JSONField()),
                ("spread_id", models.CharField(db_index=True, max_length=60, unique=True)),
            ],
        ),
    ]