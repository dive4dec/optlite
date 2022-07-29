dev_host="mytutorlocal.app"
prod_host="mytutor.cs.cityu.edu.hk"
# Environment variable
env="dev"
dev_name=dev
# TLS variable
cert="/etc/letsencrypt/live/mytutor.cs.cityu.edu.hk/cert.pem"
key="/etc/letsencrypt/live/mytutor.cs.cityu.edu.hk/privkey.pem"
# Add mytutor based on environment
add_mytutor_dev:
	make -C ./mytutor-chart install val_path="./values/values.dev.yaml"
add_mytutor_prod:
	make -C ./mytutor-chart install val_path="./values/values.prod.yaml"
add_mytutor:
	make -C ./mytutor-chart install

add_prometheus:
	microk8s helm3 repo add prometheus-community https://prometheus-community.github.io/helm-charts
	microk8s helm3 repo update
add_grafana:
	microk8s helm3 repo add prometheus-community https://prometheus-community.github.io/helm-charts
	microk8s helm3 repo update
upgrade_prometheus:
	microk8s helm3 upgrade prometheus prometheus-community/kube-prometheus-stack \
	--namespace monitoring --create-namespace \
	--values ./other-charts/monitoring/prometheus.values.yaml
upgrade_grafana:
	microk8s helm3 upgrade grafana grafana/grafana \
	--namespace monitoring --create-namespace \
	--values ./other-charts/monitoring/grafana.values.yaml
enable_ingress:
	microk8s helm3 upgrade --install ingress-nginx ingress-nginx \
	--repo https://kubernetes.github.io/ingress-nginx \
	--namespace ingress-nginx --create-namespace \
	--values ./other-charts/ingress/nginx.values.yaml

enable_monitor_ingress:
# setup monitoring ingress
	microk8s helm3 upgrade --install ingress-nginx ingress-nginx \
	--repo https://kubernetes.github.io/ingress-nginx \
	--namespace ingress-nginx \
	--values ./other-charts/ingress/nginx.monitoring.values.yaml

enable_monitoring: add_prometheus upgrade_prometheus add_grafana upgrade_grafana enable_monitor_ingress

# TLS Config
# 1. TLS secret key
# 2. Ingress global TLS
# 3. Enable mytutor TLS
enable_tls:
	make -C ./other-charts/ingress \
	key="$(key)" \
	cert="$(cert)"

	microk8s helm3 upgrade ingress-nginx ingress-nginx \
	--repo https://kubernetes.github.io/ingress-nginx \
	--namespace ingress-nginx --create-namespace \
	--set-string controller.default-ssl-certificate="mytutor/mytutor-tls"

# Mytutor config
# 1. Add mytutor helm chart
# 2. Add ngginx ingress
enable_mytutor_dev: add_mytutor_dev
enable_mytutor_prod: add_mytutor_prod


enable_mytutor_tls_dev: enable_mytutor_dev enable_tls
enable_mytutor_tls_prod: enable_mytutor_prod enable_tls

enable_all_dev: enable_mytutor_tls_dev enable_monitoring
enable_all_prod: enable_mytutor_tls_prod enable_monitoring

uninstall_mytutor:
	make -C ./mytutor-chart uninstall
disable_mytutor: uninstall_mytutor
disable_ingress:
	microk8s helm3 uninstall ingress-nginx -n ingress-nginx

upgrade_mytutor_prod:
	make -C ./mytutor-chart upgrade val_path="./values/values.prod.yaml"

upgrade_mytutor_dev:
	make -C ./mytutor-chart upgrade val_path="./values/values.dev.yaml"
# Disable prometheus and grafana
# The nginx ingress won't be reset 
disable_monitoring:
	microk8s helm3 uninstall prometheus -n monitoring
	microk8s helm3 uninstall grafana -n monitoring