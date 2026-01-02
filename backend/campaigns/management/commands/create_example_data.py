from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from campaigns.models import SubscriberList, Subscriber

class Command(BaseCommand):
    help = 'Creates example subscriber list with dummy data for admin user'

    def handle(self, *args, **kwargs):
        # Get 'admin' user
        try:
            user = User.objects.get(username='admin')
            self.stdout.write(self.style.SUCCESS(f'Found user: {user.username}'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('User "admin" not found. Please create it first.'))
            return

        # Create a list
        sub_list, created = SubscriberList.objects.get_or_create(
            user=user,
            name='Example Newsletter List'
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created list: {sub_list.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'List already exists: {sub_list.name}'))

        # Add dummy subscribers
        dummy_data = [
            {'email': 'john.doe@example.com', 'first_name': 'John', 'last_name': 'Doe'},
            {'email': 'jane.smith@example.com', 'first_name': 'Jane', 'last_name': 'Smith'},
            {'email': 'alice.williams@example.com', 'first_name': 'Alice', 'last_name': 'Williams'},
            {'email': 'bob.brown@example.com', 'first_name': 'Bob', 'last_name': 'Brown'},
            {'email': 'charlie.davis@example.com', 'first_name': 'Charlie', 'last_name': 'Davis'},
        ]

        created_count = 0
        for data in dummy_data:
            subscriber, created = Subscriber.objects.get_or_create(
                subscriber_list=sub_list,
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name']
                }
            )
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully added {created_count} subscribers to "{sub_list.name}" for user {user.username}'))
