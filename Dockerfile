FROM php:8.2-apache

# Fix MPM conflict
RUN a2dismod mpm_event mpm_worker 2>/dev/null || true \
    && a2enmod mpm_prefork rewrite

# Instalar extensión mysqli
RUN docker-php-ext-install mysqli

# Copiar archivos al servidor
COPY . /var/www/html/

# Permisos
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
