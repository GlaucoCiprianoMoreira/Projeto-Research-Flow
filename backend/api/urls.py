from django.urls import path

from .views import get_status, search_articles_view, summarize_article
urlpatterns = [
    path('status/', get_status, name='get_status'),
    path('search-articles/', search_articles_view, name='search_articles_view'),
    path('summarize-article/', summarize_article, name='summarize_article'),
]
