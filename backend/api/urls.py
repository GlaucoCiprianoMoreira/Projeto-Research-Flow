from django.urls import path

# CORREÇÃO AQUI: Importe 'summarize_article_view', não 'summarize_article'
from .views import get_status, search_articles_view, summarize_article_view

urlpatterns = [
    path('status/', get_status, name='get_status'),
    path('search/', search_articles_view, name='search_articles_view'),
    path('summarize/', summarize_article_view, name='summarize_article'),
]