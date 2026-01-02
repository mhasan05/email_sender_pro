from rest_framework import serializers
from .models import EmailTemplate, SubscriberList, Subscriber, Campaign, EmailLog, SMTPConfiguration

class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

class SubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscriber
        fields = '__all__'

class SubscriberListSerializer(serializers.ModelSerializer):
    subscriber_count = serializers.IntegerField(source='subscribers.count', read_only=True)
    
    class Meta:
        model = SubscriberList
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class SMTPConfigurationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True) # Hide password in responses
    
    class Meta:
        model = SMTPConfiguration
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = '__all__'
