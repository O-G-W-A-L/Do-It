# Generated by Django 5.2 on 2025-04-20 16:17

import api.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_emailverification'),
    ]

    operations = [
        migrations.AlterField(
            model_name='emailverification',
            name='expires',
            field=models.DateTimeField(default=api.models.default_expiry),
        ),
    ]
