from django.contrib import admin
from django.urls import path, include
# Importações para o drf-spectacular
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),

    # Rotas da Documentação (Swagger)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Interface do Swagger UI:
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Interface do ReDoc (outra opção de visualização):
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]