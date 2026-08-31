#!/bin/sh
set -e

# 平台注入的端口（Render 默认 10000，Railway 随机），默认 80
PORT="${PORT:-80}"
sed -i "s/^Listen 80\$/Listen $PORT/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:$PORT>/" /etc/apache2/sites-enabled/000-default.conf

echo "ServerName localhost" >> /etc/apache2/apache2.conf

# 持久化（可选）：挂载了 Volume/Disk 时设置 ERINSON_DATA_DIR
# 数据库与上传图片会存到该目录，重新部署不丢失
if [ -n "$ERINSON_DATA_DIR" ]; then
    mkdir -p "$ERINSON_DATA_DIR/uploads"
    chown -R www-data:www-data "$ERINSON_DATA_DIR"
    cat > /etc/apache2/conf-available/storage.conf <<EOF
Alias /admin/uploads $ERINSON_DATA_DIR/uploads
<Directory $ERINSON_DATA_DIR/uploads>
    Require all granted
</Directory>
EOF
    a2enconf storage
fi

exec apache2-foreground
