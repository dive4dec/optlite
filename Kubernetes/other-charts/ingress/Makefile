cert="/etc/letsencrypt/live/mytutor.cs.cityu.edu.hk/cert.pem"
key="/etc/letsencrypt/live/mytutor.cs.cityu.edu.hk/privkey.pem"
create_tls:
	kubectl delete secret mytutor-tls \
	-n mytutor \
	--ignore-not-found=true

	kubectl create secret tls mytutor-tls \
	--namespace mytutor \
	--cert $(cert) \
	--key $(key)