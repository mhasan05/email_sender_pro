import pandas as pd
from rest_framework import viewsets, status, decorators
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from .models import EmailTemplate, SubscriberList, Subscriber, Campaign, EmailLog, SMTPConfiguration
from .serializers import (
    EmailTemplateSerializer, SubscriberListSerializer, 
    SubscriberSerializer, CampaignSerializer, EmailLogSerializer,
    SMTPConfigurationSerializer
)
from .tasks import send_campaign_emails

class EmailTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = EmailTemplateSerializer
    
    def get_queryset(self):
        return EmailTemplate.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SubscriberViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriberSerializer
    
    def get_queryset(self):
        # Allow filtering by list_id
        queryset = Subscriber.objects.filter(subscriber_list__user=self.request.user)
        list_id = self.request.query_params.get('list_id')
        if list_id:
            queryset = queryset.filter(subscriber_list_id=list_id)
        return queryset

    def perform_create(self, serializer):
        # Ensure the list belongs to the user
        subscriber_list = serializer.validated_data['subscriber_list']
        if subscriber_list.user != self.request.user:
            raise serializers.ValidationError("You cannot add subscribers to a list you do not own.")
        serializer.save()

class SubscriberListViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriberListSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        return SubscriberList.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @decorators.action(detail=True, methods=['post'], url_path='upload')
    def upload_file(self, request, pk=None):
        subscriber_list = self.get_object()
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            elif file_obj.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_obj)
            else:
                return Response({"error": "Unsupported file format"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Basic normalization
            df.columns = [c.lower().replace(' ', '_') for c in df.columns]
            
            subscribers_to_create = []
            for _, row in df.iterrows():
                email = row.get('email')
                if not email or pd.isna(email):
                    continue
                
                # Check duplicates in current batch (basic)
                extra_data = row.to_dict()
                extra_data.pop('email', None)
                first_name = extra_data.pop('first_name', '')
                last_name = extra_data.pop('last_name', '')

                subscribers_to_create.append(Subscriber(
                    subscriber_list=subscriber_list,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    extra_data=extra_data
                ))
            
            Subscriber.objects.bulk_create(subscribers_to_create, ignore_conflicts=True)
            
            return Response({"status": "success", "count": len(subscribers_to_create)})
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SMTPConfigurationViewSet(viewsets.ModelViewSet):
    serializer_class = SMTPConfigurationSerializer

    def get_queryset(self):
        return SMTPConfiguration.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CampaignViewSet(viewsets.ModelViewSet):
    serializer_class = CampaignSerializer

    def get_queryset(self):
        return Campaign.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        campaign = serializer.save(user=self.request.user)
        
        # If scheduled_at is provided, set status to scheduled
        if campaign.scheduled_at:
            campaign.status = 'scheduled'
            campaign.save()

    @decorators.action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status not in ['draft', 'scheduled']:
             return Response({"error": "Campaign is not in draft or scheduled status"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not campaign.smtp_config:
            return Response({"error": "No SMTP Configuration selected for this campaign"}, status=status.HTTP_400_BAD_REQUEST)

        campaign.status = 'processing'
        campaign.save()
        
        # Trigger Celery Task
        try:
            send_campaign_emails.delay(campaign.id)
        except Exception as e:
            campaign.status = 'failed'
            campaign.save()
            return Response({"error": f"Failed to enqueue send task: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({"status": "Campaign queued for sending"})
