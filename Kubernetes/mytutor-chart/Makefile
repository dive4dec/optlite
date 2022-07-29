val_path="./values.yaml"

lint:
	microk8s helm3 lint
debug:
	microk8s helm3 template --debug .
save_debug:
	microk8s helm3 template --debug . > result.yaml
install:
	microk8s helm3 install mytutor . \
	--namespace mytutor --create-namespace \
	--values $(val_path) 
upgrade:
	microk8s helm3 upgrade mytutor . \
	--namespace mytutor \
	--values $(val_path) 

uninstall:
	microk8s helm3 uninstall mytutor \
	--namespace mytutor

enable_tls:
	microk8s helm3 upgrade mytutor . \
	--namespace mytutor \
	--set tls.enable=true

disable_tls:
	microk8s helm3 upgrade mytutor . \
	--namespace mytutor \
	--set tls.enable=false
