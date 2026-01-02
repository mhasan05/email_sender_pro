from celery import shared_task
from django.core.mail import send_mail, get_connection
from django.template import Template, Context
from django.utils import timezone
from .models import Campaign, EmailLog, Subscriber
import time

@shared_task(bind=True)
def check_and_send_scheduled_campaigns(self):
    """Periodic task to check for scheduled campaigns and send them"""
    now = timezone.now()
    scheduled_campaigns = Campaign.objects.filter(
        status='scheduled',
        scheduled_at__lte=now
    )
    
    for campaign in scheduled_campaigns:
        # Send the campaign
        send_campaign_emails.delay(campaign.id)
    
    return f"Checked {scheduled_campaigns.count()} scheduled campaigns"

@shared_task(bind=True)
def send_campaign_emails(self, campaign_id):
    try:
        campaign = Campaign.objects.get(id=campaign_id)
    except Campaign.DoesNotExist:
        return "Campaign not found"

    if not campaign.smtp_config:
        campaign.status = 'failed'
        campaign.save()
        return "No SMTP config found"

    subscribers = Subscriber.objects.filter(subscriber_list__in=campaign.subscriber_lists.all()).distinct()
    
    # Update status
    campaign.status = 'processing'
    campaign.save()

    total_sent = 0
    total_failed = 0

    # Basic template rendering
    if campaign.template:
        email_template = Template(campaign.template.html_content)
    else:
        email_template = Template("{{ content }}") # Fallback

    # Configure connection
    connection = get_connection(
        host=campaign.smtp_config.host,
        port=campaign.smtp_config.port,
        username=campaign.smtp_config.username,
        password=campaign.smtp_config.password,
        use_tls=campaign.smtp_config.use_tls,
        use_ssl=campaign.smtp_config.use_ssl
    )

    try:
        connection.open()
    except Exception as e:
        campaign.status = 'failed'
        campaign.save()
        return f"SMTP Connection failed: {str(e)}"

    for subscriber in subscribers:
        # Check if already sent (if retrying)
        if EmailLog.objects.filter(campaign=campaign, subscriber=subscriber, status='sent').exists():
            continue

        try:
            # Context for template
            context_data = {
                'email': subscriber.email,
                'first_name': subscriber.first_name,
                'last_name': subscriber.last_name,
                **subscriber.extra_data
            }
            context = Context(context_data)
            html_content = email_template.render(context)
            
            # Send Email
            send_mail(
                subject=campaign.subject,
                message="", # Text content (optional)
                html_message=html_content,
                from_email=campaign.smtp_config.from_email,
                recipient_list=[subscriber.email],
                fail_silently=False,
                connection=connection # Use custom connection
            )
            
            # Log success
            EmailLog.objects.update_or_create(
                campaign=campaign,
                subscriber=subscriber,
                defaults={'status': 'sent', 'sent_at': time.strftime('%Y-%m-%d %H:%M:%S%z')} # simplistic timestamp
            )
            total_sent += 1

        except Exception as e:
            # Log failure
            EmailLog.objects.update_or_create(
                campaign=campaign,
                subscriber=subscriber,
                defaults={'status': 'failed', 'error_message': str(e)}
            )
            total_failed += 1
            
        # Throttling (very basic)
        # In real world, use Celery rate limits or a leaky bucket
        # time.sleep(0.1) 
    
    connection.close()
    campaign.status = 'completed'
    campaign.save()
    
    return f"Campaign {campaign_id} finished: {total_sent} sent, {total_failed} failed."
