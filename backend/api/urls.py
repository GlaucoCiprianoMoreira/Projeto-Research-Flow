from django.urls import path
# Garanta que a nova view "search_articles_view" foi importada
from .views import get_status, search_articles_view, analyze_article_view 

urlpatterns = [
    path('status/', get_status, name='get-status'),
    # Adicione esta linha para registrar o novo endereço
    path('search/', search_articles_view, name='search-articles'), 
    path('analyze/', analyze_article_view, name='analyze-article'),
]