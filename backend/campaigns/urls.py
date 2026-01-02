from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, SubscriberListViewSet, CampaignViewSet, SMTPConfigurationViewSet, SubscriberViewSet

router = DefaultRouter()
router.register(r'templates', EmailTemplateViewSet, basename='template')
router.register(r'lists', SubscriberListViewSet, basename='list')
router.register(r'subscribers', SubscriberViewSet, basename='subscriber')
router.register(r'smtp', SMTPConfigurationViewSet, basename='smtp')
router.register(r'', CampaignViewSet, basename='campaign')

urlpatterns = [
    path('', include(router.urls)),
]
