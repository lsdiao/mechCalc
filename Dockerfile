FROM php:8.2-apache

# 启用 rewrite 并允许 .htaccess（用于保护 SQLite 数据库文件不被直接下载）
RUN a2enmod rewrite \
    && printf '<Directory /var/www/html>\n    AllowOverride All\n</Directory>\n' \
        > /etc/apache2/conf-available/allow-htaccess.conf \
    && a2enconf allow-htaccess

COPY start.sh /start.sh
RUN chmod +x /start.sh

COPY . /var/www/html/

# admin 目录运行时需要写权限（SQLite 数据库 + 上传图片）
RUN chown -R www-data:www-data /var/www/html/admin

EXPOSE 80
CMD ["/start.sh"]
