install:
	kubectl apply -f ./

#http://127.0.0.1:8070//api/v1/namespaces/logging/services/kibana-logging/proxy/
#logstash-* 
start:
	kubectl proxy --address='127.0.0.1' --port=8070 --accept-hosts='^*$$' 